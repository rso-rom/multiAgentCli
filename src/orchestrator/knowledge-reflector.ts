import { LearningExperience } from './agent-learning';
import { MemoryManager } from '../memory/memory-manager';

/**
 * Pattern identified from experiences
 */
export interface LearningPattern {
  id: string;
  pattern: string;
  confidence: number;
  occurrences: number;
  examples: string[];
  recommendation: string;
  category: 'success' | 'failure' | 'optimization' | 'insight';
}

/**
 * Reflection insight
 */
export interface ReflectionInsight {
  insight: string;
  evidence: string[];
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

/**
 * KnowledgeReflector - Analyzes experiences and generates meta-learning insights
 */
export class KnowledgeReflector {
  private memory?: MemoryManager;

  constructor(memory?: MemoryManager) {
    this.memory = memory;
  }

  /**
   * Reflect on a collection of experiences
   */
  async reflect(experiences: LearningExperience[]): Promise<{
    patterns: LearningPattern[];
    insights: ReflectionInsight[];
    recommendations: string[];
    summary: string;
  }> {
    console.log(`\n🤔 Knowledge Reflection started...`);
    console.log(`   Analyzing ${experiences.length} experiences\n`);

    const patterns = this.identifyPatterns(experiences);
    const insights = this.generateInsights(experiences, patterns);
    const recommendations = this.generateRecommendations(patterns, insights);
    const summary = this.generateSummary(experiences, patterns, insights);

    return {
      patterns,
      insights,
      recommendations,
      summary
    };
  }

  /**
   * Identify patterns in experiences
   */
  private identifyPatterns(experiences: LearningExperience[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // Pattern: Technologies that often fail
    const failingTechs = this.findFailingTechnologies(experiences);
    for (const [tech, data] of Object.entries(failingTechs)) {
      if (data.failureRate > 0.5 && data.count >= 3) {
        patterns.push({
          id: crypto.randomUUID(),
          pattern: `${tech} tasks have high failure rate (${(data.failureRate * 100).toFixed(0)}%)`,
          confidence: Math.min(0.9, data.failureRate + (data.count / 10)),
          occurrences: data.count,
          examples: data.examples,
          recommendation: `Review ${tech} implementation approach or provide more context for ${tech} tasks`,
          category: 'failure'
        });
      }
    }

    // Pattern: Successful task types
    const successfulTypes = this.findSuccessfulTaskTypes(experiences);
    for (const [type, data] of Object.entries(successfulTypes)) {
      if (data.successRate > 0.8 && data.count >= 3) {
        patterns.push({
          id: crypto.randomUUID(),
          pattern: `${type} tasks have high success rate (${(data.successRate * 100).toFixed(0)}%)`,
          confidence: Math.min(0.95, data.successRate),
          occurrences: data.count,
          examples: data.examples,
          recommendation: `Continue current approach for ${type} tasks`,
          category: 'success'
        });
      }
    }

    // Pattern: Complexity vs Success Rate
    const complexityAnalysis = this.analyzeComplexity(experiences);
    if (complexityAnalysis.complexFailureRate > complexityAnalysis.simpleFailureRate * 1.5) {
      patterns.push({
        id: crypto.randomUUID(),
        pattern: `Complex tasks fail ${((complexityAnalysis.complexFailureRate / complexityAnalysis.simpleFailureRate) * 100).toFixed(0)}% more often than simple tasks`,
        confidence: 0.85,
        occurrences: complexityAnalysis.complexCount,
        examples: complexityAnalysis.examples,
        recommendation: `Break down complex tasks into simpler subtasks for better success rate`,
        category: 'insight'
      });
    }

    // Pattern: Optimal task duration
    const durationAnalysis = this.analyzeDuration(experiences);
    if (durationAnalysis.insight) {
      patterns.push({
        id: crypto.randomUUID(),
        pattern: durationAnalysis.insight,
        confidence: 0.75,
        occurrences: durationAnalysis.count,
        examples: durationAnalysis.examples,
        recommendation: durationAnalysis.recommendation,
        category: 'optimization'
      });
    }

    // Pattern: Technology combinations
    const combos = this.findTechnologyCombinations(experiences);
    for (const combo of combos) {
      if (combo.occurrences >= 3) {
        patterns.push({
          id: crypto.randomUUID(),
          pattern: `${combo.technologies.join(' + ')} are often used together`,
          confidence: Math.min(0.9, 0.5 + (combo.occurrences / 10)),
          occurrences: combo.occurrences,
          examples: combo.examples,
          recommendation: `Consider creating specialized workflow for ${combo.technologies.join(' + ')} combinations`,
          category: 'insight'
        });
      }
    }

    return patterns;
  }

  /**
   * Find technologies with high failure rates
   */
  private findFailingTechnologies(experiences: LearningExperience[]): Record<string, {
    count: number;
    failureRate: number;
    examples: string[];
  }> {
    const techStats: Record<string, { total: number; failures: number; examples: string[] }> = {};

    for (const exp of experiences) {
      for (const tech of exp.metadata.technologies) {
        if (!techStats[tech]) {
          techStats[tech] = { total: 0, failures: 0, examples: [] };
        }
        techStats[tech].total++;
        if (!exp.success) {
          techStats[tech].failures++;
          if (techStats[tech].examples.length < 3) {
            techStats[tech].examples.push(exp.task.substring(0, 60) + '...');
          }
        }
      }
    }

    const result: Record<string, { count: number; failureRate: number; examples: string[] }> = {};
    for (const [tech, stats] of Object.entries(techStats)) {
      if (stats.total >= 2) {
        result[tech] = {
          count: stats.total,
          failureRate: stats.failures / stats.total,
          examples: stats.examples
        };
      }
    }

    return result;
  }

  /**
   * Find successful task types
   */
  private findSuccessfulTaskTypes(experiences: LearningExperience[]): Record<string, {
    count: number;
    successRate: number;
    examples: string[];
  }> {
    const typeStats: Record<string, { total: number; successes: number; examples: string[] }> = {};

    for (const exp of experiences) {
      const type = exp.metadata.taskType;
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, successes: 0, examples: [] };
      }
      typeStats[type].total++;
      if (exp.success) {
        typeStats[type].successes++;
        if (typeStats[type].examples.length < 3) {
          typeStats[type].examples.push(exp.task.substring(0, 60) + '...');
        }
      }
    }

