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

export class DynamicWorkflowGenerator {
  /**
   * Generate a workflow based on requirements analysis
   */
  static generateFromRequirements(
    task: string,
    requirements: RequirementsAnalysis
  ): {
    name: string;
    description: string;
    agents: string[];
    reasoning: string;
  } {
    const agents: string[] = [];
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

    const description = `Auto-generated workflow for: ${task}`;
    const reasoning = reasons.join('\n  - ');

    return {
      name: `auto-${requirements.complexity}-${Date.now()}`,
      description,
      agents,
      reasoning: `Workflow composition:\n  - ${reasoning}`
    };
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
