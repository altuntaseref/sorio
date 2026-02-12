import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { R2Service } from '../upload/r2.service';
import { User } from '../users/entities/user.entity';
import puppeteer from 'puppeteer-core';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import * as fs from 'fs';

interface PdfOptions {
  title?: string;
  questionsPerPage?: number;
  columns?: number;
}

export interface PdfResult {
  downloadUrl: string;
  previewUrl?: string; // PNG önizleme URL'i
  expiresIn: number; // Saniye cinsinden (15 dakika = 900)
}

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private r2Service: R2Service,
  ) {}

  /**
   * Soruları PDF formatına dönüştürür ve R2'ye yükler
   */
  async generatePdf(
    userId: string,
    questionIds: string[],
    options: PdfOptions = {},
    preview: boolean = false,
  ): Promise<PdfResult> {
    const { title = 'Sorular' } = options;

    if (!questionIds || questionIds.length === 0) {
      throw new NotFoundException('No questions provided');
    }

    // Soruları veritabanından çek
    const questions = await this.questionsRepository.find({
      where: questionIds.map((id) => ({ id, userId })),
      relations: ['subject', 'topic'],
      order: {
        createdAt: 'ASC',
      },
    });

    if (questions.length === 0) {
      throw new NotFoundException('No questions found');
    }

    // Kullanıcının erişim kontrolü
    const unauthorizedQuestions = questionIds.filter(
      (id) => !questions.some((q) => q.id === id),
    );
    if (unauthorizedQuestions.length > 0) {
      throw new ForbiddenException(
        'You do not have access to some of the selected questions',
      );
    }

    // Kullanıcı bilgilerini al (userName için)
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    const userName = user
      ? `${user.firstName} ${user.lastName}`.trim() || user.email
      : 'Kullanıcı';

    // HTML şablonunu oluştur
    const htmlContent = this.generateHtmlTemplate(
      questions,
      title,
      userName,
      preview, // Önizleme modunda sadece ilk sayfa
    );

    // Puppeteer ile PDF oluştur
    const pdfBuffer = await this.htmlToPdf(htmlContent);

    // R2'ye yükle
    const timestamp = Date.now();
    const fileName = `sorular_${timestamp}.pdf`;
    const key = `temp/pdfs/${userId}/${fileName}`;

    const downloadUrl = await this.uploadToR2(
      pdfBuffer,
      key,
      'application/pdf',
    );

    const result: PdfResult = {
      downloadUrl,
      expiresIn: 900, // 15 dakika
    };

    // Önizleme modunda: PDF'in ilk sayfasını PNG'ye çevir
    if (preview) {
      try {
        const previewBuffer = await this.generatePreviewImage(pdfBuffer);
        if (previewBuffer) {
          const previewKey = `temp/previews/${userId}/preview_${timestamp}.png`;
          result.previewUrl = await this.uploadToR2(
            previewBuffer,
            previewKey,
            'image/png',
          );
        } else {
          // PNG oluşturulamazsa PDF URL'ini kullan
          result.previewUrl = downloadUrl;
        }
      } catch (error) {
        console.error('Failed to generate preview image:', error);
        // Hata durumunda PDF URL'ini önizleme olarak kullan
        result.previewUrl = downloadUrl;
      }
    }

    return result;
  }

  /**
   * HTML şablonunu oluşturur
   */
  private generateHtmlTemplate(
    questions: Question[],
    documentTitle: string,
    userName: string,
    previewOnly: boolean = false,
  ): string {
    const date = new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Soruları 2'şer 2'şer grupla
    const questionGroups: Question[][] = [];
    for (let i = 0; i < questions.length; i += 2) {
      questionGroups.push(questions.slice(i, i + 2));
    }

    // Önizleme modunda sadece ilk sayfa
    const groupsToRender = previewOnly
      ? questionGroups.slice(0, 1)
      : questionGroups;

    // Her grup için sayfa oluştur
    const pagesHtml = groupsToRender
      .map((group, pageIndex) => {
        const q1 = group[0];
        const q2 = group[1];

        // Cevap anahtarı
        const answers = group
          .map((q, idx) => `${pageIndex * 2 + idx + 1}-${q.correctAnswer}`)
          .join(' &nbsp;|&nbsp; ');

        return `
      <!-- SAYFA ${pageIndex + 1} -->
      <div class="page">
        
        <!-- Header -->
        <div class="header">
          <div class="header-title">${this.escapeHtml(documentTitle)}</div>
          <div class="header-info">
            <div>${this.escapeHtml(userName)}</div>
            <div>${date}</div>
          </div>
        </div>

        <!-- Sorular -->
        <div class="questions-wrapper">
          
          <!-- Soru ${pageIndex * 2 + 1} -->
          <div class="question-card">
            <div class="q-header">
              <div class="q-number">${pageIndex * 2 + 1}</div>
              <div class="q-tag">${this.escapeHtml(
                q1.subject?.name || '',
              )} • ${this.escapeHtml(q1.topic?.name || '')}</div>
            </div>
            <div class="q-image-container">
              ${
                q1.questionImageUrl
                  ? `<img src="${this.escapeHtml(
                      q1.questionImageUrl,
                    )}" class="q-image" />`
                  : '<div style="text-align: center; color: #999; padding: 20px;">Görsel yok</div>'
              }
            </div>
          </div>

          ${
            q2
              ? `
          <!-- Soru ${pageIndex * 2 + 2} -->
          <div class="question-card">
            <div class="q-header">
              <div class="q-number">${pageIndex * 2 + 2}</div>
              <div class="q-tag">${this.escapeHtml(
                q2.subject?.name || '',
              )} • ${this.escapeHtml(q2.topic?.name || '')}</div>
            </div>
            <div class="q-image-container">
              ${
                q2.questionImageUrl
                  ? `<img src="${this.escapeHtml(
                      q2.questionImageUrl,
                    )}" class="q-image" />`
                  : '<div style="text-align: center; color: #999; padding: 20px;">Görsel yok</div>'
              }
            </div>
          </div>
          `
              : `
          <!-- Boş Soru Alanı -->
          <div class="question-card" style="opacity: 0.3;">
            <div class="q-header">
              <div class="q-number">${pageIndex * 2 + 2}</div>
              <div class="q-tag">-</div>
            </div>
            <div class="q-image-container">
              <div style="text-align: center; color: #999; padding: 20px;">Boş</div>
            </div>
          </div>
          `
          }

        </div>

        <!-- Cevap Anahtarı Şeridi -->
        <div class="answer-key-strip">
          CEVAPLAR: ${answers}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="brand">
            <span>Soru Defterim ile oluşturuldu</span>
          </div>
          <div>www.sorudefterim.com</div>
        </div>

      </div>
    `;
      })
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Temel Ayarlar */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; color: #333; }
    
    .page { 
      width: 210mm; height: 297mm; /* A4 */
      padding: 15mm 10mm 10mm 10mm; /* Üst, Sağ, Alt, Sol */
      box-sizing: border-box; 
      position: relative;
      page-break-after: always;
      background: #fff;
    }

    /* --- HEADER --- */
    .header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px; margin-bottom: 20px;
    }
    .header-title { font-size: 16px; font-weight: 700; text-transform: uppercase; }
    .header-info { font-size: 12px; color: #666; text-align: right; }

    /* --- SORU ALANI (2 Soru Düzeni) --- */
    .questions-wrapper {
      display: flex; flex-direction: column; gap: 12px;
      height: 220mm; /* Sabit yükseklik: Header (25mm) + Sorular (220mm) + Footer/Cevap (42mm) = 287mm */
      margin-top: 5mm; /* Header'dan sonra boşluk */
    }

    .question-card {
      height: 104mm; /* Her soru sabit yükseklik: (220mm - 12mm gap) / 2 = 104mm */
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 8px; /* Padding'i azalt, görsel için daha fazla alan */
      position: relative;
      display: flex; flex-direction: column;
      overflow: hidden; /* Taşmayı önle */
      box-sizing: border-box;
    }

    .q-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px; /* Margin'i azalt */
      flex-shrink: 0; /* Header boyutunu sabit tut */
    }

    .q-number {
      background: #000; color: #fff;
      width: 28px; height: 28px; border-radius: 50%;
      text-align: center; line-height: 28px; font-weight: bold; font-size: 14px;
    }

    /* Konu Etiketi (Badge) */
    .q-tag {
      background: #f3f4f6; color: #4b5563;
      padding: 4px 12px; border-radius: 12px;
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; border: 1px solid #e5e7eb;
    }

    .q-image-container {
      flex: 1; /* Kalan alanı kapla */
      display: flex; justify-content: center; align-items: center;
      overflow: hidden;
      width: 100%;
      min-height: 0; /* Flex overflow için gerekli */
      position: relative;
      /* Görsel için daha fazla alan - container'ın tamamını kullan */
    }

    .q-image {
      width: 100%;
      height: 100%;
      object-fit: contain; /* 3:4 oranını koru, görseli sığdır */
      display: block;
      /* Görseli mümkün olduğunca büyük göster */
      max-width: 100%;
      max-height: 100%;
    }

    /* --- CEVAP ANAHTARI ŞERİDİ --- */
    .answer-key-strip {
      position: absolute; bottom: 18mm; left: 10mm; right: 10mm;
      background: #f8f9fa;
      border: 1px dashed #ccc;
      padding: 8px;
      text-align: center;
      font-size: 11px; font-weight: 600; letter-spacing: 1px;
      color: #555;
    }

    /* --- FOOTER --- */
    .footer {
      position: absolute; bottom: 8mm; left: 10mm; right: 10mm;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 9px; color: #999;
      border-top: 1px solid #eee; padding-top: 5px;
    }
    
    .brand { display: flex; align-items: center; gap: 5px; }
    .brand img { height: 14px; }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>
    `;
  }

  /**
   * Chromium executable path'ini bulur
   */
  private getChromiumPath(): string {
    // 1. Docker ENV (Dockerfile'dan gelen)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // 2. Local Development (Windows/Mac)
    const platform = process.platform;
    if (platform === 'win32') {
       // Windows'taki Chrome yolunu buraya yazabilirsin veya boş bırakıp puppeteer'ın indirdiğini kullanmasını sağlayabilirsin
       // return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; 
    }
    
    // Varsayılan (ENV yoksa null dönsün, puppeteer kendi yolunu dener)
    return '/usr/bin/chromium'; 
  }

  /**
   * HTML'i PDF'e çevirir
   */
  private async htmlToPdf(htmlContent: string): Promise<Buffer> {
    let browser: any = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: this.getChromiumPath(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Görsellerin yüklenmesini bekle
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // PDF oluştur
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      await browser.close();
      browser = null;

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore
        }
      }
      throw error;
    }
  }

  /**
   * PDF'in ilk sayfasını PNG'ye çevirir (önizleme için)
   */
  private async generatePreviewImage(pdfBuffer: Buffer): Promise<Buffer | null> {
    let browser: any = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: this.getChromiumPath(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Docker için kritik (hafıza yönetimi)
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--single-process', // Bazen Docker'da gerekli olabilir
          '--no-zygote',
        ],
      });

      const page = await browser.newPage();
      
      // PDF'i base64 data URL olarak yükle ve PDF.js ile render et
      const base64Pdf = pdfBuffer.toString('base64');
      
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
            <style>
              body {
                margin: 0;
                padding: 0;
                background: white;
              }
              #pdf-container {
                width: 800px;
                height: 1131px;
                overflow: hidden;
              }
              canvas {
                display: block;
              }
            </style>
          </head>
          <body>
            <div id="pdf-container"></div>
            <script>
              const pdfData = atob('${base64Pdf}');
              const pdfjsLib = window['pdfjs-dist/build/pdf'];
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              
              const loadingTask = pdfjsLib.getDocument({ data: pdfData });
              loadingTask.promise.then(function(pdf) {
                return pdf.getPage(1);
              }).then(function(page) {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };
                
                page.render(renderContext).promise.then(function() {
                  document.getElementById('pdf-container').appendChild(canvas);
                });
              });
            </script>
          </body>
        </html>
      `, { waitUntil: 'networkidle0' });

      // PDF render'ının tamamlanmasını bekle
      await page.waitForSelector('canvas', { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Canvas elementinin screenshot'ını al
      const canvas = await page.$('canvas');
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      const screenshot = await canvas.screenshot({
        type: 'png',
      });

      await browser.close();
      browser = null;

      return screenshot as Buffer;
    } catch (error) {
      console.error('Failed to generate preview image:', error);
      
      // Browser'ı kapat
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore
        }
      }

      return null;
    }
  }

  /**
   * Buffer'ı R2'ye yükler
   */
  private async uploadToR2(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    return this.r2Service.uploadBuffer(buffer, key, contentType, 900);
  }

  /**
   * HTML escape
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
