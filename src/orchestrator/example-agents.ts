import { WorkerAgent, AgentCapability } from './worker-agent';
import { MessageBus } from './message-bus';

/**
 * Frontend Worker Agent
 * Specialized in React, Vue, Angular, UI/UX
 * Uses LLM for intelligent task execution
 */
export class FrontendAgent extends WorkerAgent {
  constructor(backend?: any, messageBus?: MessageBus) {
    super('Frontend Agent', [AgentCapability.FRONTEND], backend, messageBus);
  }

  protected async executeTask(task: string, context?: any): Promise<any> {
    // If backend available, use LLM for intelligent reasoning
    if (this.backend) {
      const systemPrompt = `You are a specialized Frontend Development Agent with expertise in:
- React, Vue, Angular, Svelte
- TypeScript, JavaScript, HTML, CSS
- State Management (Redux, Zustand, Pinia)
- UI/UX Design and Component Architecture
- Responsive Design and Accessibility

Your task is to analyze frontend development requests and provide concrete, actionable solutions.
Return your response as a JSON object with the structure:
{
  "action": "brief description of what was done",
  "framework": "primary framework used",
  "files": ["array", "of", "files", "created/modified"],
  "code": "optional code snippet if relevant",
  "steps": ["step 1", "step 2", "..."],
  "notes": "any important notes or recommendations"
}`;

      const userPrompt = `Task: ${task}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Analyze this frontend development task and provide a detailed solution.`;

      try {
        let response: string;

        // Check if backend has chat method (streaming)
        if (typeof this.backend.chat === 'function') {
          const chunks: string[] = [];
          await this.backend.chat(userPrompt, (chunk: string) => {
            chunks.push(chunk);
          }, systemPrompt);
          response = chunks.join('');
        } else {
          // Fallback for non-streaming backends
          response = await this.backend.complete?.(userPrompt, systemPrompt) ||
                     await this.backend.generate?.(userPrompt) ||
                     'LLM backend not properly configured';
        }

        // Try to parse JSON response
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // If JSON parsing fails, return structured response
        }

        // Return formatted response
        return {
          action: 'Frontend task analyzed',
          framework: this.detectFramework(task),
          response: response.trim(),
          task,
          agent: this.name
        };
      } catch (error: any) {
        throw new Error(`Frontend Agent LLM error: ${error.message}`);
      }
    }

    // Fallback if no backend (simulation mode)
    const taskLower = task.toLowerCase();
    if (taskLower.includes('react')) {
      return {
        action: 'Created React component',
        framework: 'React',
        files: ['src/components/NewComponent.tsx'],
        note: 'Simulated response - configure LLM backend for real execution'
      };
    }

    return {
      action: 'Frontend task ready',
      task,
      note: 'Configure LLM backend for intelligent task execution'
    };
  }

  private detectFramework(task: string): string {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('react')) return 'React';
    if (taskLower.includes('vue')) return 'Vue';
    if (taskLower.includes('angular')) return 'Angular';
    if (taskLower.includes('svelte')) return 'Svelte';
    return 'Generic Frontend';
  }
}

/**
 * Backend Worker Agent
 * Specialized in FastAPI, Django, Flask, APIs, Databases
 * Uses LLM for intelligent task execution
 */
export class BackendAgent extends WorkerAgent {
  constructor(backend?: any, messageBus?: MessageBus) {
    super('Backend Agent', [AgentCapability.BACKEND, AgentCapability.DATABASE], backend, messageBus);
  }

