import { LearningCoordinator } from '../learning-coordinator';
import { AgentRegistry } from '../agent-registry';
import { MessageBus, MessageType } from '../message-bus';
import { AgentCapability } from '../worker-agent';

function createFakeMemory() {
  return {
    storeLong: jest.fn().mockResolvedValue(undefined),
    storeGlobal: jest.fn().mockResolvedValue(undefined),
    searchLong: jest.fn().mockResolvedValue([]),
    searchGlobal: jest.fn().mockResolvedValue([])
  };
}

describe('LearningCoordinator', () => {
  let bus: MessageBus;
  let registry: AgentRegistry;
  let coordinator: LearningCoordinator;

  beforeEach(() => {
    bus = new MessageBus();
    registry = new AgentRegistry(bus);
    coordinator = new LearningCoordinator(registry, bus);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    coordinator.shutdown();
    jest.restoreAllMocks();
  });

  it('registerAgent returns the same learning instance for the same id', () => {
    const l1 = coordinator.registerAgent('a1', 'Agent 1', [AgentCapability.GENERAL]);
    const l2 = coordinator.registerAgent('a1', 'Agent 1', [AgentCapability.GENERAL]);
    expect(l1).toBe(l2);
    expect(coordinator.getAgentLearning('a1')).toBe(l1);
  });

  it('setMemory propagates to already-registered agents', async () => {
    const learning = coordinator.registerAgent('a1', 'Agent 1', [AgentCapability.GENERAL]);

    // Without memory: no results
    expect(await learning.searchSimilarExperiences('react')).toEqual([]);

    const memory = createFakeMemory();
    coordinator.setMemory(memory as any);

    await learning.searchSimilarExperiences('react');
    expect(memory.searchLong).toHaveBeenCalledWith('react', 5);
  });

  it('reflection session with no experiences returns an empty session', async () => {
    const result = await coordinator.conductReflectionSession();
    expect(result.patterns).toEqual([]);
    expect(result.session.experiencesAnalyzed).toBe(0);
    expect(result.session.knowledgeShared).toBe(false);
  });

  it('reflection session analyzes experiences and broadcasts learnings', async () => {
    const learning = coordinator.registerAgent('a1', 'Agent 1', [AgentCapability.DEVOPS]);
    await learning.recordExperience('Setup docker deployment', false, undefined, 'failed');
    await learning.recordExperience('Setup docker container', false, undefined, 'failed');
    await learning.recordExperience('Setup docker compose', false, undefined, 'failed');

    const broadcasts: any[] = [];
    bus.subscribeBroadcast(m => broadcasts.push(m));

    const result = await coordinator.conductReflectionSession();

    expect(result.session.experiencesAnalyzed).toBe(3);
    expect(result.session.participatingAgents).toContain('a1');
    expect(coordinator.getRecentSessions(5)).toHaveLength(1);

    // Learnings were broadcast to all agents
    const knowledgeBroadcast = broadcasts.find(
      b => b.type === MessageType.BROADCAST && b.payload.event === 'knowledge_shared'
    );
    expect(knowledgeBroadcast).toBeDefined();
  });

  it('aggregates collective stats across agents', async () => {
    const l1 = coordinator.registerAgent('a1', 'Agent 1', [AgentCapability.FRONTEND]);
    const l2 = coordinator.registerAgent('a2', 'Agent 2', [AgentCapability.BACKEND]);

    await l1.recordExperience('Create react component', true);
    await l2.recordExperience('Build api endpoint', false, undefined, 'error');

    const stats = coordinator.getCollectiveStats();
    expect(stats.totalAgents).toBe(2);
    expect(stats.totalExperiences).toBe(2);
    expect(stats.overallSuccessRate).toBeCloseTo(0.5);
    expect(stats.agentStats).toHaveLength(2);
  });

  it('auto-reflection can be enabled and disabled', () => {
    coordinator.enableAutoReflection(60);
    // enabling twice warns but does not create a second timer
    coordinator.enableAutoReflection(60);
    coordinator.disableAutoReflection();
    // disabling twice is safe
    coordinator.disableAutoReflection();
  });
});
