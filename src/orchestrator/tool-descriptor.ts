/**
 * Tool Descriptor Interface
 * Describes a tool that can be used by agents
 */
export interface ToolDescriptor {
  name: string;
  type?: string;
  description?: string;
  usage?: string;
  cli?: string;
  version?: string;
  available?: boolean;
  policy?: 'auto' | 'ask' | 'never';
  parameters?: Record<string, any>;
  execute?: (args: any) => Promise<any>;
}

/**
 * Common tool types
 */
export enum ToolType {
  DIAGRAMMING = 'diagramming',
  UI_TESTING = 'ui-testing',
  VERSION_CONTROL = 'version-control',
  DATABASE = 'database',
  WEB_SCRAPING = 'web-scraping',
  CODE_ANALYSIS = 'code-analysis',
  BUILD = 'build',
  DEPLOYMENT = 'deployment',
  CUSTOM = 'custom'
}

/**
 * Predefined common tools
 */
export const COMMON_TOOLS: ToolDescriptor[] = [
  {
    name: 'git',
    type: ToolType.VERSION_CONTROL,
    usage: 'Version control and repository management',
    cli: 'git'
  },
  {
    name: 'docker',
    type: 'containerization',
    usage: 'Build and run containerized applications',
    cli: 'docker'
  },
  {
    name: 'npm',
    type: ToolType.BUILD,
    usage: 'Node.js package management and build scripts',
    cli: 'npm'
  },
  {
    name: 'selenium',
    type: ToolType.UI_TESTING,
    usage: 'Automated browser testing',
    cli: 'selenium-side-runner'
  },
  {
    name: 'playwright',
    type: ToolType.UI_TESTING,
    usage: 'Modern web automation and testing',
    cli: 'playwright'
  },
  {
    name: 'draw.io',
    type: ToolType.DIAGRAMMING,
    usage: 'Create UML and flowcharts',
    cli: 'drawio'
  },
  {
    name: 'eslint',
    type: ToolType.CODE_ANALYSIS,
    usage: 'JavaScript/TypeScript code linting',
    cli: 'eslint'
  },
  {
    name: 'pytest',
    type: 'testing',
    usage: 'Python testing framework',
    cli: 'pytest'
  }
];
