import { TaskDelegator } from '../task-delegator';
import { AgentRegistry } from '../agent-registry';
import { MessageBus } from '../message-bus';
import { WorkerAgent, AgentCapability } from '../worker-agent';
import { LearningCoordinator } from '../learning-coordinator';

class StubAgent extends WorkerAgent {
  constructor(
    name: string,
    capabilities: AgentCapability[],
    bus: MessageBus,
    coordinator: LearningCoordinator
  ) {
    super(name, capabilities, undefined, bus, coordinator);
  }

  protected async executeTask(task: string): Promise<any> {
    return { handledBy: this.name, task };
  }
}

describe('TaskDelegator', () => {
  let bus: MessageBus;
  let registry: AgentRegistry;
  let coordinator: LearningCoordinator;
  let delegator: TaskDelegator;

  beforeEach(() => {
    bus = new MessageBus();
    registry = new AgentRegistry(bus);
    coordinator = new LearningCoordinator(registry, bus);
    delegator = new TaskDelegator(registry, bus);
  });

  afterEach(() => {
    coordinator.shutdown();
    registry.stopAll();
  });

  describe('classifyTask', () => {
    it('classifies frontend tasks', () => {
      const classifications = delegator.classifyTask('Create a react component');
      expect(classifications[0].capability).toBe(AgentCapability.FRONTEND);
      expect(classifications[0].keywords).toContain('react');
    });

    it('classifies devops tasks', () => {
      const classifications = delegator.classifyTask('Setup docker container deployment');
      expect(classifications[0].capability).toBe(AgentCapability.DEVOPS);
    });

    it('falls back to GENERAL for unclassifiable tasks', () => {
      const classifications = delegator.classifyTask('do the thing');
      expect(classifications[0].capability).toBe(AgentCapability.GENERAL);
    });
  });

  describe('findBestAgent', () => {
    it('prefers an idle agent with matching capability', () => {
      const frontend = new StubAgent('Frontend', [AgentCapability.FRONTEND], bus, coordinator);
      const general = new StubAgent('General', [AgentCapability.GENERAL], bus, coordinator);
      registry.register(frontend);
      registry.register(general);

      const best = delegator.findBestAgent('Create a react component');
      expect(best?.id).toBe(frontend.id);
    });

    it('falls back to a general agent when no specialist matches', () => {
      const general = new StubAgent('General', [AgentCapability.GENERAL], bus, coordinator);
      registry.register(general);

      const best = delegator.findBestAgent('Create a react component');
      expect(best?.id).toBe(general.id);
    });

    it('returns null when no agents are registered', () => {
      expect(delegator.findBestAgent('anything')).toBeNull();
    });
  });

  describe('delegate', () => {
    it('delegates end-to-end to the matching agent', async () => {
      const frontend = new StubAgent('Frontend', [AgentCapability.FRONTEND], bus, coordinator);
      registry.register(frontend);

      const result = await delegator.delegate('Create a react component', undefined, 1000);

      expect(result.success).toBe(true);
      expect(result.agentName).toBe('Frontend');
      expect(result.output.handledBy).toBe('Frontend');
    });

    it('returns an error result when no agents are available', async () => {
      const result = await delegator.delegate('Create a react component', undefined, 500);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no available agents/i);
    });
  });
});