    const result: Record<string, { count: number; successRate: number; examples: string[] }> = {};
    for (const [type, stats] of Object.entries(typeStats)) {
      if (stats.total >= 2) {
        result[type] = {
          count: stats.total,
          successRate: stats.successes / stats.total,
          examples: stats.examples
        };
      }
    }

    return result;
  }

  /**
   * Analyze complexity vs success rate
   */
  private analyzeComplexity(experiences: LearningExperience[]): {
    simpleFailureRate: number;
    complexFailureRate: number;
    complexCount: number;
    examples: string[];
  } {
    const simple = experiences.filter(e => e.metadata.complexity === 'simple');
    const complex = experiences.filter(e => e.metadata.complexity === 'complex');

    const simpleFailures = simple.filter(e => !e.success).length;
    const complexFailures = complex.filter(e => !e.success).length;

    return {
      simpleFailureRate: simple.length > 0 ? simpleFailures / simple.length : 0,
      complexFailureRate: complex.length > 0 ? complexFailures / complex.length : 0,
      complexCount: complex.length,
      examples: complex.filter(e => !e.success).slice(0, 3).map(e => e.task.substring(0, 60) + '...')
    };
  }

  /**
   * Analyze task duration
   */
  private analyzeDuration(experiences: LearningExperience[]): {
    insight: string | null;
    count: number;
    examples: string[];
    recommendation: string;
  } {
    const withDuration = experiences.filter(e => e.duration);
    if (withDuration.length < 5) {
      return { insight: null, count: 0, examples: [], recommendation: '' };
    }

    const avgDuration = withDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / withDuration.length;
    const longTasks = withDuration.filter(e => (e.duration || 0) > avgDuration * 2);

    if (longTasks.length >= 3) {
      return {
        insight: `${longTasks.length} tasks took significantly longer than average (${avgDuration.toFixed(0)}ms)`,
        count: longTasks.length,
        examples: longTasks.slice(0, 3).map(e => e.task.substring(0, 60) + '...'),
        recommendation: `Review and optimize long-running tasks for better performance`
      };
    }

    return { insight: null, count: 0, examples: [], recommendation: '' };
  }

