/**
 * Dynamic Workflow Generator
 *
 * Generates workflows on-the-fly based on requirements analysis
 */

export interface RequirementsAnalysis {
  scope: string;
  components: string[];
  needsDatabase: boolean;
  needsAuthentication: boolean;
  needsTests: boolean;
  needsDeployment: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  recommendedTech: string[];
}

export interface AgentModelConfig {
  name: string;
  role: string;
  backend: string;
  model: string;
}

export class DynamicWorkflowGenerator {
  /**
   * Generate a workflow based on requirements analysis
   */
  static generateFromRequirements(
    task: string,
    requirements: RequirementsAnalysis,
    defaultBackend?: string,
    defaultModel?: string
  ): {
    name: string;
    description: string;
    agents: string[];
    agentConfigs: AgentModelConfig[];
    reasoning: string;
  } {
    const agents: string[] = [];
    const agentConfigs: AgentModelConfig[] = [];
    const reasons: string[] = [];

    // ALWAYS start with Requirements Engineer
    agents.push('requirements');
    reasons.push('Requirements Engineer always runs first to analyze the task');

    // ALWAYS add Architect
    agents.push('architect');
    reasons.push('Architect designs the system architecture');

    // Add backend/frontend based on components
    if (requirements.components.includes('frontend') && requirements.components.includes('backend')) {
      if (requirements.complexity === 'simple') {
        agents.push('developer');
        reasons.push('Full-stack Developer (combined) - simple enough for one agent');
      } else {
        agents.push('backend');
        agents.push('frontend');
        reasons.push('Separate Backend and Frontend developers - complexity requires specialization');
      }
    } else if (requirements.components.includes('backend')) {
      agents.push('backend');
      reasons.push('Backend Developer - API/backend only');
    } else if (requirements.components.includes('frontend')) {
      agents.push('frontend');
      reasons.push('Frontend Developer - UI only');
    }

    // Add database if needed
    if (requirements.needsDatabase) {
      agents.push('database');
      reasons.push('Database Designer - requirements indicate database is needed');
    }

    // Add tests if needed or complex
    if (requirements.needsTests || requirements.complexity !== 'simple') {
      agents.push('tester');
      reasons.push(requirements.needsTests
        ? 'Test Engineer - tests explicitly required'
        : 'Test Engineer - complexity warrants automated testing');
    }

    // Add DevOps if deployment needed or complex
    if (requirements.needsDeployment || requirements.complexity === 'complex') {
      agents.push('devops');
      reasons.push(requirements.needsDeployment
        ? 'DevOps Engineer - deployment explicitly required'
        : 'DevOps Engineer - complex apps need proper deployment setup');
    }

    // ALWAYS add Documenter
    agents.push('documenter');
    reasons.push('Technical Writer always provides documentation');

    // Generate agent configurations with backend/model assignment
    for (const agentName of agents) {
      const config = this.getAgentModelConfig(agentName, requirements.complexity, defaultBackend, defaultModel);
      agentConfigs.push(config);
    }

    const description = `Auto-generated workflow for: ${task}`;
    const reasoning = reasons.join('\n  - ');

    return {
      name: `auto-${requirements.complexity}-${Date.now()}`,
      description,
      agents,
      agentConfigs,
      reasoning: `Workflow composition:\n  - ${reasoning}`
    };
  }

