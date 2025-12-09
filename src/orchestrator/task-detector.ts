/**
 * Task Detector - Intelligently detects if user input is a task
 * that should be delegated to agents vs. a simple question for LLM
 */

export interface TaskDetectionResult {
  isTask: boolean;
  confidence: number;
  reasoning: string;
  suggestedAgents?: string[];
  complexity?: 'simple' | 'moderate' | 'complex';
}

export class TaskDetector {
  // Action verbs that indicate tasks
  private taskVerbs = [
    'create', 'build', 'make', 'generate', 'implement', 'develop',
    'setup', 'configure', 'install', 'deploy', 'write', 'code',
    'design', 'architect', 'refactor', 'optimize', 'fix', 'debug',
    'add', 'remove', 'update', 'modify', 'change', 'improve',
    'test', 'validate', 'check', 'analyze', 'review', 'audit',
    'migrate', 'convert', 'transform', 'integrate', 'connect'
  ];

  // Question words that indicate queries (not tasks)
  private questionWords = [
    'what', 'why', 'how', 'when', 'where', 'who', 'which',
    'explain', 'describe', 'tell', 'show', 'is', 'are', 'does', 'can',
    'should', 'would', 'could', 'will', 'difference', 'meaning'
  ];

  // Technology keywords that suggest technical tasks
  private techKeywords = [
    'react', 'vue', 'angular', 'svelte', 'next',
    'node', 'express', 'fastapi', 'django', 'flask',
    'docker', 'kubernetes', 'k8s', 'helm', 'terraform',
    'postgres', 'mysql', 'mongodb', 'redis', 'sql',
    'typescript', 'javascript', 'python', 'rust', 'go',
    'api', 'endpoint', 'service', 'microservice', 'component',
    'database', 'schema', 'migration', 'deployment', 'pipeline'
  ];

  /**
   * Detect if input is a task
   */
  detect(input: string): TaskDetectionResult {
    const inputLower = input.toLowerCase();
    let confidence = 0;
    const reasons: string[] = [];

    // Check for task verbs (strong indicator)
    const hasTaskVerb = this.taskVerbs.some(verb => {
      const pattern = new RegExp(`\\b${verb}\\b`, 'i');
      return pattern.test(inputLower);
    });

    if (hasTaskVerb) {
      confidence += 0.4;
      reasons.push('Contains action verb');
    }

    // Check for question words (negative indicator)
    const hasQuestionWord = this.questionWords.some(word => {
      const pattern = new RegExp(`^${word}\\b`, 'i');
      return pattern.test(inputLower);
    });

    if (hasQuestionWord && !hasTaskVerb) {
      confidence -= 0.3;
      reasons.push('Starts with question word');
    }

    // Check for technology keywords (moderate indicator)
    const techMatches = this.techKeywords.filter(tech =>
      inputLower.includes(tech.toLowerCase())
    );

    if (techMatches.length > 0) {
      confidence += Math.min(techMatches.length * 0.15, 0.3);
      reasons.push(`Contains tech keywords: ${techMatches.join(', ')}`);
    }

    // Check for file/project indicators
    if (inputLower.match(/\.(ts|js|py|go|rs|java|cpp|c|h|json|yml|yaml|md|txt|csv)$/)) {
      confidence += 0.2;
      reasons.push('References file extension');
    }

    // Check for imperative mood (command-like structure)
    if (!hasQuestionWord && hasTaskVerb && inputLower.split(' ').length < 15) {
      confidence += 0.2;
      reasons.push('Imperative mood detected');
    }

    // Check for "with" or "using" (often indicates technical task)
    if (inputLower.includes(' with ') || inputLower.includes(' using ')) {
      confidence += 0.15;
      reasons.push('Contains "with/using"');
    }

    // Normalize confidence to 0-1 range
    confidence = Math.max(0, Math.min(1, confidence));

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    const wordCount = input.split(' ').length;
    const techCount = techMatches.length;

    if (techCount >= 3 || wordCount > 20) {
      complexity = 'complex';
    } else if (techCount >= 2 || wordCount > 10) {
      complexity = 'moderate';
    }

    // Determine suggested agents based on tech keywords
    const suggestedAgents = this.suggestAgents(techMatches);

    return {
      isTask: confidence >= 0.5,
      confidence,
      reasoning: reasons.join('; '),
      suggestedAgents,
      complexity
    };
  }

  /**
   * Suggest which agents should handle this task
   */
  private suggestAgents(techMatches: string[]): string[] {
    const agents = new Set<string>();

    const frontendTechs = ['react', 'vue', 'angular', 'svelte', 'next'];
    const backendTechs = ['fastapi', 'django', 'flask', 'express', 'node', 'api', 'endpoint'];
    const devopsTechs = ['docker', 'kubernetes', 'k8s', 'helm', 'terraform', 'deployment', 'pipeline'];
    const dbTechs = ['postgres', 'mysql', 'mongodb', 'redis', 'sql', 'database', 'schema'];

    if (techMatches.some(t => frontendTechs.includes(t))) {
      agents.add('frontend');
    }
    if (techMatches.some(t => backendTechs.includes(t))) {
      agents.add('backend');
    }
    if (techMatches.some(t => devopsTechs.includes(t))) {
      agents.add('devops');
    }
    if (techMatches.some(t => dbTechs.includes(t))) {
      agents.add('database');
    }

    return Array.from(agents);
  }

  /**
   * Quick check if input is likely a task (simplified)
   */
  isLikelyTask(input: string): boolean {
    return this.detect(input).isTask;
  }

  /**
   * Get confidence level
   */
  getConfidence(input: string): number {
    return this.detect(input).confidence;
  }
}

/**
 * Global task detector instance
 */
export const globalTaskDetector = new TaskDetector();
