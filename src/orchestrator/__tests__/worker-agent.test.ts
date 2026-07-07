import { WorkerAgent, AgentCapability, AgentStatus } from '../worker-agent';
import { MessageBus, MessageType } from '../message-bus';
import { LearningCoordinator } from '../learning-coordinator';
import { AgentRegistry } from '../agent-registry';

/**
 * Controllable test agent
 */
class TestAgent extends WorkerAgent {
  public executeMock: (task: string, context?: any) => Promise<any>;

  constructor(bus: MessageBus, coordinator: LearningCoordinator) {
    super('Test Agent', [AgentCapability.GENERAL], undefined, bus, coordinator);
    this.executeMock = async task => ({ done: task });
  }

  protected async executeTask(task: string, context?: any): Promise<any> {
    return this.executeMock(task, context);
  }
}

describe('WorkerAgent', () => {
  let bus: MessageBus;
  let coordinator: LearningCoordinator;
  let agent: TestAgent;

  beforeEach(() => {
    bus = new MessageBus();
    coordinator = new LearningCoordinator(new AgentRegistry(bus), bus);
    agent = new TestAgent(bus, coordinator);
  });

  afterEach(() => {
    coordinator.shutdown();
  });

  it('executes a task request and responds with output and duration', async () => {
    const response = await bus.request(
      'tester',
      agent.id,
      MessageType.TASK_REQUEST,
      { task: 'do something' },
      1000
    );

    expect(response.payload.success).toBe(true);
    expect(response.payload.output).toEqual({ done: 'do something' });
    expect(typeof response.payload.duration).toBe('number');
    expect(agent.getInfo().status).toBe(AgentStatus.IDLE);
  });

  it('responds with error and releases the agent when executeTask throws', async () => {
    agent.executeMock = async () => {
      throw new Error('kaboom');
    };

    const response = await bus.request(
      'tester',
      agent.id,
      MessageType.TASK_REQUEST,
      { task: 'explode' },
      1000
    );

    expect(response.payload.success).toBe(false);
    expect(response.payload.error).toBe('kaboom');

    // try/finally must release the agent immediately (no setTimeout delay)
    expect(agent.getInfo().status).toBe(AgentStatus.IDLE);
    expect(agent.getInfo().currentTask).toBeNull();

    // Agent must accept the next task right away
    agent.executeMock = async task => ({ done: task });
    const next = await bus.request(
      'tester',
      agent.id,
      MessageType.TASK_REQUEST,
      { task: 'again' },
      1000
    );
    expect(next.payload.success).toBe(true);
  });

  it('rejects a second task while busy', async () => {
    let releaseTask!: () => void;
    agent.executeMock = () =>
      new Promise(resolve => {
        releaseTask = () => resolve({ done: 'slow' });
      });

    const first = bus.request(
      'tester',
      agent.id,
      MessageType.TASK_REQUEST,
      { task: 'slow task' },
      2000
    );

    // Give the agent a tick to switch to BUSY
    await new Promise(r => setImmediate(r));
    expect(agent.getInfo().status).toBe(AgentStatus.BUSY);

    const second = await bus.request(
      'tester',
      agent.id,
      MessageType.TASK_REQUEST,
      { task: 'too eager' },
      1000
    );
    expect(second.payload.success).toBe(false);
    expect(second.payload.error).toMatch(/busy/i);

    releaseTask();
    const firstResponse = await first;
    expect(firstResponse.payload.success).toBe(true);
  });

  it('records experiences for successes and failures', async () => {
    await bus.request('tester', agent.id, MessageType.TASK_REQUEST, { task: 'ok task' }, 1000);

    agent.executeMock = async () => {
      throw new Error('nope');
    };
    await bus.request('tester', agent.id, MessageType.TASK_REQUEST, { task: 'bad task' }, 1000);

    const learning = coordinator.getAgentLearning(agent.id)!;
    const experiences = learning.getRecentExperiences(10);
    expect(experiences).toHaveLength(2);
    expect(experiences[0].success).toBe(true);
    expect(experiences[1].success).toBe(false);
    expect(experiences[1].error).toBe('nope');
  });

  it('responds to agent queries with its info', async () => {
    const response = await bus.request(
      'tester',
      agent.id,
      MessageType.AGENT_QUERY,
      {},
      1000
    );

    expect(response.payload.id).toBe(agent.id);
    expect(response.payload.name).toBe('Test Agent');
    expect(response.payload.capabilities).toContain(AgentCapability.GENERAL);
  });
});
