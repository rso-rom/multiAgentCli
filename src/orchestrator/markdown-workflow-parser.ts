import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { WorkflowDefinition, WorkflowStep } from './workflow';

/**
 * Parses markdown-based workflow definitions
 *
 * Format:
 * ---
 * name: workflow-name
 * description: Description
 * execution_mode: sequential|parallel
 * agents:
 *   - name: architect
 *     role: Software Architect
 *     backend: ollama
 *     model: llama3.2:3b
 * ---
 *
 * # Workflow Title
 *
 * ## Agent Name: Task Title
 *
 * Task description with $VARIABLES and {context_references}
 *
 * ---
 *
 * ## Next Agent: Next Task
 * ...
 */

interface MarkdownFrontmatter {
  name: string;
  description?: string;
  execution_mode?: 'sequential' | 'parallel';
  max_concurrent?: number;
  agents: Array<{
    name: string;
    role: string;
    backend: string;
    model?: string;
    tools?: string[];
  }>;
}

interface MarkdownSection {
  agentName: string;
  title: string;
  content: string;
}

export class MarkdownWorkflowParser {
  /**
   * Parse a markdown workflow file
   */
  static parseFile(filePath: string, variables: Record<string, string> = {}): WorkflowDefinition {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parseContent(content, variables);
  }

  /**
   * Parse markdown workflow content
   */
  static parseContent(content: string, variables: Record<string, string> = {}): WorkflowDefinition {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('Markdown workflow must start with YAML frontmatter');
    }

    const frontmatter = yaml.load(frontmatterMatch[1]) as MarkdownFrontmatter;

    // Extract markdown body (after frontmatter)
    const body = content.slice(frontmatterMatch[0].length).trim();

    // Parse sections (split by ## headers)
    const sections = this.parseSections(body);

    // Build workflow definition
    const agents: Record<string, any> = {};
    frontmatter.agents.forEach(agent => {
      agents[agent.name] = {
        role: agent.role,
        backend: agent.backend,
        model: agent.model,
        tools: agent.tools
      };
    });

    // Build steps from sections
    const steps: WorkflowStep[] = sections.map(section => {
      // Replace variables in content
      let input = this.replaceVariables(section.content, variables);

      // Detect context references (e.g., {architect}, {backend})
      const contextKeys = this.extractContextKeys(section.content);

      return {
        agent: section.agentName,
        input,
        context_keys: contextKeys.length > 0 ? contextKeys : undefined
      };
    });

    return {
      name: frontmatter.name,
      description: frontmatter.description,
      execution_mode: frontmatter.execution_mode || 'sequential',
      max_concurrent: frontmatter.max_concurrent,
      agents,
      steps
    };
  }

  /**
   * Parse markdown into sections (one per agent)
   */
  private static parseSections(markdown: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];

    // Split by ## headers
    const lines = markdown.split('\n');
    let currentSection: MarkdownSection | null = null;

    for (const line of lines) {
      // Check if this is a section header (## Agent: Title)
      const headerMatch = line.match(/^##\s+([^:]+):\s*(.*)$/);

      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        const agentName = headerMatch[1].trim().toLowerCase();
        const title = headerMatch[2].trim();

        currentSection = {
          agentName,
          title,
          content: ''
        };
      } else if (currentSection) {
        // Add line to current section
        currentSection.content += line + '\n';
      }
    }

    // Save last section
    if (currentSection) {
      sections.push(currentSection);
    }

    // Clean up section content
    sections.forEach(section => {
      section.content = section.content.trim();
    });

    return sections;
  }

  /**
   * Replace variables in content (e.g., $TASK, $ARGUMENTS, $1, $2)
   */
  private static replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;

    // Replace $TASK
    if (variables.task || variables.TASK) {
      result = result.replace(/\$TASK/g, variables.task || variables.TASK);
    }

    // Replace $ARGUMENTS (all arguments as one string)
    if (variables.arguments || variables.ARGUMENTS) {
      result = result.replace(/\$ARGUMENTS/g, variables.arguments || variables.ARGUMENTS);
    }

    // Replace positional arguments ($1, $2, etc.)
    Object.keys(variables).forEach(key => {
      if (key.match(/^\d+$/)) {
        const regex = new RegExp(`\\$${key}`, 'g');
        result = result.replace(regex, variables[key]);
      }
    });

    // Replace any other $VARIABLE
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\$${key.toUpperCase()}`, 'g');
      result = result.replace(regex, variables[key]);
    });

    return result;
  }

  /**
   * Extract context keys from content (e.g., {architect}, {backend})
   */
  private static extractContextKeys(content: string): string[] {
    const matches = content.match(/\{([a-zA-Z0-9_-]+)\}/g);
    if (!matches) return [];

    // Extract agent names from {agentName} references
    const keys = matches.map(m => m.slice(1, -1)); // Remove { and }

    // Remove duplicates
    return [...new Set(keys)];
  }

  /**
   * Find workflow file by name
   * Searches in: .claude/workflows/, ~/.claude/workflows/, templates/workflows/
   */
  static findWorkflow(name: string): string | null {
    const searchPaths = [
      path.join(process.cwd(), '.claude', 'workflows', `${name}.md`),
      path.join(process.cwd(), 'templates', 'workflows', `${name}.md`),
    ];

    // Also check home directory if available
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE!;
      searchPaths.unshift(path.join(homeDir, '.claude', 'workflows', `${name}.md`));
    }

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        return searchPath;
      }
    }

    return null;
  }

  /**
   * List all available workflows
   */
  static listWorkflows(): string[] {
    const workflows: string[] = [];

    const searchDirs = [
      path.join(process.cwd(), '.claude', 'workflows'),
      path.join(process.cwd(), 'templates', 'workflows'),
    ];

    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE!;
      searchDirs.unshift(path.join(homeDir, '.claude', 'workflows'));
    }

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.endsWith('.md')) {
            const name = file.replace('.md', '');
            if (!workflows.includes(name)) {
              workflows.push(name);
            }
          }
        });
      }
    }

    return workflows.sort();
  }
}
