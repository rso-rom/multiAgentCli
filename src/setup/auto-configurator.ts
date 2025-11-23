/**
 * Auto-Configurator - Self-configuring system for new backends
 *
 * Uses an existing configured LLM to:
 * 1. Research new backend APIs
 * 2. Generate backend implementation code
 * 3. Configure environment variables
 * 4. Test the connection
 */

import { ModelBackend } from '../backends/base';
import { getBackend } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import axios from 'axios';

export interface BackendConfig {
  name: string;
  apiUrl: string;
  authType: 'api-key' | 'oauth' | 'none';
  defaultModel: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

export class AutoConfigurator {
  private llm: ModelBackend;
  private projectRoot: string;

  constructor(llm?: ModelBackend) {
    // Use configured backend or fallback to any available
    this.llm = llm || getBackend();
    this.projectRoot = path.join(__dirname, '../..');
  }

  /**
   * Main entry point: Auto-configure a new backend
   */
  async configure(backendName: string, apiKey?: string): Promise<boolean> {
    console.log(`\n🤖 Auto-configuring backend: ${backendName}`);
    console.log(`📡 Using ${this.llm.constructor.name} to research and generate code...\n`);

    try {
      // Step 1: Research the backend API
      const config = await this.researchBackend(backendName);

      if (!config) {
        console.log('❌ Could not research backend API');
        return false;
      }

      console.log('\n✅ Research complete!');
      console.log(`   API URL: ${config.apiUrl}`);
      console.log(`   Auth: ${config.authType}`);
      console.log(`   Default Model: ${config.defaultModel}`);
      console.log(`   Streaming: ${config.supportsStreaming ? 'Yes' : 'No'}`);
      console.log(`   Vision: ${config.supportsVision ? 'Yes' : 'No'}`);

      // Step 2: Confirm with user
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Generate backend implementation?',
        default: true
      }]);

      if (!proceed) {
        return false;
      }

      // Step 3: Generate backend code
      const code = await this.generateBackendCode(backendName, config);

      // Step 4: Save the generated code
      await this.saveBackendCode(backendName, code);

      // Step 5: Update configuration files
      await this.updateConfigFiles(backendName, config);

      // Step 6: Configure environment
      await this.configureEnvironment(backendName, config, apiKey);

      // Step 7: Test the connection
      if (apiKey) {
        await this.testConnection(backendName, apiKey, config.defaultModel);
      }

      console.log('\n🎉 Auto-configuration complete!');
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Review generated code: src/backends/${backendName}.ts`);
      console.log(`   2. Set API key: ${backendName.toUpperCase()}_API_KEY in .env`);
      console.log(`   3. Test: cacli -b ${backendName}`);

      return true;
    } catch (error: any) {
      console.error(`\n❌ Auto-configuration failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Use LLM to research backend API structure
   */
  private async researchBackend(backendName: string): Promise<BackendConfig | null> {
    console.log(`🔍 Researching ${backendName} API...`);

    const prompt = `You are a software engineer researching AI model APIs.

Research the ${backendName} API and provide ONLY this information in the following EXACT format:

API_URL: [the base API endpoint URL]
AUTH_TYPE: [api-key, oauth, or none]
DEFAULT_MODEL: [the default/recommended model name]
SUPPORTS_VISION: [YES or NO]
SUPPORTS_STREAMING: [YES or NO]

Examples of backends:
- OpenAI: https://api.openai.com/v1
- Anthropic: https://api.anthropic.com/v1
- Google Gemini: https://generativelanguage.googleapis.com/v1beta
- Mistral: https://api.mistral.ai/v1
- Cohere: https://api.cohere.ai/v1

Be concise and factual. Only provide the format above, no additional explanation.`;

    const response = await this.llm.chat(prompt);

    if (!response || typeof response !== 'string') {
      return null;
    }

    return this.parseBackendConfig(response);
  }

