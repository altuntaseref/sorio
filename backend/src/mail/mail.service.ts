import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly resend: Resend | null;
  private readonly fromAddress: string | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.fromAddress = this.configService.get<string>('RESEND_FROM') || null;
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendPasswordReset(email: string, token: string) {
    if (!this.resend || !this.fromAddress) {
      return false;
    }

    const deepLink = `sorio://reset-password?token=${token}`;
    
    // Redirect URL'i oluştur (e-posta istemcilerinde çalışması için https:// gerekli)
    // Bu sayfa JavaScript ile deep link'e yönlendirecek
    const backendUrl = this.configService.get<string>('BACKEND_URL') || this.configService.get<string>('API_URL') || 'https://api.sorui.bdd.technologies.com';
    const redirectUrl = `${backendUrl}/api/auth/redirect?token=${token}`;

    // Template dosyasını oku (root dizinde)
    // Önce root dizininde dene, sonra bir üst dizinde
    let templatePath = path.join(process.cwd(), 'mail-template.html');
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), '..', 'mail-template.html');
    }
    
    let htmlTemplate = '';
    
    try {
      htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
      // Web URL'i kullan (e-posta istemcilerinde çalışması için)
      // Deep link'i de fallback olarak ekle
      htmlTemplate = htmlTemplate.replace(/\{\{DEEP_LINK\}\}/g, redirectUrl);
    } catch (error) {
      console.warn('Template dosyası okunamadı, basit HTML kullanılıyor:', error);
      htmlTemplate = `<p>Şifreni sıfırlamak için bağlantıya tıkla:</p><p><a href="${redirectUrl}">${redirectUrl}</a></p>`;
    }

    await this.resend.emails.send({
      from: this.fromAddress,
      to: email,
      subject: 'Şifre sıfırlama',
      text: `Şifreni sıfırlamak için bağlantıya tıkla: ${deepLink}`,
      html: htmlTemplate,
    });

    return true;
  }
}

