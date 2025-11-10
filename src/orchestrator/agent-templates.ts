import fs from 'fs';
import path from 'path';
import { AgentConfig } from './agent-factory';

/**
 * Manager for agent templates
 */
export class AgentTemplateManager {
  private templateDir: string;
  private templates: Map<string, AgentConfig> = new Map();

  constructor(templateDir = 'templates') {
    this.templateDir = templateDir;
  }

  /**
   * Load template by name
   */
  loadTemplate(name: string): AgentConfig | null {
    if (this.templates.has(name)) {
      return this.templates.get(name)!;
    }

    const filePath = path.join(this.templateDir, `${name}.json`);
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf-8');
    const template = JSON.parse(content) as AgentConfig;
    this.templates.set(name, template);
    return template;
  }

  /**
   * List available templates
   */
  listTemplates(): string[] {
    if (!fs.existsSync(this.templateDir)) return [];
    return fs.readdirSync(this.templateDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  /**
   * Create agent from template with overrides
   */
  createFromTemplate(name: string, overrides: Partial<AgentConfig>): AgentConfig | null {
    const template = this.loadTemplate(name);
    if (!template) return null;
    return { ...template, ...overrides };
  }
}

export const globalTemplateManager = new AgentTemplateManager();
