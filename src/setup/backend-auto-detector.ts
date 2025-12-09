/**
 * Backend Auto-Detector - Automatically detects and configures available LLM backends
 *
 * Checks in order:
 * 1. Environment variable MODEL_BACKEND
 * 2. Ollama (local, port 11434)
 * 3. OpenWebUI (local, port 3000)
 * 4. API keys in environment
 * 5. MockBackend (fallback)
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface DetectedBackend {
  name: 'ollama' | 'openwebui' | 'openai' | 'claude' | 'mock';
  available: boolean;
  reason: string;
  url?: string;
  model?: string;
}

export class BackendAutoDetector {
  /**
   * Detect all available backends
   */
  async detectAll(): Promise<DetectedBackend[]> {
    const results: DetectedBackend[] = [];

    // Check Ollama
    results.push(await this.checkOllama());

    // Check OpenWebUI
    results.push(await this.checkOpenWebUI());

    // Check OpenAI
    results.push(this.checkOpenAI());

    // Check Claude/Anthropic
    results.push(this.checkClaude());

    // Mock is always available
    results.push({
      name: 'mock',
      available: true,
      reason: 'Simulation mode (no real LLM)'
    });

    return results;
  }

  /**
   * Get the best available backend
   */
  async getBestBackend(): Promise<DetectedBackend> {
    // 1. Check if explicitly configured
    if (process.env.MODEL_BACKEND) {
      const backends = await this.detectAll();
      const configured = backends.find(b => b.name === process.env.MODEL_BACKEND);
      if (configured && configured.available) {
        return configured;
      }
      console.warn(`⚠️  Configured backend '${process.env.MODEL_BACKEND}' not available`);
    }

    // 2. Try Ollama (best for local/free)
    const ollama = await this.checkOllama();
    if (ollama.available) {
      return ollama;
    }

    // 3. Try OpenWebUI
    const openwebui = await this.checkOpenWebUI();
    if (openwebui.available) {
      return openwebui;
    }

    // 4. Try OpenAI
    const openai = this.checkOpenAI();
    if (openai.available) {
      return openai;
    }

    // 5. Try Claude
    const claude = this.checkClaude();
    if (claude.available) {
      return claude;
    }

    // 6. Fallback to Mock
    return {
      name: 'mock',
      available: true,
      reason: 'No LLM backends detected - using simulation mode'
    };
  }

  /**
   * Check if Ollama is running
   */
  private async checkOllama(): Promise<DetectedBackend> {
    const url = process.env.OLLAMA_URL || 'http://localhost:11434';

    try {
      const response = await axios.get(`${url}/api/tags`, { timeout: 2000 });

      if (response.data && response.data.models) {
        const models = response.data.models;

        if (models.length === 0) {
          return {
            name: 'ollama',
            available: false,
            reason: 'Ollama running but no models installed. Run: ollama pull llama3',
            url
          };
        }

        // Get preferred model or use first available
        const preferredModels = ['llama3', 'codellama', 'mistral', 'llama2'];
        let selectedModel = process.env.OLLAMA_MODEL;

        if (!selectedModel) {
          for (const preferred of preferredModels) {
            if (models.some((m: any) => m.name.includes(preferred))) {
              selectedModel = models.find((m: any) => m.name.includes(preferred)).name;
              break;
            }
          }
          if (!selectedModel) {
            selectedModel = models[0].name;
          }
        }

        return {
          name: 'ollama',
          available: true,
          reason: `Local Ollama with ${models.length} model(s)`,
          url,
          model: selectedModel
        };
      }

      return {
        name: 'ollama',
        available: false,
        reason: 'Ollama API returned invalid response',
        url
      };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        return {
          name: 'ollama',
          available: false,
          reason: 'Ollama not running. Start with: ollama serve',
          url
        };
      }

      return {
        name: 'ollama',
        available: false,
        reason: `Ollama connection error: ${error.message}`,
        url
      };
    }
  }

  /**
   * Check if OpenWebUI is running
   */
  private async checkOpenWebUI(): Promise<DetectedBackend> {
    const url = process.env.OPENWEBUI_URL || 'http://localhost:3000';
    const apiKey = process.env.OPENWEBUI_API_KEY;

    try {
      const response = await axios.get(`${url}/api/v1/models`, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
        timeout: 2000
      });

      if (response.data) {
        return {
          name: 'openwebui',
          available: true,
          reason: 'Local OpenWebUI instance',
          url,
          model: process.env.OPENWEBUI_MODEL || 'llama3'
        };
      }

      return {
        name: 'openwebui',
        available: false,
        reason: 'OpenWebUI API returned invalid response',
        url
      };
    } catch (error: any) {
      return {
        name: 'openwebui',
        available: false,
        reason: 'OpenWebUI not running',
        url
      };
    }
  }

  /**
   * Check if OpenAI API key is configured
   */
  private checkOpenAI(): DetectedBackend {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && apiKey.startsWith('sk-')) {
      return {
        name: 'openai',
        available: true,
        reason: 'OpenAI API key configured',
        model: process.env.OPENAI_MODEL || 'gpt-4o'
      };
    }

    return {
      name: 'openai',
      available: false,
      reason: 'No OPENAI_API_KEY in environment'
    };
  }

  /**
   * Check if Claude/Anthropic API key is configured
   */
  private checkClaude(): DetectedBackend {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey.startsWith('sk-ant-')) {
      return {
        name: 'claude',
        available: true,
        reason: 'Claude API key configured',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
      };
    }

    return {
      name: 'claude',
      available: false,
      reason: 'No ANTHROPIC_API_KEY in environment'
    };
  }

  /**
   * Print detection results
   */
  printDetectionResults(backends: DetectedBackend[]): void {
    console.log('\n🔍 Backend Detection Results:\n');

    for (const backend of backends) {
      const icon = backend.available ? '✅' : '❌';
      console.log(`${icon} ${backend.name.toUpperCase()}: ${backend.reason}`);
      if (backend.url) {
        console.log(`   URL: ${backend.url}`);
      }
      if (backend.model) {
        console.log(`   Model: ${backend.model}`);
      }
      console.log('');
    }
  }

  /**
   * Provide setup instructions for unavailable backends
   */
  printSetupInstructions(backend: DetectedBackend): void {
    if (backend.available) return;

    console.log(`\n💡 To enable ${backend.name.toUpperCase()}:\n`);

    switch (backend.name) {
      case 'ollama':
        console.log('1. Install Ollama: https://ollama.ai');
        console.log('2. Start Ollama: ollama serve');
        console.log('3. Pull a model: ollama pull llama3');
        console.log('4. Restart cacli');
        break;

      case 'openwebui':
        console.log('1. Install OpenWebUI: https://docs.openwebui.com');
        console.log('2. Start OpenWebUI on port 3000');
        console.log('3. Set OPENWEBUI_API_KEY if needed');
        console.log('4. Restart cacli');
        break;

      case 'openai':
        console.log('1. Get API key: https://platform.openai.com/api-keys');
        console.log('2. Set: export OPENAI_API_KEY=sk-...');
        console.log('3. Restart cacli');
        break;

      case 'claude':
        console.log('1. Get API key: https://console.anthropic.com');
        console.log('2. Set: export ANTHROPIC_API_KEY=sk-ant-...');
        console.log('3. Restart cacli');
        break;
    }
  }
}

// Global singleton
export const backendAutoDetector = new BackendAutoDetector();