  /**
   * Parse LLM response into structured config
   */
  private parseBackendConfig(response: string): BackendConfig | null {
    try {
      const lines = response.split('\n');
      const data: any = {};

      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (!key || valueParts.length === 0) continue;

        const value = valueParts.join(':').trim();
        const cleanKey = key.trim().toLowerCase().replace(/_/g, '');

        if (cleanKey === 'apiurl') data.apiUrl = value;
        else if (cleanKey === 'authtype') data.authType = value;
        else if (cleanKey === 'defaultmodel') data.defaultModel = value;
        else if (cleanKey === 'supportsvision') data.supportsVision = value.toUpperCase() === 'YES';
        else if (cleanKey === 'supportsstreaming') data.supportsStreaming = value.toUpperCase() === 'YES';
      }

      if (!data.apiUrl || !data.authType || !data.defaultModel) {
        return null;
      }

      return {
        name: '',
        apiUrl: data.apiUrl,
        authType: data.authType,
        defaultModel: data.defaultModel,
        supportsVision: data.supportsVision || false,
        supportsStreaming: data.supportsStreaming || false
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate backend implementation code
   */
  private async generateBackendCode(backendName: string, config: BackendConfig): Promise<string> {
    console.log(`\n🔨 Generating backend code...`);

    const className = backendName.charAt(0).toUpperCase() + backendName.slice(1) + 'Backend';

    const prompt = `Generate TypeScript code for a ${backendName} backend implementation.

Requirements:
- Class name: ${className}
- Extends: ModelBackend
- API URL: ${config.apiUrl}
- Authentication: ${config.authType}
- Default model: ${config.defaultModel}
- Streaming support: ${config.supportsStreaming}
- Vision support: ${config.supportsVision}

The code must:
1. Import from './base' and use axios
2. Have a constructor that takes (apiKey?: string, model?: string)
3. Implement async chat(prompt: string, onStream?: StreamCallback): Promise<string | void>
4. ${config.supportsVision ? 'Implement analyzeImage() method' : 'Not implement vision'}
5. ${config.supportsStreaming ? 'Support both streaming and non-streaming' : 'Support non-streaming only'}
6. Handle errors gracefully
7. Use proper TypeScript types

Generate ONLY the TypeScript code, no explanations. Start with imports.`;

    const code = await this.llm.chat(prompt);

    if (!code || typeof code !== 'string') {
      throw new Error('Failed to generate backend code');
    }

    return code;
  }

  /**
   * Save generated backend code to file
   */
  private async saveBackendCode(backendName: string, code: string): Promise<void> {
    const fileName = `${backendName}.ts`;
    const filePath = path.join(this.projectRoot, 'src/backends', fileName);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `File ${fileName} already exists. Overwrite?`,
        default: false
      }]);