  protected async executeTask(task: string, context?: any): Promise<any> {
    if (this.backend) {
      const systemPrompt = `You are a specialized Backend Development Agent with expertise in:
- FastAPI, Django, Flask, Express.js
- RESTful API Design and GraphQL
- Database Design (PostgreSQL, MongoDB, Redis)
- Authentication & Authorization (JWT, OAuth)
- Microservices Architecture
- API Security and Rate Limiting

Provide concrete, production-ready solutions.
Return response as JSON:
{
  "action": "what was done",
  "framework": "backend framework",
  "endpoints": ["array of API endpoints"],
  "database": "database operations if any",
  "code": "optional code snippet",
  "steps": ["implementation steps"],
  "notes": "important notes"
}`;

      const userPrompt = `Task: ${task}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Analyze this backend development task and provide a detailed solution.`;

      try {
        let response: string;

        if (typeof this.backend.chat === 'function') {
          const chunks: string[] = [];
          await this.backend.chat(userPrompt, (chunk: string) => {
            chunks.push(chunk);
          }, systemPrompt);
          response = chunks.join('');
        } else {
          response = await this.backend.complete?.(userPrompt, systemPrompt) ||
                     await this.backend.generate?.(userPrompt) ||
                     'LLM backend not configured';
        }

        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) { /* Continue */ }

        return {
          action: 'Backend task analyzed',
          framework: this.detectFramework(task),
          response: response.trim(),
          task,
          agent: this.name
        };
      } catch (error: any) {
        throw new Error(`Backend Agent LLM error: ${error.message}`);
      }
    }

    // Fallback simulation
    const taskLower = task.toLowerCase();
    if (taskLower.includes('api')) {
      return {
        action: 'Created API endpoint',
        framework: 'FastAPI',
        endpoints: ['/api/v1/resource'],
        note: 'Simulated - configure LLM for real execution'
      };
    }

    return {
      action: 'Backend task ready',
      task,
      note: 'Configure LLM backend for intelligent execution'
    };
  }

  private detectFramework(task: string): string {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('fastapi')) return 'FastAPI';
    if (taskLower.includes('django')) return 'Django';
    if (taskLower.includes('flask')) return 'Flask';
    if (taskLower.includes('express')) return 'Express.js';
    return 'Generic Backend';
  }
}

/**
 * DevOps Worker Agent
 * Specialized in Docker, Kubernetes, CI/CD, Cloud Infrastructure
 * Uses LLM for intelligent task execution
 */
export class DevOpsAgent extends WorkerAgent {
  constructor(backend?: any, messageBus?: MessageBus) {
    super('DevOps Agent', [AgentCapability.DEVOPS], backend, messageBus);
  }

  protected async executeTask(task: string, context?: any): Promise<any> {
    if (this.backend) {
      const systemPrompt = `You are a specialized DevOps Agent with expertise in:
- Docker, Docker Compose, Kubernetes
- CI/CD (GitHub Actions, GitLab CI, Jenkins)
- Cloud Platforms (AWS, GCP, Azure)
- Infrastructure as Code (Terraform, Ansible)
- Monitoring and Logging
- Container Orchestration

Provide production-ready DevOps solutions.
Return response as JSON:
{
  "action": "what was done",
  "platform": "deployment platform",
  "files": ["config files created"],
  "services": ["services configured"],
  "commands": ["deployment commands"],
  "steps": ["implementation steps"],
  "notes": "important notes"
}`;

      const userPrompt = `Task: ${task}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Analyze this DevOps task and provide a detailed solution.`;

      try {
        let response: string;

        if (typeof this.backend.chat === 'function') {
          const chunks: string[] = [];
          await this.backend.chat(userPrompt, (chunk: string) => {
            chunks.push(chunk);
          }, systemPrompt);
          response = chunks.join('');
        } else {
          response = await this.backend.complete?.(userPrompt, systemPrompt) ||
                     await this.backend.generate?.(userPrompt) ||
                     'LLM backend not configured';
        }

        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) { /* Continue */ }

        return {
          action: 'DevOps task analyzed',
          platform: this.detectPlatform(task),
          response: response.trim(),
          task,
          agent: this.name
        };
      } catch (error: any) {
        throw new Error(`DevOps Agent LLM error: ${error.message}`);
      }
    }

    // Fallback simulation
    const taskLower = task.toLowerCase();
    if (taskLower.includes('docker')) {
      return {
        action: 'Created Docker configuration',
        files: ['Dockerfile', 'docker-compose.yml'],
        note: 'Simulated - configure LLM for real execution'
      };
    }

    return {
      action: 'DevOps task ready',
      task,
      note: 'Configure LLM backend for intelligent execution'
    };
  }

  private detectPlatform(task: string): string {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('docker')) return 'Docker';
    if (taskLower.includes('kubernetes') || taskLower.includes('k8s')) return 'Kubernetes';
    if (taskLower.includes('aws')) return 'AWS';
    if (taskLower.includes('gcp') || taskLower.includes('google cloud')) return 'GCP';
    if (taskLower.includes('azure')) return 'Azure';
    return 'Generic DevOps';
  }
}

