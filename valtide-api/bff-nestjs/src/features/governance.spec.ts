/**
 * File: src/features/governance.spec.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Description:
 *   Unit tests for the FR5 governance BFF controller (W3.2). Verifies it
 *   mediates to the AgentClient (P1) via GET on the internal governance
 *   route with the mapped filters and the propagated correlation id, and
 *   returns the agent's AuditLedgerRecord[] + canonical bundle shape. The
 *   AgentClient is mocked (like the other controllers' specs); the mock
 *   stands in for the real client, which carries the X-Internal-Token.
 * Source: specs/arch/SDD.md §2; valtide-ui/src/types.ts (AuditLedgerRecord)
 */
import { Test } from '@nestjs/testing';
import { AgentClient } from '../agent/agent.client';
import { GovernanceController } from './governance.controller';
import { CorrelatedRequest } from '../common/correlation.middleware';

/** A fake correlated request. */
const req = { correlationId: 'cid-gov-1' } as CorrelatedRequest;

/** A representative governance payload the agent would return. */
const payload = {
  correlationUuid: 'c08e4f1a-7b92-4f21-a39c-1982bde94a02',
  records: [
    {
      traceId: 'TRC-111',
      event: 'STOCK-300: Strategy Studio',
      symbol: 'NVDA',
      pipeline: 'AlphaAgent + Native Math',
      merkleHash: '0x' + 'a'.repeat(64),
      status: 'SEC-17a-4 Verified',
      timestamp: '2025-05-18 14:32:09 UTC',
      initiatingEntity: 'system',
      latencyMs: 18.4,
    },
  ],
  canonicalBundle: { provenance_merkle_root: '0x' + 'a'.repeat(64) },
};

describe('GovernanceController', () => {
  let governance: GovernanceController;
  const get = jest.fn().mockResolvedValue(payload);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [{ provide: AgentClient, useValue: { get } }],
    }).compile();
    governance = moduleRef.get(GovernanceController);
    get.mockClear();
  });

  it('calls the internal governance route with null filters + cid by default', async () => {
    await governance.ledger({}, req);
    expect(get).toHaveBeenCalledWith(
      '/internal/v1/governance',
      { symbol: null, correlation_id: null },
      'cid-gov-1',
    );
  });

  it('maps symbol + correlationId filters to snake_case and forwards cid', async () => {
    await governance.ledger(
      { symbol: 'NVDA', correlationId: 'c08e4f1a-7b92-4f21-a39c-1982bde94a02' },
      req,
    );
    expect(get).toHaveBeenCalledWith(
      '/internal/v1/governance',
      {
        symbol: 'NVDA',
        correlation_id: 'c08e4f1a-7b92-4f21-a39c-1982bde94a02',
      },
      'cid-gov-1',
    );
  });

  it('returns the agent payload shape (records[] + canonical bundle)', async () => {
    const res = (await governance.ledger({}, req)) as typeof payload;
    expect(res.records).toHaveLength(1);
    expect(res.records[0]).toEqual(
      expect.objectContaining({
        traceId: expect.any(String),
        merkleHash: expect.stringMatching(/^0x[0-9a-f]{64}$/),
        symbol: 'NVDA',
        latencyMs: 18.4,
      }),
    );
    expect(res.canonicalBundle.provenance_merkle_root).toBe(
      res.records[0].merkleHash,
    );
    expect(res.correlationUuid).toBe('c08e4f1a-7b92-4f21-a39c-1982bde94a02');
  });
});
