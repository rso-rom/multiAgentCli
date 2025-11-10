import { ToolDescriptor, COMMON_TOOLS } from './tool-descriptor';
import { checkToolsAvailability, getToolVersion } from './tool-checker';

/**
 * Global tool registry
 * Manages available tools for all agents
 */
export class ToolRegistry {
  private tools: Map<string, ToolDescriptor> = new Map();
  private initialized = false;

  constructor() {
    // Register common tools by default
    this.registerTools(COMMON_TOOLS);
  }

  /**
   * Register a single tool
   */
  registerTool(tool: ToolDescriptor): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: ToolDescriptor[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): ToolDescriptor | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolDescriptor[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get available tools only
   */
  getAvailableTools(): ToolDescriptor[] {
    return this.getAllTools().filter(t => t.available === true);
  }

  /**
   * Get unavailable tools
   */
  getUnavailableTools(): ToolDescriptor[] {
    return this.getAllTools().filter(t => t.available === false);
  }

  /**
   * Get tools by type
   */
  getToolsByType(type: string): ToolDescriptor[] {
    return this.getAllTools().filter(t => t.type === type);
  }

  /**
   * Initialize registry by checking all tools
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const tools = this.getAllTools();
    await checkToolsAvailability(tools);

    // Get versions for available tools
    for (const tool of tools) {
      if (tool.available) {
        const version = await getToolVersion(tool);
        if (version) {
          tool.version = version;
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Build tool context string for agent prompts
   */
  buildToolContext(toolNames?: string[]): string {
    let tools: ToolDescriptor[];

    if (toolNames && toolNames.length > 0) {
      // Filter to specific tools
      tools = toolNames
        .map(name => this.getTool(name))
        .filter((t): t is ToolDescriptor => t !== undefined);
    } else {
      // Use all available tools
      tools = this.getAvailableTools();
    }

    if (tools.length === 0) {
      return '';
    }

    const available = tools.filter(t => t.available);
    const unavailable = tools.filter(t => !t.available);

    let context = '[Available Tools]\n';

    if (available.length > 0) {
      context += 'You can use the following tools:\n';
      available.forEach(tool => {
        context += `- ${tool.name}: ${tool.usage}\n`;
      });
    }

    if (unavailable.length > 0) {
      context += '\nUnavailable tools (do not use):\n';
      unavailable.forEach(tool => {
        context += `- ${tool.name} (not installed)\n`;
      });
    }

    context += '\n';
    return context;
  }

  /**
   * Get status summary
   */
  getStatus(): {
    total: number;
    available: number;
    unavailable: number;
  } {
    const all = this.getAllTools();
    const available = this.getAvailableTools();

    return {
      total: all.length,
      available: available.length,
      unavailable: all.length - available.length
    };
  }
}

// Global singleton instance
export const globalToolRegistry = new ToolRegistry();
