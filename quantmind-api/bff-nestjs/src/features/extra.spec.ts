/**
 * File: src/features/extra.spec.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Supplementary BFF tests: the health controller payload, and the
 *   default-mapping branches of the controllers (optional fields omitted)
 *   to complete branch coverage on the logic files.
 * Source: specs/arch/SDD.md §2
 */
import { AgentClient } from '../agent/agent.client';
import { HealthController } from './features.module';
import { NewsController } from './news.controller';
import { StrategyController } from './strategy.controller';
import { CorrelatedRequest } from '../common/correlation.middleware';

const req = { correlationId: 'cid' } as CorrelatedRequest;

describe('HealthController', () => {
  it('reports ok', () => {
    expect(new HealthController().health()).toEqual({
      status: 'ok',
      service: 'quantmind-bff',
    });
  });
});

describe('Controller default branches', () => {
  const post = jest.fn().mockResolvedValue({});
  const client = { post } as unknown as AgentClient;

  beforeEach(() => post.mockClear());

  it('news defaults simulate_empty to false when omitted', async () => {
    await new NewsController(client).check({ symbol: 'NVDA' }, req);
    expect(post).toHaveBeenCalledWith(
      '/internal/v1/news-check',
      { symbol: 'NVDA', simulate_empty: false },
      'cid',
    );
  });

  it('strategy defaults framing/news label to null when omitted', async () => {
    await new StrategyController(client).generate({ symbol: 'NVDA' }, req);
    expect(post).toHaveBeenCalledWith(
      '/internal/v1/strategy',
      { symbol: 'NVDA', user_framing: null, news_label: null },
      'cid',
    );
  });
});