  /**
   * Find common technology combinations
   */
  private findTechnologyCombinations(experiences: LearningExperience[]): Array<{
    technologies: string[];
    occurrences: number;
    examples: string[];
  }> {
    const combos: Record<string, { count: number; examples: string[] }> = {};

    for (const exp of experiences) {
      if (exp.metadata.technologies.length >= 2) {
        const sorted = exp.metadata.technologies.slice().sort();
        const key = sorted.join('+');
        if (!combos[key]) {
          combos[key] = { count: 0, examples: [] };
        }
        combos[key].count++;
        if (combos[key].examples.length < 3) {
          combos[key].examples.push(exp.task.substring(0, 60) + '...');
        }
      }
    }

    return Object.entries(combos)
      .map(([key, data]) => ({
        technologies: key.split('+'),
        occurrences: data.count,
        examples: data.examples
      }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5);
  }

  /**
   * Generate insights from patterns
   */
  private generateInsights(
    experiences: LearningExperience[],
    patterns: LearningPattern[]
  ): ReflectionInsight[] {
    const insights: ReflectionInsight[] = [];

    // Overall success trend
    const recentSuccessRate = this.calculateRecentSuccessRate(experiences);
    const overallSuccessRate = experiences.filter(e => e.success).length / experiences.length;
    if (Math.abs(recentSuccessRate - overallSuccessRate) > 0.15) {
      insights.push({
        insight: recentSuccessRate > overallSuccessRate
          ? `Success rate is improving: ${(recentSuccessRate * 100).toFixed(0)}% (recent) vs ${(overallSuccessRate * 100).toFixed(0)}% (overall)`
          : `Success rate is declining: ${(recentSuccessRate * 100).toFixed(0)}% (recent) vs ${(overallSuccessRate * 100).toFixed(0)}% (overall)`,
        evidence: [`Recent 10 tasks: ${(recentSuccessRate * 100).toFixed(0)}% success`, `All tasks: ${(overallSuccessRate * 100).toFixed(0)}% success`],
        confidence: 0.8,
        actionable: recentSuccessRate < overallSuccessRate,
        recommendation: recentSuccessRate < overallSuccessRate
          ? 'Investigate recent failures to identify root causes'
          : 'Current approach is working well, continue similar patterns'
      });
    }

    // Agent specialization
    const agentTypes = new Set(experiences.map(e => e.agentType.join(',')));
    if (agentTypes.size >= 3) {
      insights.push({
        insight: `Multi-agent collaboration is active: ${agentTypes.size} different agent types involved`,
        evidence: Array.from(agentTypes).slice(0, 5),
        confidence: 0.9,
        actionable: false
      });
    }

    // Learning patterns
    const failurePatterns = patterns.filter(p => p.category === 'failure');
    if (failurePatterns.length > 0) {
      insights.push({
        insight: `Identified ${failurePatterns.length} recurring failure pattern(s) that need attention`,
        evidence: failurePatterns.map(p => p.pattern),
        confidence: 0.85,
        actionable: true,
        recommendation: 'Address identified failure patterns to improve overall success rate'
      });
    }

    return insights;
  }

  /**
   * Calculate recent success rate
   */
  private calculateRecentSuccessRate(experiences: LearningExperience[]): number {
    const recent = experiences.slice(-10);
    if (recent.length === 0) return 0;
    return recent.filter(e => e.success).length / recent.length;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    patterns: LearningPattern[],
    insights: ReflectionInsight[]
  ): string[] {
    const recommendations: string[] = [];

    // From patterns
    for (const pattern of patterns) {
      if (pattern.category === 'failure' && pattern.confidence > 0.6) {
        recommendations.push(pattern.recommendation);
      }
    }

    // From insights
    for (const insight of insights) {
      if (insight.actionable && insight.recommendation) {
        recommendations.push(insight.recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Generate summary
   */
  private generateSummary(
    experiences: LearningExperience[],
    patterns: LearningPattern[],
    insights: ReflectionInsight[]
  ): string {
    const totalExperiences = experiences.length;
    const successRate = (experiences.filter(e => e.success).length / totalExperiences * 100).toFixed(0);
    const uniqueAgents = new Set(experiences.map(e => e.agentId)).size;
    const uniqueTechnologies = new Set(experiences.flatMap(e => e.metadata.technologies)).size;

    return `
📊 Reflection Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Experiences: ${totalExperiences}
Overall Success Rate: ${successRate}%
Active Agents: ${uniqueAgents}
Technologies Used: ${uniqueTechnologies}

Patterns Identified: ${patterns.length}
  ✅ Success Patterns: ${patterns.filter(p => p.category === 'success').length}
  ❌ Failure Patterns: ${patterns.filter(p => p.category === 'failure').length}
  💡 Insights: ${patterns.filter(p => p.category === 'insight').length}
  ⚡ Optimizations: ${patterns.filter(p => p.category === 'optimization').length}

Actionable Insights: ${insights.filter(i => i.actionable).length}
Recommendations: ${this.generateRecommendations(patterns, insights).length}
`.trim();
  }
}

/**
 * Global knowledge reflector instance
 */
export const globalKnowledgeReflector = new KnowledgeReflector();
