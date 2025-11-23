import { MemoryManager } from '../memory/memory-manager';
import { AgentCapability } from './worker-agent';

/**
 * Learning experience stored by an agent
 */
export interface LearningExperience {
  id: string;
  agentId: string;
  agentName: string;
  agentType: AgentCapability[];
  task: string;
  success: boolean;
  duration?: number;
  output?: any;
  error?: string;
  context?: any;
  timestamp: Date;
  metadata: {
    keywords: string[];
    technologies: string[];
    taskType: string;
    complexity: 'simple' | 'medium' | 'complex';
  };
}

/**
 * AgentLearning - Enables individual agents to learn from their experiences
 */
export class AgentLearning {
  private agentId: string;
  private agentName: string;
  private agentType: AgentCapability[];
  private memory?: MemoryManager;
  private localExperiences: LearningExperience[] = [];
  private maxLocalExperiences = 100;

  constructor(
    agentId: string,
    agentName: string,
    agentType: AgentCapability[],
    memory?: MemoryManager
  ) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.agentType = agentType;
    this.memory = memory;
  }

  /**
   * Record a learning experience
   */
  async recordExperience(
    task: string,
    success: boolean,
    output?: any,
    error?: string,
    duration?: number,
    context?: any
  ): Promise<void> {
    const experience: LearningExperience = {
      id: crypto.randomUUID(),
      agentId: this.agentId,
      agentName: this.agentName,
      agentType: this.agentType,
      task,
      success,
      duration,
      output,
      error,
      context,
      timestamp: new Date(),
      metadata: this.extractMetadata(task, success, error, context)
    };

    // Store in local memory
    this.localExperiences.push(experience);
    if (this.localExperiences.length > this.maxLocalExperiences) {
      this.localExperiences.shift(); // Remove oldest
    }

    // Store in persistent memory if available
    if (this.memory) {
      try {
        await this.memory.storeLong(
          experience.id,
          this.formatExperienceForStorage(experience),
          {
            agent_id: this.agentId,
            agent_name: this.agentName,
            agent_type: this.agentType.join(','),
            task_type: experience.metadata.taskType,
            success: success,
            timestamp: experience.timestamp.toISOString(),
            keywords: experience.metadata.keywords.join(','),
            technologies: experience.metadata.technologies.join(','),
            complexity: experience.metadata.complexity,
            project: process.env.PROJECT_NAME || 'default'
          }
        );

        // Also store in global memory for cross-agent learning
        await this.memory.storeGlobal(
          experience.id,
          this.formatExperienceForStorage(experience),
          {
            agent_id: this.agentId,
            agent_name: this.agentName,
            agent_type: this.agentType.join(','),
            task_type: experience.metadata.taskType,
            success: success,
            shared_at: new Date().toISOString(),
            shared_from_project: process.env.PROJECT_NAME || 'default'
          }
        );
      } catch (err) {
        // Memory storage is optional, continue without it
        console.warn(`⚠️ Could not store experience in memory: ${err}`);
      }
    }
  }

  /**
   * Format experience for storage
   */
  private formatExperienceForStorage(exp: LearningExperience): string {
    return `
AGENT LEARNING EXPERIENCE
Agent: ${exp.agentName} (${exp.agentType.join(', ')})
Task: ${exp.task}
Result: ${exp.success ? 'SUCCESS' : 'FAILED'}
${exp.duration ? `Duration: ${exp.duration}ms` : ''}
${exp.error ? `Error: ${exp.error}` : ''}

Task Type: ${exp.metadata.taskType}
Complexity: ${exp.metadata.complexity}
Keywords: ${exp.metadata.keywords.join(', ')}
Technologies: ${exp.metadata.technologies.join(', ')}

${exp.output ? `Output: ${JSON.stringify(exp.output, null, 2)}` : ''}
`.trim();
  }

  /**
   * Extract metadata from task
   */
  private extractMetadata(
    task: string,
    success: boolean,
    error?: string,
    context?: any
  ): LearningExperience['metadata'] {
    const taskLower = task.toLowerCase();
    const keywords: string[] = [];
    const technologies: string[] = [];

    // Extract keywords
    const keywordPatterns = [
      'create', 'build', 'setup', 'configure', 'deploy', 'test',
      'debug', 'fix', 'refactor', 'optimize', 'design', 'implement'
    ];
    for (const kw of keywordPatterns) {
      if (taskLower.includes(kw)) {
        keywords.push(kw);
      }
    }

    // Extract technologies
    const techPatterns = [
      'react', 'vue', 'angular', 'typescript', 'javascript',
      'python', 'fastapi', 'django', 'flask',
      'docker', 'kubernetes', 'postgres', 'mongodb',
      'photoshop', 'gimp', 'figma'
    ];
    for (const tech of techPatterns) {
      if (taskLower.includes(tech)) {
        technologies.push(tech);
      }
    }

    // Determine task type based on agent capabilities
    let taskType = 'general';
    if (this.agentType.includes(AgentCapability.FRONTEND)) {
      taskType = 'frontend';
    } else if (this.agentType.includes(AgentCapability.BACKEND)) {
      taskType = 'backend';
    } else if (this.agentType.includes(AgentCapability.DEVOPS)) {
      taskType = 'devops';
    } else if (this.agentType.includes(AgentCapability.DESIGN)) {
      taskType = 'design';
    }

    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    if (keywords.length <= 1 && technologies.length <= 1) {
      complexity = 'simple';
    } else if (keywords.length >= 3 || technologies.length >= 2) {
      complexity = 'complex';
    }

    return {
      keywords,
      technologies,
      taskType,
      complexity
    };
  }

  /**
   * Get recent experiences
   */
  getRecentExperiences(limit = 10): LearningExperience[] {
    return this.localExperiences.slice(-limit);
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.localExperiences.length === 0) return 0;
    const successCount = this.localExperiences.filter(e => e.success).length;
    return successCount / this.localExperiences.length;
  }

  /**
   * Get experiences by technology
   */
  getExperiencesByTechnology(tech: string): LearningExperience[] {
    return this.localExperiences.filter(exp =>
      exp.metadata.technologies.includes(tech.toLowerCase())
    );
  }

  /**
   * Search for similar experiences
   */
  async searchSimilarExperiences(
    task: string,
    limit = 5
  ): Promise<Array<{ experience: string; similarity: number; metadata: any }>> {
    if (!this.memory) return [];

    try {
      const results = await this.memory.searchLong(task, limit);
      return results.map(r => ({
        experience: r.text,
        similarity: r.score,
        metadata: r.metadata
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Query knowledge from other agents (global memory)
   */
  async queryGlobalKnowledge(
    query: string,
    limit = 5
  ): Promise<Array<{ experience: string; similarity: number; metadata: any }>> {
    if (!this.memory) return [];

    try {
      const results = await this.memory.searchGlobal(query, limit);
      return results.map(r => ({
        experience: r.text,
        similarity: r.score,
        metadata: r.metadata
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalExperiences: number;
    successRate: number;
    avgDuration: number;
    topTechnologies: Array<{ tech: string; count: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
    complexityDistribution: { simple: number; medium: number; complex: number };
  } {
    const totalExperiences = this.localExperiences.length;
    const successRate = this.getSuccessRate();

    // Calculate average duration
    const durationsSum = this.localExperiences
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0);
    const avgDuration = durationsSum / Math.max(1, this.localExperiences.filter(e => e.duration).length);

    // Top technologies
    const techCounts: Record<string, number> = {};
    for (const exp of this.localExperiences) {
      for (const tech of exp.metadata.technologies) {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      }
    }
    const topTechnologies = Object.entries(techCounts)
      .map(([tech, count]) => ({ tech, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top keywords
    const keywordCounts: Record<string, number> = {};
    for (const exp of this.localExperiences) {
      for (const kw of exp.metadata.keywords) {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    }
    const topKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Complexity distribution
    const complexityDistribution = {
      simple: this.localExperiences.filter(e => e.metadata.complexity === 'simple').length,
      medium: this.localExperiences.filter(e => e.metadata.complexity === 'medium').length,
      complex: this.localExperiences.filter(e => e.metadata.complexity === 'complex').length
    };

    return {
      totalExperiences,
      successRate,
      avgDuration,
      topTechnologies,
      topKeywords,
      complexityDistribution
    };
  }
}
