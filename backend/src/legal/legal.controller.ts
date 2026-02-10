import { Controller, Get, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('legal')
export class LegalController {
  private getTemplatePath(filename: string): string {
    // Templates are in src/legal/templates, which gets compiled to dist/src/legal/templates
    // __dirname in production is /app/dist/src/legal
    // So we need to go: ./templates/filename
    const templatePath = path.join(__dirname, 'templates', filename);
    
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }

    // Fallback: try other possible paths
    const fallbackPaths = [
      path.join(__dirname, '..', 'legal', 'templates', filename),
      path.join(process.cwd(), 'templates', filename),
      path.join(process.cwd(), 'dist', 'src', 'legal', 'templates', filename),
    ];

    for (const fallbackPath of fallbackPaths) {
      if (fs.existsSync(fallbackPath)) {
        return fallbackPath;
      }
    }

    // If none found, throw error with debug info
    throw new NotFoundException(
      `Template not found: ${filename}. ` +
      `Searched: ${templatePath}, ` +
      `cwd: ${process.cwd()}, ` +
      `__dirname: ${__dirname}`
    );
  }

  @Get('privacy-policy')
  getPrivacyPolicy(@Res() res: Response) {
    try {
      const templatePath = this.getTemplatePath('privacy-policy.html');
      const html = fs.readFileSync(templatePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      throw error;
    }
  }

  @Get('terms-of-use')
  getTermsOfUse(@Res() res: Response) {
    try {
      const templatePath = this.getTemplatePath('term-of-use.html');
      const html = fs.readFileSync(templatePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      throw error;
    }
  }
}
