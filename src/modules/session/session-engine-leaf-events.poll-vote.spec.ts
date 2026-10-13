import { SessionEngineLeafEvents } from './session-engine-leaf-events';

describe('SessionEngineLeafEvents.dispatchPollVote', () => {
  const build = () => {
    const eventsGateway = { emitMessageVote: jest.fn() };
    const webhookService = { dispatch: jest.fn().mockResolvedValue(undefined) };
    const leaf = new SessionEngineLeafEvents({
      sessionRepository: {} as never,
      eventsGateway: eventsGateway as never,
      webhookService: webhookService as never,
      statusStore: {} as never,
      logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() } as never,
    });
    return { leaf, eventsGateway, webhookService };
  };

  it('sends the same payload to the socket and the message.vote webhook, flagging group chats', () => {
    const { leaf, eventsGateway, webhookService } = build();

    leaf.dispatchPollVote('sess-1', {
      messageId: 'POLL',
      chatId: '120363@g.us',
      voterId: '5511911111111@c.us',
      selectedOptions: [{ localId: 0, name: '🙋 Quero 1' }],
      timestamp: 10,
    });

    const payload = {
      messageId: 'POLL',
      chatId: '120363@g.us',
      isGroup: true,
      voterId: '5511911111111@c.us',
      selectedOptions: [{ localId: 0, name: '🙋 Quero 1' }],
      timestamp: 10,
    };
    expect(eventsGateway.emitMessageVote).toHaveBeenCalledWith('sess-1', payload);
    expect(webhookService.dispatch).toHaveBeenCalledWith('sess-1', 'message.vote', payload);
  });

  it('marks a private poll as not a group', () => {
    const { leaf, webhookService } = build();

    leaf.dispatchPollVote('sess-1', {
      messageId: 'P',
      chatId: 'peer@c.us',
      voterId: 'peer@c.us',
      selectedOptions: [],
      timestamp: 1,
    });

    const [, , payload] = webhookService.dispatch.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(payload).toMatchObject({ isGroup: false, selectedOptions: [] });
  });
});
