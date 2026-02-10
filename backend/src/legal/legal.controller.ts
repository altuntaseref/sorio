import { Controller, Get, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('legal')
export class LegalController {
  private getTemplatePath(filename: string): string {
    const templatePath = path.join(__dirname, 'templates', filename);
  
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }
  
    throw new NotFoundException(
      `Template not found: ${filename}. ` +
      `Path: ${templatePath}, ` +
      `__dirname: ${__dirname}, ` +
      `cwd: ${process.cwd()}`
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
