import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private promptTemplate: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.modelName = this.configService.get<string>('OPENAI_MODEL_NAME') || 'gpt-4o';
    
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
    }

    this.logger.log(`Using OpenAI model: ${this.modelName}`);

    // Load prompt template
    this.loadPromptTemplate();
  }

  private loadPromptTemplate() {
    try {
      const promptPath = path.join(process.cwd(), 'src', 'questions', 'prompts', 'ai-solve.prompt.txt');
      if (fs.existsSync(promptPath)) {
        const fileContent = fs.readFileSync(promptPath, 'utf-8').trim();
        
        // Try to parse as JSON first (for structured prompts)
        try {
          const parsed = JSON.parse(fileContent);
          if (parsed.content) {
            this.promptTemplate = parsed.content;
          } else {
            this.promptTemplate = fileContent;
          }
        } catch {
          // If not JSON, use as plain text
          this.promptTemplate = fileContent;
        }
      } else {
        // Fallback prompt
        this.promptTemplate = `Sen bir matematik ve fen bilimleri soru çözüm asistanısın. 
Kullanıcının gönderdiği soru görselini analiz et ve detaylı bir çözüm sun.

Çözüm formatı:
1. Soruyu anlama ve verilen bilgileri belirleme
2. Çözüm adımlarını sırayla açıklama
3. Sonucu net bir şekilde belirtme

Türkçe olarak, öğrencinin anlayabileceği şekilde, adım adım çözümü sun.`;
        this.logger.warn('Prompt file not found, using default prompt');
      }
    } catch (error) {
      this.logger.error('Failed to load prompt template', error);
      this.promptTemplate = 'Bu soruyu detaylı bir şekilde çöz ve açıkla.';
    }
  }

  async solveQuestion(imageUrl: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      // OpenAI Vision API format
      const requestBody = {
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.promptTemplate,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenAI API error: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      let solution = data.choices[0].message.content;
      
      // Clean markdown formatting for mobile display
      solution = this.cleanMarkdown(solution);
      
      return solution;
    } catch (error) {
      this.logger.error('Error calling OpenAI API', error);
      throw error;
    }
  }

  /**
   * Removes markdown formatting and converts to plain text suitable for mobile
   */
  private cleanMarkdown(text: string): string {
    if (!text) return text;

    // Remove markdown headers (###, ##, #)
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove bold (**text** or __text__)
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    
    // Remove italic (*text* or _text_)
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    
    // Remove inline code (`code`)
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // Remove code blocks (```code```)
    text = text.replace(/```[\s\S]*?```/g, '');
    
    // Remove links [text](url)
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove strikethrough (~~text~~)
    text = text.replace(/~~([^~]+)~~/g, '$1');
    
    // Clean up multiple newlines (max 2 consecutive)
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Trim whitespace
    text = text.trim();
    
    return text;
  }

}
