import inquirer from 'inquirer';
import dotenv from 'dotenv';

dotenv.config();

export interface BackendOption {
  name: string;
  backend: string;
  model: string;
  available: boolean;
  description: string;
  cost: string;
}

/**
 * Interactive backend/model selector for agents
 */
export class BackendSelector {
  /**
   * Detect available backends based on environment configuration
   */
  static detectAvailableBackends(): BackendOption[] {
    const options: BackendOption[] = [];

    // Check Anthropic/Claude
    if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_USE_OAUTH === 'true') {
      options.push({
        name: 'Claude 3.5 Sonnet (Anthropic)',
        backend: 'claude',
        model: 'claude-3-5-sonnet-20241022',
        available: true,
        description: 'Best quality, excellent for complex tasks',
        cost: '$3/1M tokens'
      });
      options.push({
        name: 'Claude 3 Opus (Anthropic)',
        backend: 'claude',
        model: 'claude-3-opus-20240229',
        available: true,
        description: 'Highest quality, most expensive',
        cost: '$15/1M tokens'
      });
      options.push({
        name: 'Claude 3 Haiku (Anthropic)',
        backend: 'claude',
        model: 'claude-3-haiku-20240307',
        available: true,
        description: 'Fast and cheap',
        cost: '$0.25/1M tokens'
      });
    }

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      options.push({
        name: 'GPT-4o (OpenAI)',
        backend: 'openai',
        model: 'gpt-4o',
        available: true,
        description: 'Great quality, vision support',
        cost: '$2.50/1M tokens'
      });
      options.push({
        name: 'GPT-4o-mini (OpenAI)',
        backend: 'openai',
        model: 'gpt-4o-mini',
        available: true,
        description: 'Good quality, budget-friendly',
        cost: '$0.15/1M tokens'
      });
      options.push({
        name: 'GPT-4-turbo (OpenAI)',
        backend: 'openai',
        model: 'gpt-4-turbo',
        available: true,
        description: 'Previous generation, reliable',
        cost: '$10/1M tokens'
      });
    }

    // Check OpenWebUI
    if (process.env.OPENWEBUI_URL) {
      options.push({
        name: `OpenWebUI (${process.env.OPENWEBUI_MODEL || 'llama3'})`,
        backend: 'openwebui',
        model: process.env.OPENWEBUI_MODEL || 'llama3',
        available: true,
        description: 'Local or remote OpenWebUI instance',
        cost: 'Variable'
      });
    }

    // Check Ollama (always try to add, may be available)
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
    options.push({
      name: `Ollama (${ollamaModel})`,
      backend: 'ollama',
      model: ollamaModel,
      available: true, // Assume available, will fail gracefully if not
      description: 'Local, free, offline-capable',
      cost: 'Free'
    });

    // Add more Ollama models if available
    options.push({
      name: 'Ollama (codellama)',
      backend: 'ollama',
      model: 'codellama',
      available: true,
      description: 'Code-specialized model',
      cost: 'Free'
    });
    options.push({
      name: 'Ollama (mistral)',
      backend: 'ollama',
      model: 'mistral',
      available: true,
      description: 'Fast and capable',
      cost: 'Free'
    });

    return options;
  }

  /**
   * Prompt user to select backend/model for an agent
   */
  static async selectForAgent(
    agentName: string,
    agentRole: string,
    complexity: 'simple' | 'moderate' | 'complex'
  ): Promise<{ backend: string; model: string }> {
    const options = this.detectAvailableBackends();

    if (options.length === 0) {
      console.log('⚠️  No backends configured. Using mock backend.');
      return { backend: 'mock', model: 'mock' };
    }

    // Add "Auto" option
    const autoOption = {
      name: '🤖 Auto (Let cacli choose best)',
      value: 'auto'
    };

    const choices = [
      autoOption,
      new inquirer.Separator('--- Available Backends ---'),
      ...options.map(opt => ({
        name: `${opt.name} - ${opt.description} [${opt.cost}]`,
        value: opt
      }))
    ];

    const { selection } = await inquirer.prompt([{
      type: 'list',
      name: 'selection',
      message: `Select backend/model for ${agentName} (${agentRole}):`,
      choices,
      pageSize: 15
    }]);

    if (selection === 'auto') {
      // Use intelligent auto-selection
      return this.autoSelect(complexity, options);
    }

    return {
      backend: selection.backend,
      model: selection.model
    };
  }

  /**
   * Auto-select backend based on complexity and available options
   */
  private static autoSelect(
    complexity: 'simple' | 'moderate' | 'complex',
    options: BackendOption[]
  ): { backend: string; model: string } {
    // Priority for complex tasks: Claude > GPT-4o > GPT-4o-mini > Ollama
    if (complexity === 'complex') {
      const claude = options.find(o => o.backend === 'claude' && o.model.includes('sonnet'));
      if (claude) return { backend: claude.backend, model: claude.model };

      const gpt4o = options.find(o => o.backend === 'openai' && o.model === 'gpt-4o');
      if (gpt4o) return { backend: gpt4o.backend, model: gpt4o.model };
    }

    // For moderate/simple: Prefer budget-friendly
    const gpt4mini = options.find(o => o.backend === 'openai' && o.model === 'gpt-4o-mini');
    if (gpt4mini) return { backend: gpt4mini.backend, model: gpt4mini.model };

    const ollama = options.find(o => o.backend === 'ollama');
    if (ollama) return { backend: ollama.backend, model: ollama.model };

    // Fallback: First available
    return { backend: options[0].backend, model: options[0].model };
  }

  /**
   * Prompt user to select backend/model for all agents in a workflow
   */
  static async selectForWorkflow(
    agents: Array<{ name: string; role: string }>,
    complexity: 'simple' | 'moderate' | 'complex',
    askPerAgent: boolean = false
  ): Promise<Map<string, { backend: string; model: string }>> {
    const selections = new Map<string, { backend: string; model: string }>();

    if (!askPerAgent) {
      // Same backend for all agents
      const { useDefault } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useDefault',
        message: 'Use default backend for all agents?',
        default: true
      }]);

      if (useDefault) {
        const defaultBackend = process.env.MODEL_BACKEND || 'ollama';
        const defaultModel = this.getDefaultModel(defaultBackend);

        for (const agent of agents) {
          selections.set(agent.name, { backend: defaultBackend, model: defaultModel });
        }
        return selections;
      }

      // Select one backend for all
      console.log('\nSelect backend/model for all agents:');
      const selection = await this.selectForAgent('all agents', 'all roles', complexity);

      for (const agent of agents) {
        selections.set(agent.name, selection);
      }
      return selections;
    }

    // Ask for each agent individually
    console.log('\n🎯 Configure backend/model per agent:');
    for (const agent of agents) {
      const selection = await this.selectForAgent(agent.name, agent.role, complexity);
      selections.set(agent.name, selection);
    }

    return selections;
  }

  /**
   * Get default model for a backend
   */
  private static getDefaultModel(backend: string): string {
    const defaults: Record<string, string> = {
      ollama: process.env.OLLAMA_MODEL || 'llama3',
      openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      claude: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      anthropic: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      openwebui: process.env.OPENWEBUI_MODEL || 'llama3',
      mock: 'mock'
    };

    return defaults[backend] || 'llama3';
  }

  /**
   * Show summary of selected backends
   */
  static showSelectionSummary(
    selections: Map<string, { backend: string; model: string }>
  ): void {
    console.log('\n📋 Backend Selection Summary:');
    console.log('─'.repeat(60));

    for (const [agentName, config] of selections.entries()) {
      console.log(`  ${agentName.padEnd(20)} → ${config.backend}/${config.model}`);
    }

    console.log('─'.repeat(60));

    // Show estimated costs if using paid backends
    const paidBackends = Array.from(selections.values())
      .filter(c => c.backend === 'openai' || c.backend === 'claude' || c.backend === 'anthropic');

    if (paidBackends.length > 0) {
      console.log(`\n💰 ${paidBackends.length} agent(s) using paid backends`);
      console.log('💡 Consider using Ollama for non-critical tasks to save costs');
    }
  }

  /**
   * Quick check if multiple backends are available
   */
  static hasMultipleBackends(): boolean {
    let count = 0;

    if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_USE_OAUTH === 'true') count++;
    if (process.env.OPENAI_API_KEY) count++;
    if (process.env.OPENWEBUI_URL) count++;
    count++; // Ollama always available

    return count > 1;
  }
}
