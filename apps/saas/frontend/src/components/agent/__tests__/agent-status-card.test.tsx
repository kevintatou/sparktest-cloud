import { isAgentOnline } from '@/components/agent/agent-status-card';

describe('AgentStatusCard', () => {
  const now = new Date('2026-09-04T20:00:00Z');

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('treats a recent heartbeat as online', () => {
    expect(isAgentOnline('2026-09-04T19:59:30Z')).toBe(true);
  });

  it('treats a stale heartbeat as offline regardless of stored status', () => {
    expect(isAgentOnline('2026-09-04T19:53:00Z')).toBe(false);
  });
});
