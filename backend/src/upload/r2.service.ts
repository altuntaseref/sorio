import { Injectable, NotFoundException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (
      !accountId ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucketName
    ) {
      throw new Error('Missing Cloudflare R2 environment variables');
    }

    this.s3Client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucketName = bucketName;
    // R2_PUBLIC_URL opsiyonel - yoksa presigned GET URL kullanılacak
    this.publicUrl = publicUrl || '';
  }

  generateFileKey(
    fileType: 'question' | 'solution' | 'asset',
    userId: string,
    fileName: string,
  ): string {
    const timestamp = Date.now();
    if (fileType === 'asset') {
      return `assets/${userId}/${timestamp}-${fileName}`;
    }
    return `${fileType}s/${userId}/${timestamp}-${fileName}`;
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900,
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    // Presigned URL for uploading (PUT)
    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, putCommand, { expiresIn });

    // Public URL: R2_PUBLIC_URL varsa kullan, yoksa presigned GET URL kullan (SSL sorunlarını önler)
    let publicUrl: string;
    if (this.publicUrl && this.publicUrl.startsWith('https://')) {
      // Custom domain veya doğru yapılandırılmış public URL kullan
      publicUrl = `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    } else {
      // Presigned GET URL kullan (SSL sorunlarını önler, 1 yıl geçerli)
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      publicUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn: 31536000 });
    }

    return { uploadUrl, publicUrl, key };
  }

  async deleteObject(key: string): Promise<void> {
    // Check if the file exists before attempting to delete it
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      if (error.name === 'NotFound') {
        throw new NotFoundException('File not found.');
      }
      throw error; // Re-throw other errors
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Buffer'ı R2'ye yükler ve public URL döner
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    expiresIn: number = 900, // 15 dakika
  ): Promise<string> {
    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(putCommand);

    // Public URL oluştur
    if (this.publicUrl && this.publicUrl.startsWith('https://')) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }

    // Presigned GET URL oluştur
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn,
    });

    return signedUrl;
  }
}