  /**
   * Get backend and model configuration for an agent based on complexity and role
   */
  static getAgentModelConfig(
    agentName: string,
    complexity: 'simple' | 'moderate' | 'complex',
    defaultBackend?: string,
    defaultModel?: string
  ): AgentModelConfig {
    // Read from environment or use defaults
    const envBackend = defaultBackend || process.env.MODEL_BACKEND || 'ollama';
    const envModel = defaultModel || this.getDefaultModel(envBackend);

    // Assign models based on agent role and complexity
    const configs: Record<string, AgentModelConfig> = {
      requirements: {
        name: 'requirements',
        role: 'Requirements Engineer',
        backend: envBackend,
        model: envModel
      },
      architect: {
        name: 'architect',
        role: 'Software Architect',
        backend: complexity === 'complex' ? this.getBestBackend() : envBackend,
        model: complexity === 'complex' ? this.getBestModel(this.getBestBackend()) : envModel
      },
      developer: {
        name: 'developer',
        role: 'Full-stack Developer',
        backend: envBackend,
        model: envModel
      },
      backend: {
        name: 'backend',
        role: 'Backend Developer',
        backend: envBackend,
        model: envModel
      },
      frontend: {
        name: 'frontend',
        role: 'Frontend Developer',
        backend: envBackend,
        model: envModel
      },
      database: {
        name: 'database',
        role: 'Database Designer',
        backend: envBackend,
        model: envModel
      },
      tester: {
        name: 'tester',
        role: 'Test Engineer',
        backend: envBackend,
        model: envModel
      },
      devops: {
        name: 'devops',
        role: 'DevOps Engineer',
        backend: envBackend,
        model: envModel
      },
      documenter: {
        name: 'documenter',
        role: 'Technical Writer',
        backend: envBackend,
        model: envModel
      }
    };

    return configs[agentName] || {
      name: agentName,
      role: agentName.charAt(0).toUpperCase() + agentName.slice(1),
      backend: envBackend,
      model: envModel
    };
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
   * Get best available backend (checks what's configured)
   */
  private static getBestBackend(): string {
    // Priority: Claude > OpenAI > Ollama > Mock
    if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_USE_OAUTH === 'true') {
      return 'claude';
    }
    if (process.env.OPENAI_API_KEY) {
      return 'openai';
    }
    if (process.env.OLLAMA_URL) {
      return 'ollama';
    }
    return process.env.MODEL_BACKEND || 'ollama';
  }

  /**
   * Get best model for a backend
   */
  private static getBestModel(backend: string): string {
    const bestModels: Record<string, string> = {
      claude: 'claude-3-5-sonnet-20241022',
      anthropic: 'claude-3-5-sonnet-20241022',
      openai: 'gpt-4o',
      ollama: 'llama3',
      openwebui: 'llama3',
      mock: 'mock'
    };

    return bestModels[backend] || this.getDefaultModel(backend);
  }

  /**
   * Create initial requirements analysis prompt
   */
  static createRequirementsPrompt(task: string): string {
    return `You are a Requirements Engineer. Analyze this request and provide a structured analysis:

**Task:** ${task}

Provide your analysis in this EXACT format:

SCOPE: [1-2 sentences describing what needs to be built]

COMPONENTS: [List: frontend, backend, api, cli, etc.]

DATABASE_NEEDED: [YES or NO]

AUTHENTICATION_NEEDED: [YES or NO]

TESTS_NEEDED: [YES or NO]

DEPLOYMENT_NEEDED: [YES or NO]

COMPLEXITY: [simple, moderate, or complex]

RECOMMENDED_TECH: [List of recommended technologies]

MUST_HAVE_FEATURES: [List of core features]

NICE_TO_HAVE_FEATURES: [List of optional features]

REASONING: [Brief explanation of your decisions]

Be concise and precise. This analysis will be used to automatically generate the development workflow.`;
  }

  /**
   * Parse requirements from LLM response
   */
  static parseRequirementsResponse(response: string): RequirementsAnalysis | null {
    try {
      const lines = response.split('\n');
      const data: any = {};

      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (!key || valueParts.length === 0) continue;

        const value = valueParts.join(':').trim();
        const cleanKey = key.trim().toLowerCase().replace(/_/g, '');

        if (cleanKey === 'scope') data.scope = value;
        else if (cleanKey === 'components') {
          data.components = value.split(',').map(c => c.trim().toLowerCase());
        }
        else if (cleanKey === 'databaseneeded') data.needsDatabase = value.toUpperCase() === 'YES';
        else if (cleanKey === 'authenticationneeded') data.needsAuthentication = value.toUpperCase() === 'YES';
        else if (cleanKey === 'testsneeded') data.needsTests = value.toUpperCase() === 'YES';
        else if (cleanKey === 'deploymentneeded') data.needsDeployment = value.toUpperCase() === 'YES';
        else if (cleanKey === 'complexity') {
          const complexity = value.toLowerCase();
          if (['simple', 'moderate', 'complex'].includes(complexity)) {
            data.complexity = complexity;
          }
        }
        else if (cleanKey === 'recommendedtech') {
          data.recommendedTech = value.split(',').map(t => t.trim());
        }
      }

      // Validate required fields
      if (!data.scope || !data.components || data.complexity === undefined) {
        return null;
      }

      return data as RequirementsAnalysis;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get agent configuration for dynamic workflow
   */
  static getAgentConfig(agentName: string): {
    role: string;
    prompt: string;
  } {
    const configs: Record<string, { role: string; prompt: string }> = {
      requirements: {
        role: 'Requirements Engineer',
        prompt: this.createRequirementsPrompt('{TASK}')
      },
      architect: {
        role: 'Software Architect',
        prompt: `You are a Software Architect. Design the architecture for: {TASK}

Based on these requirements:
{requirements}

Provide:
1. System Overview (components, data flow)
2. Technology Stack (use recommendations from requirements)
3. API Design (if needed)
4. Architecture decisions

Follow the requirements analysis - especially regarding database (only if needed!)`
      },
      developer: {
        role: 'Full-Stack Developer',
        prompt: `You are a Full-Stack Developer. Implement: {TASK}

Requirements:
{requirements}

Architecture:
{architect}

Implement both frontend and backend following the architecture.`
      },
      backend: {
        role: 'Backend Developer',
        prompt: `You are a Backend Developer. Implement the backend for: {TASK}

Requirements:
{requirements}

Architecture:
{architect}

Focus on server-side logic, API, and business logic.`
      },
      frontend: {
        role: 'Frontend Developer',
        prompt: `You are a Frontend Developer. Implement the frontend for: {TASK}

Requirements:
{requirements}

Architecture:
{architect}

Backend API:
{backend}

Focus on UI/UX and client-side logic.`
      },
      database: {
        role: 'Database Designer',
        prompt: `You are a Database Designer. Design the database for: {TASK}

Requirements:
{requirements}

Architecture:
{architect}

Create schema, migrations, and seed data.`
      },
      tester: {
        role: 'Test Engineer',
        prompt: `You are a Test Engineer. Create tests for: {TASK}

Requirements:
{requirements}

Backend:
{backend}

Frontend:
{frontend}

Create unit, integration, and E2E tests.`
      },
      devops: {
        role: 'DevOps Engineer',
        prompt: `You are a DevOps Engineer. Create deployment setup for: {TASK}

Architecture:
{architect}

Create Docker setup, CI/CD pipeline, and deployment scripts.`
      },
      documenter: {
        role: 'Technical Writer',
        prompt: `You are a Technical Writer. Document: {TASK}

Requirements:
{requirements}

Architecture:
{architect}

Implementation:
{developer}{backend}{frontend}

Create README, API docs, and architecture documentation.`
      }
    };

    return configs[agentName] || {
      role: 'Agent',
      prompt: 'Perform your task for: {TASK}'
    };
  }
}
