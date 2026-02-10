import { Controller, Get, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('legal')
export class LegalController {
  @Get('privacy-policy')
  getPrivacyPolicy(@Res() res: Response) {
    const templatePath = path.join(process.cwd(), 'templates', 'privacy-policy.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new NotFoundException('Privacy policy not found');
    }

    const html = fs.readFileSync(templatePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('terms-of-use')
  getTermsOfUse(@Res() res: Response) {
    const templatePath = path.join(process.cwd(), 'templates', 'term-of-use.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new NotFoundException('Terms of use not found');
    }

    const html = fs.readFileSync(templatePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
