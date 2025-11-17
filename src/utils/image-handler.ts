import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';

const execAsync = promisify(exec);

const logger = new Logger('ImageHandler');

export interface ImageInput {
  path: string;
  base64?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Handle image/screenshot inputs for vision models
 */
export class ImageHandler {
  private supportedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  private maxSize = 20 * 1024 * 1024; // 20MB

  /**
   * Check if file is a supported image
   */
  isSupportedImage(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedFormats.includes(ext);
  }

  /**
   * Load image from file path and convert to base64
   */
  async loadImage(filePath: string): Promise<ImageInput> {
    try {
      // Check if file exists
      const stats = await fs.stat(filePath);

      // Check file size
      if (stats.size > this.maxSize) {
        throw new Error(`Image too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: ${this.maxSize / 1024 / 1024}MB)`);
      }

      // Check if supported format
      if (!this.isSupportedImage(filePath)) {
        throw new Error(`Unsupported image format: ${path.extname(filePath)}. Supported: ${this.supportedFormats.join(', ')}`);
      }

      // Read file as base64
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');

      // Detect MIME type
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(ext);

      logger.info(`Loaded image: ${path.basename(filePath)} (${(stats.size / 1024).toFixed(2)}KB)`);

      return {
        path: filePath,
        base64,
        mimeType,
        size: stats.size,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to load image: ${error.message}`);
        throw error;
      }
      throw new Error('Failed to load image');
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };

    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Format image for OpenAI GPT-4 Vision API
   */
  formatForOpenAI(image: ImageInput): { type: string; image_url: { url: string } } {
    return {
      type: 'image_url',
      image_url: {
        url: `data:${image.mimeType};base64,${image.base64}`,
      },
    };
  }

  /**
   * Format image for Anthropic Claude 3 API
   */
  formatForClaude(image: ImageInput): { type: string; source: { type: string; media_type: string; data: string } } {
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mimeType || 'image/jpeg',
        data: image.base64 || '',
      },
    };
  }

  /**
   * Format image for Google Gemini API
   */
  formatForGemini(image: ImageInput): { inlineData: { mimeType: string; data: string } } {
    return {
      inlineData: {
        mimeType: image.mimeType || 'image/jpeg',
        data: image.base64 || '',
      },
    };
  }

  /**
   * Load image from clipboard (platform-specific)
   */
  async loadImageFromClipboard(question?: string): Promise<{ image: ImageInput; question?: string }> {
    const platform = os.platform();
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `cacli-clipboard-${Date.now()}.png`);

    try {
      logger.info(`Reading image from clipboard (platform: ${platform})`);

      // Platform-specific clipboard reading
      if (platform === 'darwin') {
        // macOS - use pngpaste or osascript
        try {
          await execAsync(`pngpaste "${tmpFile}"`);
        } catch {
          // Fallback: try with osascript
          const script = `osascript -e 'set theImage to the clipboard as «class PNGf»' -e 'set theFile to open for access POSIX file "${tmpFile}" with write permission' -e 'write theImage to theFile' -e 'close access theFile'`;
          await execAsync(script);
        }
      } else if (platform === 'linux') {
        // Linux - use xclip
        await execAsync(`xclip -selection clipboard -t image/png -o > "${tmpFile}"`);
      } else if (platform === 'win32') {
        // Windows - use PowerShell
        const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::GetImage().Save('${tmpFile}', [System.Drawing.Imaging.ImageFormat]::Png)`;
        await execAsync(`powershell -Command "${psScript}"`);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Check if file was created
      const stats = await fs.stat(tmpFile);
      if (stats.size === 0) {
        throw new Error('No image found in clipboard');
      }

      // Load the image
      const image = await this.loadImage(tmpFile);

      logger.info(`Successfully loaded image from clipboard (${(stats.size / 1024).toFixed(2)}KB)`);

      return { image, question };
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tmpFile);
      } catch {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        const message = error.message;

        // Provide helpful error messages
        if (message.includes('pngpaste') || message.includes('command not found')) {
          throw new Error(
            platform === 'darwin'
              ? 'Install pngpaste: brew install pngpaste'
              : platform === 'linux'
              ? 'Install xclip: sudo apt-get install xclip (or yum install xclip)'
              : 'PowerShell clipboard access failed'
          );
        }

        if (message.includes('No image found')) {
          throw new Error('No image in clipboard. Copy an image first (Cmd+C / Ctrl+C on an image).');
        }

        logger.error(`Failed to load image from clipboard: ${message}`);
        throw error;
      }
      throw new Error('Failed to load image from clipboard');
    }
  }

  /**
   * Validate image file before processing
   */
  async validateImage(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists
      await fs.access(filePath);

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxSize) {
        return {
          valid: false,
          error: `Image too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: ${this.maxSize / 1024 / 1024}MB)`,
        };
      }

      // Check if supported format
      if (!this.isSupportedImage(filePath)) {
        return {
          valid: false,
          error: `Unsupported format: ${path.extname(filePath)}. Supported: ${this.supportedFormats.join(', ')}`,
        };
      }

      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'File not found or not accessible',
      };
    }
  }
}

// Global instance
export const imageHandler = new ImageHandler();
