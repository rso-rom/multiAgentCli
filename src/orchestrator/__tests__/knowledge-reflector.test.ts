import { KnowledgeReflector } from '../knowledge-reflector';
import { LearningExperience } from '../agent-learning';
import { AgentCapability } from '../worker-agent';

let counter = 0;

function makeExperience(overrides: {
  success?: boolean;
  technologies?: string[];
  taskType?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  task?: string;
  agentId?: string;
  duration?: number;
}): LearningExperience {
  counter++;
  return {
    id: `exp-${counter}`,
    agentId: overrides.agentId || 'agent-1',
    agentName: 'Test Agent',
    agentType: [AgentCapability.GENERAL],
    task: overrides.task || `task ${counter}`,
    success: overrides.success ?? true,
    duration: overrides.duration,
    timestamp: new Date(),
    metadata: {
      keywords: ['create'],
      technologies: overrides.technologies || [],
      taskType: overrides.taskType || 'general',
      complexity: overrides.complexity || 'medium'
    }
  };
}

describe('KnowledgeReflector', () => {
  let reflector: KnowledgeReflector;

  beforeEach(() => {
    reflector = new KnowledgeReflector();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('identifies failing technologies as failure patterns', async () => {
    const experiences = [
      makeExperience({ technologies: ['docker'], success: false }),
      makeExperience({ technologies: ['docker'], success: false }),
      makeExperience({ technologies: ['docker'], success: false }),
      makeExperience({ technologies: ['docker'], success: true })
    ];

    const result = await reflector.reflect(experiences);

    const failurePattern = result.patterns.find(p => p.category === 'failure');
    expect(failurePattern).toBeDefined();
    expect(failurePattern!.pattern).toContain('docker');
    expect(failurePattern!.occurrences).toBe(4);
  });

  it('identifies successful task types as success patterns', async () => {
    const experiences = [
      makeExperience({ taskType: 'frontend', success: true }),
      makeExperience({ taskType: 'frontend', success: true }),
      makeExperience({ taskType: 'frontend', success: true }),
      makeExperience({ taskType: 'frontend', success: true })
    ];

    const result = await reflector.reflect(experiences);

    const successPattern = result.patterns.find(p => p.category === 'success');
    expect(successPattern).toBeDefined();
    expect(successPattern!.pattern).toContain('frontend');
  });

  it('identifies frequently combined technologies', async () => {
    const experiences = [
      makeExperience({ technologies: ['react', 'typescript'] }),
      makeExperience({ technologies: ['react', 'typescript'] }),
      makeExperience({ technologies: ['react', 'typescript'] })
    ];

    const result = await reflector.reflect(experiences);

    const comboPattern = result.patterns.find(
      p => p.category === 'insight' && p.pattern.includes('react') && p.pattern.includes('typescript')
    );
    expect(comboPattern).toBeDefined();
    expect(comboPattern!.occurrences).toBe(3);
  });

  it('generates recommendations for failure patterns', async () => {
    const experiences = [
      makeExperience({ technologies: ['docker'], success: false }),
      makeExperience({ technologies: ['docker'], success: false }),
      makeExperience({ technologies: ['docker'], success: false })
    ];

    const result = await reflector.reflect(experiences);

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.some(r => r.includes('docker'))).toBe(true);
  });

  it('produces a summary containing key figures', async () => {
    const experiences = [
      makeExperience({ success: true }),
      makeExperience({ success: false })
    ];

    const result = await reflector.reflect(experiences);

    expect(result.summary).toContain('Total Experiences: 2');
    expect(result.summary).toContain('50%');
  });

  it('pattern confidence stays within [0, 1]', async () => {
    const experiences = Array.from({ length: 20 }, (_, i) =>
      makeExperience({
        technologies: ['docker'],
        success: i % 3 !== 0,
        taskType: 'devops'
      })
    );

    const result = await reflector.reflect(experiences);
    for (const p of result.patterns) {
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(1);
    }
  });
});
