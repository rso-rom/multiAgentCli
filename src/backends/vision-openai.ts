import axios from 'axios';
import { ImageInput, imageHandler } from '../utils/image-handler';

export interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

/**
 * OpenAI GPT-4 Vision backend
 */
export class VisionOpenAI {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-4o'; // Supports vision

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenAI API key required for vision models. Set OPENAI_API_KEY environment variable.');
    }
  }

  /**
   * Send prompt with image(s) to GPT-4 Vision
   */
  async generate(prompt: string, images: ImageInput[], options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    // Build message content
    const content: VisionMessage['content'] = [
      { type: 'text', text: prompt },
    ];

    // Add images
    for (const image of images) {
      content.push(imageHandler.formatForOpenAI(image) as { type: 'image_url'; image_url: { url: string } });
    }

    const response = await axios.post(
      this.baseUrl,
      {
        model: this.model,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Analyze a single screenshot
   */
  async analyzeScreenshot(imagePath: string, question?: string): Promise<string> {
    const image = await imageHandler.loadImage(imagePath);
    const prompt = question || 'What do you see in this image? Describe it in detail.';

    return this.generate(prompt, [image]);
  }

  /**
   * Compare multiple screenshots
   */
  async compareScreenshots(imagePaths: string[], question?: string): Promise<string> {
    const images = await Promise.all(imagePaths.map((p) => imageHandler.loadImage(p)));
    const prompt = question || 'Compare these images. What are the differences?';

    return this.generate(prompt, images);
  }

  /**
   * Extract text from image (OCR)
   */
  async extractText(imagePath: string): Promise<string> {
    const image = await imageHandler.loadImage(imagePath);
    const prompt = 'Extract all text from this image. Return only the extracted text, nothing else.';

    return this.generate(prompt, [image]);
  }
}