/**
 * Design Worker Agent
 * Specialized in UI/UX, Graphics, Prototyping
 * Uses LLM for intelligent task execution
 */
export class DesignAgent extends WorkerAgent {
  constructor(backend?: any, messageBus?: MessageBus) {
    super('Design Agent', [AgentCapability.DESIGN], backend, messageBus);
  }

  protected async executeTask(task: string, context?: any): Promise<any> {
    if (this.backend) {
      const systemPrompt = `You are a specialized Design Agent with expertise in:
- UI/UX Design Principles
- Figma, Adobe XD, Sketch
- Design Systems and Component Libraries
- Accessibility (WCAG, ARIA)
- Color Theory and Typography
- User Research and Prototyping

Provide actionable design solutions.
Return response as JSON:
{
  "action": "what was designed",
  "tool": "design tool used",
  "components": ["UI components"],
  "colors": "color palette if relevant",
  "typography": "font recommendations",
  "steps": ["design steps"],
  "notes": "design notes"
}`;

      const userPrompt = `Task: ${task}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Analyze this design task and provide a detailed solution.`;

      try {
        let response: string;

        if (typeof this.backend.chat === 'function') {
          const chunks: string[] = [];
          await this.backend.chat(userPrompt, (chunk: string) => {
            chunks.push(chunk);
          }, systemPrompt);
          response = chunks.join('');
        } else {
          response = await this.backend.complete?.(userPrompt, systemPrompt) ||
                     await this.backend.generate?.(userPrompt) ||
                     'LLM backend not configured';
        }

        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) { /* Continue */ }

        return {
          action: 'Design task analyzed',
          tool: this.detectTool(task),
          response: response.trim(),
          task,
          agent: this.name
        };
      } catch (error: any) {
        throw new Error(`Design Agent LLM error: ${error.message}`);
      }
    }

    // Fallback simulation
    return {
      action: 'Design task ready',
      task,
      note: 'Configure LLM backend for intelligent execution'
    };
  }

  private detectTool(task: string): string {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('figma')) return 'Figma';
    if (taskLower.includes('photoshop')) return 'Photoshop';
    if (taskLower.includes('sketch')) return 'Sketch';
    if (taskLower.includes('xd')) return 'Adobe XD';
    return 'Generic Design Tool';
  }
}

/**
 * General Purpose Worker Agent
 * Handles tasks that don't fit specific specializations
 * Uses LLM for intelligent task execution
 */
export class GeneralAgent extends WorkerAgent {
  constructor(backend?: any, messageBus?: MessageBus) {
    super('General Agent', [AgentCapability.GENERAL], backend, messageBus);
  }

  protected async executeTask(task: string, context?: any): Promise<any> {
    if (this.backend) {
      const systemPrompt = `You are a General Purpose AI Agent capable of handling diverse tasks:
- Code analysis and review
- Documentation writing
- Problem solving
- Research and information gathering
- Testing and quality assurance
- Any general software engineering task

Provide clear, actionable solutions.
Return response as JSON:
{
  "action": "what was done",
  "category": "task category",
  "result": "task result",
  "steps": ["execution steps"],
  "notes": "important notes"
}`;

      const userPrompt = `Task: ${task}
${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Analyze and execute this task.`;

      try {
        let response: string;

        if (typeof this.backend.chat === 'function') {
          const chunks: string[] = [];
          await this.backend.chat(userPrompt, (chunk: string) => {
            chunks.push(chunk);
          }, systemPrompt);
          response = chunks.join('');
        } else {
          response = await this.backend.complete?.(userPrompt, systemPrompt) ||
                     await this.backend.generate?.(userPrompt) ||
                     'LLM backend not configured';
        }

        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) { /* Continue */ }

        return {
          action: 'General task analyzed',
          category: 'general',
          response: response.trim(),
          task,
          agent: this.name
        };
      } catch (error: any) {
        throw new Error(`General Agent LLM error: ${error.message}`);
      }
    }

    // Fallback simulation
    return {
      action: 'General task ready',
      task,
      note: 'Configure LLM backend for intelligent execution'
    };
  }
}
