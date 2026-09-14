/**
 * File: src/features/features.spec.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Unit tests for the BFF controllers. Verifies each feature controller
 *   mediates to the AgentClient (P1) with the correctly mapped payload and
 *   the propagated correlation id, using a mocked client.
 * Source: specs/arch/SDD.md §2
 */
import { Test } from '@nestjs/testing';
import { AgentClient } from '../agent/agent.client';
import { NewsController } from './news.controller';
import { ScannerController } from './scanner.controller';
import { StrategyController } from './strategy.controller';
import { CorrelatedRequest } from '../common/correlation.middleware';

/** Build a fake correlated request. */
const req = { correlationId: 'cid-123' } as CorrelatedRequest;

describe('BFF feature controllers', () => {
  let news: NewsController;
  let scanner: ScannerController;
  let strategy: StrategyController;
  const post = jest.fn().mockResolvedValue({ ok: true });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NewsController, ScannerController, StrategyController],
      providers: [{ provide: AgentClient, useValue: { post } }],
    }).compile();
    news = moduleRef.get(NewsController);
    scanner = moduleRef.get(ScannerController);
    strategy = moduleRef.get(StrategyController);
    post.mockClear();
  });

  it('news controller forwards symbol + simulate_empty and cid', async () => {
    await news.check({ symbol: 'NVDA', simulateEmpty: true }, req);
    expect(post).toHaveBeenCalledWith(
      '/internal/v1/news-check',
      { symbol: 'NVDA', simulate_empty: true },
      'cid-123',
    );
  });

  it('scanner controller forwards universe (null default) and cid', async () => {
    await scanner.scan({}, req);
    expect(post).toHaveBeenCalledWith(
      '/internal/v1/scan',
      { universe: null },
      'cid-123',
    );
  });

  it('strategy controller maps framing/news label and cid', async () => {
    await strategy.generate(
      { symbol: 'NVDA', userFraming: 'x', newsLabel: 'REAL_CATALYST' },
      req,
    );
    expect(post).toHaveBeenCalledWith(
      '/internal/v1/strategy',
      { symbol: 'NVDA', user_framing: 'x', news_label: 'REAL_CATALYST' },
      'cid-123',
    );
  });
});
