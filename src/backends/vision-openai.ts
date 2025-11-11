import axios from 'axios';
import { ImageInput, imageHandler } from '../utils/image-handler';
import { ModelBackend, StreamCallback } from './base';

export interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

/**
 * OpenAI GPT-4 backend with vision support
 * Can be used as a general-purpose backend or for vision tasks
 */
export class OpenAIBackend extends ModelBackend {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private model: string;

  constructor(apiKey?: string, model = 'gpt-4o') {
    super();
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;
    if (!this.apiKey) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY environment variable.');
    }
  }

  /**
   * OpenAI models with vision support
   */
  supportsVision(): boolean {
    return this.model.includes('gpt-4o') || this.model.includes('gpt-4-vision');
  }

  /**
   * Standard chat interface (text-only)
   */
  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          stream: !!onStream,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          responseType: onStream ? 'stream' : 'json',
        }
      );

      if (!onStream) {
        return response.data.choices[0].message.content;
      }

      // Handle streaming
      for await (const chunk of response.data as any) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim().startsWith('data:'));
        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onStream(content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      const errorMsg = `OpenAI API error: ${error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }

  /**
   * Analyze images with vision models (implements ModelBackend interface)
   */
  async analyzeImage(prompt: string, images: ImageInput[], onStream?: StreamCallback): Promise<string | void> {
    if (!this.supportsVision()) {
      throw new Error(`Model ${this.model} does not support vision. Use gpt-4o or gpt-4-vision.`);
    }

    // Build message content
    const content: VisionMessage['content'] = [{ type: 'text', text: prompt }];

    // Add images
    for (const image of images) {
      content.push(imageHandler.formatForOpenAI(image) as { type: 'image_url'; image_url: { url: string } });
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [{ role: 'user', content }],
          stream: !!onStream,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          responseType: onStream ? 'stream' : 'json',
        }
      );

      if (!onStream) {
        return response.data.choices[0].message.content;
      }

      // Handle streaming
      for await (const chunk of response.data as any) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim().startsWith('data:'));
        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onStream(content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      const errorMsg = `OpenAI vision error: ${error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }

  /**
   * Send prompt with image(s) to GPT-4 Vision (legacy method for backward compatibility)
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
