import { AgentLearning } from '../agent-learning';
import { AgentCapability } from '../worker-agent';

/**
 * Minimal fake MemoryManager capturing calls (cast to any where needed)
 */
function createFakeMemory() {
  return {
    storeLong: jest.fn().mockResolvedValue(undefined),
    storeGlobal: jest.fn().mockResolvedValue(undefined),
    searchLong: jest.fn().mockResolvedValue([
      { id: '1', text: 'past experience', score: 0.9, metadata: { foo: 'bar' } }
    ]),
    searchGlobal: jest.fn().mockResolvedValue([])
  };
}

describe('AgentLearning', () => {
  const ORIGINAL_ENV = process.env.SHARE_LEARNING_GLOBAL;

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.SHARE_LEARNING_GLOBAL;
    } else {
      process.env.SHARE_LEARNING_GLOBAL = ORIGINAL_ENV;
    }
  });

  it('records experiences locally without a memory manager', async () => {
    const learning = new AgentLearning('a1', 'Test Agent', [AgentCapability.FRONTEND]);

    await learning.recordExperience('Create a react component', true, { ok: true }, undefined, 100);
    await learning.recordExperience('Fix docker deployment', false, undefined, 'boom', 50);

    const recent = learning.getRecentExperiences(10);
    expect(recent).toHaveLength(2);
    expect(recent[0].success).toBe(true);
    expect(recent[1].success).toBe(false);
    expect(learning.getSuccessRate()).toBe(0.5);
  });

  it('extracts technologies and keywords into metadata', async () => {
    const learning = new AgentLearning('a1', 'Test Agent', [AgentCapability.FRONTEND]);

    await learning.recordExperience('Create a react component with typescript', true);

    const [exp] = learning.getRecentExperiences(1);
    expect(exp.metadata.technologies).toContain('react');
    expect(exp.metadata.technologies).toContain('typescript');
    expect(exp.metadata.keywords).toContain('create');
    expect(exp.metadata.taskType).toBe('frontend');
  });

  it('persists to long-term memory when a memory manager is attached', async () => {
    const memory = createFakeMemory();
    const learning = new AgentLearning('a1', 'Test Agent', [AgentCapability.BACKEND], memory as any);

    await learning.recordExperience('Build an api endpoint', true);

    expect(memory.storeLong).toHaveBeenCalledTimes(1);
    const [, text, metadata] = memory.storeLong.mock.calls[0];
    expect(text).toContain('Build an api endpoint');
    expect(metadata.agent_name).toBe('Test Agent');
  });

  it('does NOT share to global memory by default (opt-in)', async () => {
    delete process.env.SHARE_LEARNING_GLOBAL;
    const memory = createFakeMemory();
    const learning = new AgentLearning('a1', 'Test Agent', [AgentCapability.BACKEND], memory as any);

    await learning.recordExperience('Build an api endpoint', true);

    expect(memory.storeGlobal).not.toHaveBeenCalled();
  });

  it('shares to global memory when SHARE_LEARNING_GLOBAL=true', async () => {
    process.env.SHARE_LEARNING_GLOBAL = 'true';
    const memory = createFakeMemory();
    const learning = new AgentLearning('a1', 'Test Agent', [AgentCapability.BACKEND], memory as any);

    await learning.recordExperience('Build an api endpoint', true);

    expect(memory.storeGlobal).toHaveBeenCalledTimes(1);
  });

  it('searchSimilarExperiences returns [] without memory and results with memory', async () => {
    const withoutMemory = new AgentLearning('a1', 'A', [AgentCapability.GENERAL]);
    expect(await withoutMemory.searchSimilarExperiences('react')).toEqual([]);

    const memory = createFakeMemory();
    const withMemory = new AgentLearning('a2', 'B', [AgentCapability.GENERAL]);
    withMemory.setMemory(memory as any);

    const results = await withMemory.searchSimilarExperiences('react');
    expect(memory.searchLong).toHaveBeenCalledWith('react', 5);
    expect(results).toHaveLength(1);
    expect(results[0].similarity).toBe(0.9);
  });

  it('caps local experiences at 100 entries', async () => {
    const learning = new AgentLearning('a1', 'A', [AgentCapability.GENERAL]);
    for (let i = 0; i < 110; i++) {
      await learning.recordExperience(`task ${i}`, true);
    }
    expect(learning.getRecentExperiences(1000)).toHaveLength(100);
    // Oldest entries were dropped
    expect(learning.getRecentExperiences(1000)[0].task).toBe('task 10');
  });

  it('computes stats (top technologies, complexity distribution)', async () => {
    const learning = new AgentLearning('a1', 'A', [AgentCapability.FRONTEND]);
    await learning.recordExperience('Create react component', true, undefined, undefined, 100);
    await learning.recordExperience('Create react page with typescript', true, undefined, undefined, 200);

    const stats = learning.getStats();
    expect(stats.totalExperiences).toBe(2);
    expect(stats.successRate).toBe(1);
    expect(stats.avgDuration).toBe(150);
    expect(stats.topTechnologies[0].tech).toBe('react');
  });
});
