export type NavTab = 
  | 'scanner-multi-factor'
  | 'news-catalyst-check'
  | 'strategy-engine-precedents'
  | 'governance-audit-log';

export interface SectorAsset {
  rank: string;
  ticker: string;
  name: string;
  price: string;
  priceNum: number;
  change: string;
  isPositive: boolean;
  peZ: string;
  peZPositive: boolean;
  mom: string;
  momPositive: boolean;
  rsi: number;
  score: number;
  volumeTrend: string;
  normPe: string;
  mom6M: string;
  cluster: string;
  clusterConf: string;
  clusterDesc: string;
}

export interface NewsHeadline {
  id: string;
  sourceType: 'SEC FILING' | 'BLOOMBERG' | 'REUTERS' | 'SOCIAL / HYPE';
  wireName: string;
  timestampUtc: string;
  title: string;
  impactScore: string;
  sentiment: 'Bullish' | 'Neutral-Positive' | 'Speculative' | 'Bearish';
  sentimentType: 'positive' | 'neutral' | 'speculative' | 'negative';
  entityMatch: string;
  url?: string;
  fullSnippet?: string;
}

export interface CatalystVerdict {
  ticker: string;
  confidence: string;
  status: 'REAL_CATALYST' | 'SPECULATIVE_HYPE' | 'MACRO_NEUTRAL';
  statusLabel: string;
  rationale: string;
  citations: Array<{
    id: number;
    title: string;
    source: string;
    timeAgo: string;
    textExcerpt?: string;
  }>;
  model: string;
  latencyMs: number;
}

export interface StrategyData {
  ticker: string;
  name: string;
  exchange: string;
  price: string;
  priceNum: number;
  change: string;
  volume: string;
  verdict: 'BUY_PULLBACK' | 'ACCUMULATE_BREAKOUT' | 'HOLD_RANGE' | 'REDUCE_EXPOSURE';
  auditStatus: string;
  confidence: string;
  trendAlignment: {
    status: string;
    daily: 'STRONG' | 'NEUTRAL' | 'WEAK';
    weekly: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    monthly: 'ACCEL' | 'STABLE' | 'DECEL';
  };
  maSpread: string;
  maSpreadPercent: number;
  atrVolatility: string;
  anchoredVwap: string;
  confluenceZones: Array<{
    name: string;
    range: string;
    tag: string;
    type: 'high' | 'major';
  }>;
  volumeProfilePoc: string;
  volumeProfileBars: number[];
  tradeParams: {
    entryTarget: string;
    entryType: string;
    stopLoss: string;
    stopLossPercent: string;
    profitTarget: string;
    profitTargetPercent: string;
    riskReward: string;
    ratioLabel: string;
  };
  executionRules: {
    invalidation: string;
    upgrade: string;
  };
  citations: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  historicalAnalogs: Array<{
    caseId: string;
    date: string;
    returnText: string;
    days: string;
    summary: string;
    matchScore: string;
    status: string;
  }>;
  secCorrelationId: string;
  secHash: string;
  node: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  correlationId: string;
  ticker: string;
  featureTriggered: string;
  citations: number;
  status: 'PASSED' | 'FLAGGED' | 'RESOLVED';
  hash: string;
  wormState: 'LOCKED' | 'PENDING';
  logs: string[];
}
