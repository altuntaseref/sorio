import { Controller, Get, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('legal')
export class LegalController {
  private getTemplatePath(filename: string): string {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'templates', filename), // Production: /app/templates
      path.join(process.cwd(), '..', 'templates', filename), // Development: ../templates
      path.join(__dirname, '..', '..', '..', 'templates', filename), // From dist/src/legal
      path.join(__dirname, '..', '..', 'templates', filename), // Alternative
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        return templatePath;
      }
    }

    // If none found, return the first one (will throw error)
    return possiblePaths[0];
  }

  @Get('privacy-policy')
  getPrivacyPolicy(@Res() res: Response) {
    const templatePath = this.getTemplatePath('privacy-policy.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new NotFoundException(`Privacy policy not found. Searched paths: ${process.cwd()}`);
    }

    const html = fs.readFileSync(templatePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('terms-of-use')
  getTermsOfUse(@Res() res: Response) {
    const templatePath = this.getTemplatePath('term-of-use.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new NotFoundException(`Terms of use not found. Searched paths: ${process.cwd()}`);
    }

    const html = fs.readFileSync(templatePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
