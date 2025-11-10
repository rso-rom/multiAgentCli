import { MarkdownWorkflowParser } from './markdown-workflow-parser';

/**
 * Automatically selects the best workflow based on user input
 */
export class WorkflowSelector {
  /**
   * Analyze user input and suggest the best workflow
   */
  static analyzeTask(userInput: string): {
    workflow: string;
    confidence: number;
    reasoning: string;
  } {
    const input = userInput.toLowerCase();

    // Keywords for different workflows
    const patterns = {
      simple: {
        keywords: [
          'calculator', 'calc', 'rechner', 'addieren', 'subtrahieren',
          'demo', 'example', 'hello world', 'hallo welt',
          'simple', 'einfach', 'quick', 'schnell',
          'no database', 'ohne datenbank', 'in-memory'
        ],
        weight: 0,
        reasoning: 'Simple app without database - perfect for demos, calculators, prototypes'
      },
      quickstart: {
        keywords: [
          'prototype', 'prototyp', 'mvp', 'proof of concept',
          'quick start', 'schneller start', 'todo', 'note',
          'basic', 'minimal'
        ],
        weight: 0,
        reasoning: 'Quick prototype with minimal setup - 2 agents only'
      },
      api: {
        keywords: [
          'api', 'rest', 'graphql', 'endpoint',
          'backend only', 'server', 'microservice',
          'authentication', 'auth', 'user management'
        ],
        weight: 0,
        reasoning: 'REST API development with tests and documentation'
      },
      develop: {
        keywords: [
          'full-stack', 'fullstack', 'complete', 'vollständig',
          'production', 'produktiv', 'enterprise',
          'database', 'datenbank', 'postgres', 'mysql', 'mongodb',
          'deployment', 'docker', 'ci/cd',
          'e-commerce', 'webshop', 'blog', 'cms',
          'user authentication', 'multi-user'
        ],
        weight: 0,
        reasoning: 'Full-stack development with 7 agents - architecture, backend, frontend, database, tests, devops, docs'
      }
    };

    // Count keyword matches
    for (const [workflow, config] of Object.entries(patterns)) {
      for (const keyword of config.keywords) {
        if (input.includes(keyword)) {
          config.weight += 1;
        }
      }
    }

    // Special rules
    // If explicitly mentions "no database" → simple
    if (input.match(/no (database|db|datenbank)|ohne (database|db|datenbank)|in-memory/)) {
      patterns.simple.weight += 5;
    }

    // If mentions specific DB → develop
    if (input.match(/postgres|mysql|mongodb|redis|sqlite/)) {
      patterns.develop.weight += 3;
    }

    // If mentions tests, CI/CD, docker → develop
    if (input.match(/test|ci\/cd|docker|kubernetes|deployment/)) {
      patterns.develop.weight += 2;
    }

    // Find best match
    let bestWorkflow = 'simple'; // default
    let maxWeight = patterns.simple.weight;
    let reasoning = patterns.simple.reasoning;

    for (const [workflow, config] of Object.entries(patterns)) {
      if (config.weight > maxWeight) {
        maxWeight = config.weight;
        bestWorkflow = workflow;
        reasoning = config.reasoning;
      }
    }

    // Calculate confidence (0-1)
    const totalWeight = Object.values(patterns).reduce((sum, p) => sum + p.weight, 0);
    const confidence = totalWeight > 0 ? maxWeight / totalWeight : 0.5;

    return {
      workflow: bestWorkflow,
      confidence,
      reasoning
    };
  }

  /**
   * Get all available workflows with descriptions
   */
  static listWorkflows(): Array<{
    name: string;
    description: string;
    agents: number;
    hasDatabase: boolean;
    duration: string;
  }> {
    return [
      {
        name: 'simple',
        description: 'Simple app without database - demos, calculators, prototypes',
        agents: 4, // Requirements Engineer + Architect + Developer + Documenter
        hasDatabase: false,
        duration: '5-8 min'
      },
      {
        name: 'quickstart',
        description: 'Quick prototype - minimal setup',
        agents: 3, // Requirements Engineer + Architect + Coder
        hasDatabase: false,
        duration: '3-5 min'
      },
      {
        name: 'api',
        description: 'REST API with tests and documentation',
        agents: 5, // Requirements Engineer + Architect + Backend + Tester + Documenter
        hasDatabase: false, // optional
        duration: '8-10 min'
      },
      {
        name: 'develop',
        description: 'Full-stack production app with everything',
        agents: 8, // Requirements Engineer + Architect + Backend + Frontend + Database + Tester + DevOps + Documenter
        hasDatabase: true,
        duration: '15-20 min'
      }
    ];
  }

  /**
   * Interactive workflow selection
   */
  static async selectInteractive(userInput: string): Promise<string> {
    const suggestion = this.analyzeTask(userInput);

    console.log('\n🤖 Analyzing your task...\n');
    console.log(`📋 Suggested workflow: ${suggestion.workflow}`);
    console.log(`💡 Reason: ${suggestion.reasoning}`);
    console.log(`📊 Confidence: ${(suggestion.confidence * 100).toFixed(0)}%\n`);

    // For now, just return the suggestion
    // In the future, we can add inquirer prompt to confirm
    return suggestion.workflow;
  }
}
