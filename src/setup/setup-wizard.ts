import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SetupAnswers {
  backend: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  openwebuiUrl?: string;
  openwebuiApiKey?: string;
  openwebuiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  anthropicUseOAuth?: boolean;
  useQdrant?: boolean;
  qdrantUrl?: string;
  embeddingService?: string;
  embeddingModel?: string;
  startQdrant?: boolean;
}

export class SetupWizard {
  private envPath: string;

  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
  }

  /**
   * Run the interactive setup wizard
   */
  async run(): Promise<void> {
    console.log('\n🚀 Welcome to cacli Setup Wizard!\n');
    console.log('This wizard will help you configure cacli for first use.\n');

    // Check if .env already exists
    const envExists = await this.checkEnvExists();
    if (envExists) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: '.env file already exists. Overwrite?',
        default: false
      }]);

      if (!overwrite) {
        console.log('Setup cancelled. Your existing .env file was not modified.');
        return;
      }
    }

    // Collect configuration
    const answers = await this.collectAnswers();

    // Generate .env file
    await this.generateEnvFile(answers);

    // Optional: Start Qdrant
    if (answers.startQdrant) {
      await this.startQdrant();
    }

    // Test configuration
    await this.testConfiguration(answers);

    console.log('\n✅ Setup complete!\n');
    console.log('You can now start cacli:');
    console.log('  npm start');
    console.log('  or: cacli\n');
  }

  private async checkEnvExists(): Promise<boolean> {
    try {
      await fs.access(this.envPath);
      return true;
    } catch {
      return false;
    }
  }

  private async collectAnswers(): Promise<SetupAnswers> {
    // 1. Choose backend
    const { backend } = await inquirer.prompt([{
      type: 'list',
      name: 'backend',
      message: 'Which AI backend do you want to use?',
      choices: [
        { name: 'Ollama (Local, Free)', value: 'ollama' },
        { name: 'OpenWebUI (Local/Remote)', value: 'openwebui' },
        { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
        { name: 'Claude/Anthropic', value: 'claude' },
        { name: 'Mock (Testing only)', value: 'mock' }
      ],
      default: 'ollama'
    }]);

    const answers: SetupAnswers = { backend };

    // 2. Backend-specific configuration
    if (backend === 'ollama') {
      const ollamaConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'ollamaUrl',
          message: 'Ollama URL:',
          default: 'http://localhost:11434'
        },
        {
          type: 'input',
          name: 'ollamaModel',
          message: 'Ollama model:',
          default: 'llama3'
        }
      ]);
      Object.assign(answers, ollamaConfig);
    }

    if (backend === 'openwebui') {
      const openwebuiConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'openwebuiUrl',
          message: 'OpenWebUI URL:',
          default: 'http://localhost:3000/api/v1/chat/completions'
        },
        {
          type: 'input',
          name: 'openwebuiApiKey',
          message: 'OpenWebUI API Key (optional):',
          default: ''
        },
        {
          type: 'input',
          name: 'openwebuiModel',
          message: 'OpenWebUI model:',
          default: 'llama3'
        }
      ]);
      Object.assign(answers, openwebuiConfig);
    }

    if (backend === 'openai') {
      const openaiConfig = await inquirer.prompt([
        {
          type: 'password',
          name: 'openaiApiKey',
          message: 'OpenAI API Key:',
          mask: '*'
        },
        {
          type: 'list',
          name: 'openaiModel',
          message: 'OpenAI model:',
          choices: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          default: 'gpt-4o-mini'
        }
      ]);
      Object.assign(answers, openaiConfig);
    }

    if (backend === 'claude') {
      const { authMethod } = await inquirer.prompt([{
        type: 'list',
        name: 'authMethod',
        message: 'How do you want to authenticate with Claude?',
        choices: [
          { name: 'OAuth (Browser login, like Claude Code CLI)', value: 'oauth' },
          { name: 'API Key (Traditional)', value: 'apikey' }
        ]
      }]);

      if (authMethod === 'oauth') {
        answers.anthropicUseOAuth = true;
        console.log('\n💡 You will need to login after setup using: cacli login claude\n');
      } else {
        const anthropicConfig = await inquirer.prompt([
          {
            type: 'password',
            name: 'anthropicApiKey',
            message: 'Anthropic API Key:',
            mask: '*'
          },
          {
            type: 'list',
            name: 'anthropicModel',
            message: 'Claude model:',
            choices: [
              'claude-3-5-sonnet-20241022',
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307'
            ],
            default: 'claude-3-5-sonnet-20241022'
          }
        ]);
        answers.anthropicUseOAuth = false;
        Object.assign(answers, anthropicConfig);
      }
    }

    // 3. Memory configuration
    const { useQdrant } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useQdrant',
      message: 'Enable advanced memory features (Semantic Search with Qdrant)?',
      default: false
    }]);

    answers.useQdrant = useQdrant;

    if (useQdrant) {
      const qdrantConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'qdrantUrl',
          message: 'Qdrant URL:',
          default: 'http://localhost:6333'
        },
        {
          type: 'confirm',
          name: 'startQdrant',
          message: 'Start Qdrant Docker container now?',
          default: true
        },
        {
          type: 'list',
          name: 'embeddingService',
          message: 'Embedding service for semantic search:',
          choices: ['ollama', 'openai'],
          default: 'ollama'
        },
        {
          type: 'input',
          name: 'embeddingModel',
          message: 'Embedding model:',
          default: 'nomic-embed-text'
        }
      ]);
      Object.assign(answers, qdrantConfig);
    }

    return answers;
  }

  private async generateEnvFile(answers: SetupAnswers): Promise<void> {
    const lines: string[] = [
      '# cacli Configuration',
      '# Generated by Setup Wizard',
      '',
      '# Logging',
      'LOG_LEVEL=info',
      '',
      '# Model Backend',
      `MODEL_BACKEND=${answers.backend}`,
    ];

    // Ollama
    if (answers.backend === 'ollama' || answers.useQdrant) {
      lines.push(`OLLAMA_URL=${answers.ollamaUrl || 'http://localhost:11434'}`);
      lines.push(`OLLAMA_MODEL=${answers.ollamaModel || 'llama3'}`);
    }

    // OpenWebUI
    if (answers.backend === 'openwebui') {
      lines.push(`OPENWEBUI_URL=${answers.openwebuiUrl || 'http://localhost:3000/api/v1/chat/completions'}`);
      lines.push(`OPENWEBUI_API_KEY=${answers.openwebuiApiKey || ''}`);
      lines.push(`OPENWEBUI_MODEL=${answers.openwebuiModel || 'llama3'}`);
    }

    // OpenAI
    if (answers.backend === 'openai') {
      lines.push(`OPENAI_API_KEY=${answers.openaiApiKey || ''}`);
      lines.push(`OPENAI_MODEL=${answers.openaiModel || 'gpt-4o-mini'}`);
    }

    // Anthropic
    if (answers.backend === 'claude') {
      lines.push(`ANTHROPIC_API_KEY=${answers.anthropicApiKey || ''}`);
      lines.push(`ANTHROPIC_MODEL=${answers.anthropicModel || 'claude-3-5-sonnet-20241022'}`);
      lines.push(`ANTHROPIC_USE_OAUTH=${answers.anthropicUseOAuth || false}`);
    }

    lines.push('EXECUTION_MODE=host');
    lines.push('DOCKER_RUNTIME_IMAGE=python:3.12-slim');
    lines.push('');

    // Memory System
    lines.push('# Memory System');
    lines.push('MEMORY_PATH=./memory');
    lines.push(`USE_QDRANT=${answers.useQdrant || false}`);
    if (answers.useQdrant) {
      lines.push(`QDRANT_URL=${answers.qdrantUrl || 'http://localhost:6333'}`);
      lines.push('');
      lines.push('# Embedding Service');
      lines.push(`EMBEDDING_SERVICE=${answers.embeddingService || 'ollama'}`);
      lines.push(`EMBEDDING_MODEL=${answers.embeddingModel || 'nomic-embed-text'}`);
      lines.push('EMBEDDING_DIMENSION=768');
    }
    lines.push('');

    // Features
    lines.push('# Ask-Store (prompt history)');
    lines.push('ASK_STORE_ENABLED=true');
    lines.push('');
    lines.push('# Auto-Resume (on token limits)');
    lines.push('AUTO_RESUME_ENABLED=true');
    lines.push('MAX_RESUME_ATTEMPTS=3');
    lines.push('');
    lines.push('# Tool Auto-Installation');
    lines.push('AUTO_INSTALL_TOOLS=ask');
    lines.push('');

    await fs.writeFile(this.envPath, lines.join('\n'));
    console.log(`\n✅ Created .env file at: ${this.envPath}`);
  }

  private async startQdrant(): Promise<void> {
    console.log('\n🐳 Starting Qdrant Docker container...');

    try {
      // Check if Docker is installed
      await execAsync('docker --version');

      // Check if Qdrant is already running
      try {
        const { stdout } = await execAsync('docker ps --filter name=qdrant --format "{{.Names}}"');
        if (stdout.includes('qdrant')) {
          console.log('✅ Qdrant container is already running');
          return;
        }
      } catch {
        // Container not running, will start it
      }

      // Start Qdrant
      const cmd = 'docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant';
      await execAsync(cmd);

      console.log('✅ Qdrant container started successfully');
      console.log('   Dashboard: http://localhost:6333/dashboard');

    } catch (err: any) {
      console.error('❌ Failed to start Qdrant:', err.message);
      console.log('\n💡 You can start Qdrant manually with:');
      console.log('   docker run -p 6333:6333 qdrant/qdrant');
    }
  }

  private async testConfiguration(answers: SetupAnswers): Promise<void> {
    console.log('\n🧪 Testing configuration...\n');

    // Test backend connectivity
    if (answers.backend === 'ollama') {
      await this.testOllama(answers.ollamaUrl!);
    }

    if (answers.backend === 'openwebui') {
      console.log('✅ OpenWebUI configured (test connection on first use)');
    }

    if (answers.backend === 'openai') {
      console.log('✅ OpenAI configured (test connection on first use)');
    }

    if (answers.backend === 'claude') {
      if (answers.anthropicUseOAuth) {
        console.log('💡 Remember to login: cacli login claude');
      } else {
        console.log('✅ Claude configured with API key');
      }
    }

    // Test Qdrant
    if (answers.useQdrant) {
      await this.testQdrant(answers.qdrantUrl!);
    }
  }

  private async testOllama(url: string): Promise<void> {
    try {
      const { stdout } = await execAsync(`curl -s ${url}/api/tags || echo "failed"`);
      if (stdout.includes('failed')) {
        console.log('⚠️  Ollama not reachable at', url);
        console.log('   Make sure Ollama is running: ollama serve');
      } else {
        console.log('✅ Ollama connected at', url);
      }
    } catch {
      console.log('⚠️  Could not test Ollama connection');
    }
  }

  private async testQdrant(url: string): Promise<void> {
    try {
      const { stdout } = await execAsync(`curl -s ${url}/collections || echo "failed"`);
      if (stdout.includes('failed')) {
        console.log('⚠️  Qdrant not reachable at', url);
        console.log('   Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
      } else {
        console.log('✅ Qdrant connected at', url);
      }
    } catch {
      console.log('⚠️  Could not test Qdrant connection');
    }
  }
}
