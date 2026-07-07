import { MessageBus, MessageType, AgentMessage } from '../message-bus';

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new MessageBus();
  });

  it('delivers messages to the addressed subscriber only', () => {
    const receivedA: AgentMessage[] = [];
    const receivedB: AgentMessage[] = [];

    bus.subscribe('agent-a', m => receivedA.push(m));
    bus.subscribe('agent-b', m => receivedB.push(m));

    bus.publish({
      type: MessageType.TASK_REQUEST,
      from: 'tester',
      to: 'agent-a',
      payload: { task: 'x' }
    });

    expect(receivedA).toHaveLength(1);
    expect(receivedA[0].payload.task).toBe('x');
    expect(receivedB).toHaveLength(0);
  });

  it('assigns id and timestamp on publish', () => {
    const msg = bus.publish({
      type: MessageType.BROADCAST,
      from: 'tester',
      to: 'all',
      payload: {}
    });

    expect(msg.id).toBeTruthy();
    expect(msg.timestamp).toBeInstanceOf(Date);
  });

  it('delivers broadcasts to broadcast subscribers', () => {
    const received: AgentMessage[] = [];
    bus.subscribeBroadcast(m => received.push(m));

    bus.publish({
      type: MessageType.BROADCAST,
      from: 'tester',
      to: 'all',
      payload: { event: 'hello' }
    });

    expect(received).toHaveLength(1);
    expect(received[0].payload.event).toBe('hello');
  });

  it('supports request/response with correlation', async () => {
    bus.subscribe('responder', msg => {
      bus.respond(msg, 'responder', { success: true, echo: msg.payload.value });
    });

    const response = await bus.request(
      'requester',
      'responder',
      MessageType.TASK_REQUEST,
      { value: 42 },
      1000
    );

    expect(response.payload.success).toBe(true);
    expect(response.payload.echo).toBe(42);
    expect(response.type).toBe(MessageType.TASK_RESPONSE);
  });

  it('rejects a request after timeout when nobody responds', async () => {
    await expect(
      bus.request('requester', 'ghost', MessageType.TASK_REQUEST, {}, 50)
    ).rejects.toThrow(/timeout/i);
  });

  it('throws when responding to a message without correlationId', () => {
    const msg = bus.publish({
      type: MessageType.TASK_REQUEST,
      from: 'a',
      to: 'b',
      payload: {}
    });

    expect(() => bus.respond(msg, 'b', {})).toThrow(/correlationId/);
  });

  it('unsubscribe stops delivery', () => {
    const received: AgentMessage[] = [];
    const handler = (m: AgentMessage) => received.push(m);

    bus.subscribe('agent-a', handler);
    bus.unsubscribe('agent-a', handler);

    bus.publish({
      type: MessageType.TASK_REQUEST,
      from: 'tester',
      to: 'agent-a',
      payload: {}
    });

    expect(received).toHaveLength(0);
  });
});