      if (!overwrite) {
        throw new Error('Backend file already exists');
      }
    }

    fs.writeFileSync(filePath, code, 'utf-8');
    console.log(`✅ Saved: src/backends/${fileName}`);
  }

  /**
   * Update configuration files (config.ts, backend-selector.ts)
   */
  private async updateConfigFiles(backendName: string, config: BackendConfig): Promise<void> {
    console.log(`\n🔧 Updating configuration files...`);

    // 1. Update src/config.ts
    await this.updateConfigTs(backendName, config);

    // 2. Update backend-selector.ts
    await this.updateBackendSelector(backendName, config);

    console.log(`✅ Configuration files updated`);
  }

  /**
   * Update src/config.ts with new backend
   */
  private async updateConfigTs(backendName: string, config: BackendConfig): Promise<void> {
    const configPath = path.join(this.projectRoot, 'src/config.ts');
    let content = fs.readFileSync(configPath, 'utf-8');

    const className = backendName.charAt(0).toUpperCase() + backendName.slice(1) + 'Backend';

    // Add import
    const importLine = `import { ${className} } from './backends/${backendName}';`;
    if (!content.includes(importLine)) {
      const lastImport = content.lastIndexOf('import {');
      const insertPos = content.indexOf('\n', lastImport) + 1;
      content = content.slice(0, insertPos) + importLine + '\n' + content.slice(insertPos);
    }

    // Add to BackendName type
    const typeRegex = /export type BackendName = '([^']+)'(?:\s*\|\s*'([^']+)')*/;
    const match = content.match(typeRegex);
    if (match && !match[0].includes(`'${backendName}'`)) {
      const newType = match[0].replace(';', ` | '${backendName}';`);
      content = content.replace(typeRegex, newType);
    }

    // Add to getBackend function
    const backendCheck = `
  if (backend === '${backendName}') {
    return new ${className}(
      process.env.${backendName.toUpperCase()}_API_KEY,
      process.env.${backendName.toUpperCase()}_MODEL || '${config.defaultModel}'
    );
  }
`;

    if (!content.includes(`backend === '${backendName}'`)) {
      const mockReturn = content.indexOf('return new MockBackend();');
      content = content.slice(0, mockReturn) + backendCheck + '\n  ' + content.slice(mockReturn);
    }

    fs.writeFileSync(configPath, content, 'utf-8');
  }

  /**
   * Update backend-selector.ts
   */
  private async updateBackendSelector(backendName: string, config: BackendConfig): Promise<void> {
    const selectorPath = path.join(this.projectRoot, 'src/orchestrator/backend-selector.ts');
    let content = fs.readFileSync(selectorPath, 'utf-8');

    // Add to detectAvailableBackends
    const detection = `
    // Check ${backendName}
    if (process.env.${backendName.toUpperCase()}_API_KEY) {
      options.push({
        name: '${backendName.charAt(0).toUpperCase() + backendName.slice(1)} (${config.defaultModel})',
        backend: '${backendName}',
        model: process.env.${backendName.toUpperCase()}_MODEL || '${config.defaultModel}',
        available: true,
        description: 'AI model backend',
        cost: 'Paid'
      });
    }
`;

    if (!content.includes(`process.env.${backendName.toUpperCase()}_API_KEY`)) {
      const ollamaCheck = content.indexOf('// Check Ollama');
      if (ollamaCheck > 0) {
        content = content.slice(0, ollamaCheck) + detection + '\n    ' + content.slice(ollamaCheck);
        fs.writeFileSync(selectorPath, content, 'utf-8');
      }
    }
  }

  /**
   * Configure environment variables
   */
  private async configureEnvironment(
    backendName: string,
    config: BackendConfig,
    apiKey?: string
  ): Promise<void> {
    console.log(`\n⚙️  Configuring environment...`);

    const envPath = path.join(this.projectRoot, '.env');
    const envExamplePath = path.join(this.projectRoot, '.env.example');

    const envVars = `
# ${backendName.charAt(0).toUpperCase() + backendName.slice(1)} Configuration
${backendName.toUpperCase()}_API_KEY=${apiKey || ''}
${backendName.toUpperCase()}_MODEL=${config.defaultModel}
`;

    // Update .env.example
    if (fs.existsSync(envExamplePath)) {
      let exampleContent = fs.readFileSync(envExamplePath, 'utf-8');
      if (!exampleContent.includes(`${backendName.toUpperCase()}_API_KEY`)) {
        exampleContent += '\n' + envVars;
        fs.writeFileSync(envExamplePath, exampleContent, 'utf-8');
        console.log(`✅ Updated .env.example`);
      }
    }

    // Update .env if API key provided
    if (apiKey && fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (!envContent.includes(`${backendName.toUpperCase()}_API_KEY`)) {
        envContent += '\n' + envVars;
        fs.writeFileSync(envPath, envContent, 'utf-8');
        console.log(`✅ Updated .env with API key`);
      }
    }
  }

  /**
   * Test connection to new backend
   */
  private async testConnection(
    backendName: string,
    apiKey: string,
    model: string
  ): Promise<void> {
    console.log(`\n🧪 Testing connection...`);

    try {
      // Dynamically load and test the new backend
      const backendModule = require(`../backends/${backendName}`);
      const className = backendName.charAt(0).toUpperCase() + backendName.slice(1) + 'Backend';
      const Backend = backendModule[className];

      if (!Backend) {
        console.log('⚠️  Could not load backend for testing');
        return;
      }

      const backend = new Backend(apiKey, model);
      const response = await backend.chat('Say "Hello from ' + backendName + '!"');

      if (response && typeof response === 'string') {
        console.log(`✅ Connection successful!`);
        console.log(`   Response: ${response.substring(0, 100)}...`);
      } else {
        console.log('⚠️  Connection test inconclusive');
      }
    } catch (error: any) {
      console.log(`⚠️  Test failed: ${error.message}`);
      console.log(`   This is normal - you may need to adjust the generated code`);
    }
  }

  /**
   * List all available backend templates that can be auto-configured
   */
  static async listAvailableBackends(): Promise<string[]> {
    return [
      'gemini',      // Google Gemini
      'mistral',     // Mistral AI
      'cohere',      // Cohere
      'huggingface', // Hugging Face Inference API
      'replicate',   // Replicate
      'together',    // Together AI
      'perplexity',  // Perplexity AI
      'groq',        // Groq
    ];
  }

  /**
   * Check if a backend can be auto-configured
   */
  static async canAutoConfigure(backendName: string): Promise<boolean> {
    const available = await this.listAvailableBackends();
    return available.includes(backendName.toLowerCase());
  }

  /**
   * Interactive mode: Let user choose what to configure
   */
  async interactiveConfiguration(): Promise<void> {
    console.log('\n🤖 Auto-Configuration Wizard\n');
    console.log('This will use your current LLM to research and configure a new backend.\n');

    const available = await AutoConfigurator.listAvailableBackends();

    const { backendName } = await inquirer.prompt([{
      type: 'list',
      name: 'backendName',
      message: 'Which backend would you like to configure?',
      choices: [
        ...available.map(name => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: name
        })),
        { name: 'Custom (enter manually)', value: 'custom' }
      ]
    }]);

    let finalBackendName = backendName;

    if (backendName === 'custom') {
      const { customName } = await inquirer.prompt([{
        type: 'input',
        name: 'customName',
        message: 'Enter backend name:',
        validate: (input: string) => {
          return /^[a-z]+$/.test(input) || 'Use lowercase letters only';
        }
      }]);
      finalBackendName = customName;
    }

    const { apiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${finalBackendName} API key (optional, can be set later):`,
    }]);

    await this.configure(finalBackendName, apiKey || undefined);
  }
}
