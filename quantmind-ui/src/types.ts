/**
 * File: src/types.ts
 * Description: QuantMind source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
export type ModuleId =
  | 'stock-scanner'
  | 'opportunity-check'
  | 'strategy-studio'
  | 'historical-precedents'
  | 'audit-and-citations'
  | 'edge-cases'
  | 'component-showcase';

export interface TickerData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  compositeScore: number;
  valuationZ: number;
  valuationLabel: string;
  peRatio: number;
  mom3M: number;
  mom6M: number;
  rsi14: number;
  volRatio: number;
  volLabel: string;
  adv: string;
  universe: string;
  sector: string;
}

export interface VerdictState {
  ticker: string;
  company: string;
  sector: string;
  confidence: string;
  verdictClass: 'REAL CATALYST' | 'ALREADY PRICED IN' | 'HYPE DETECTED' | 'INSUFFICIENT EVIDENCE';
  subtitle: string;
  badgeColor: string;
  iconBg: string;
  icon: string;
  vector: string;
  vectorColor: string;
  vectorPeriod: string;
  rationale: string;
  eps: string;
  disp: string;
  dark: string;
  hype: string;
  conflict: string;
  citationsCount: string;
  citations: {
    pub: string;
    icon: string;
    title: string;
    desc: string;
    time: string;
    cred: string;
    hash: string;
  }[];
}

export interface AuditLedgerRecord {
  traceId: string;
  event: string;
  symbol: string;
  pipeline: string;
  merkleHash: string;
  status: string;
  timestamp: string;
  initiatingEntity: string;
  latencyMs: number;
}
