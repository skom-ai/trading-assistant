/**
 * File: src/data/mockData.ts
 * Description: QuantMind source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import { TickerData, VerdictState, AuditLedgerRecord } from '../types';

export const ASSETS = {
  brandLogo: 'https://lh3.googleusercontent.com/aida/AEtjO1U8zw7tQg7egRpIUEW3n4xaFtGFRqrGYJub6YaRk1CukHMQYd7lretFU1rHP5QLyQjDR-XSDh4B6BzzPScRkKjRPoVMED_88HfEP2D1a9na9SL28-CBYNZ9xHz72TwUOsxaZv_v3AeXSxNMDt0WndSoUHD2q54Lyuo3Mwp-dpIsODe3NwvhLwG_xijxdyJrkGt_sbjodexCB1Vfi-jcUdf22oBCZLvL8bzMVFtagYqXQUOYYtw8eDzw9NI',
  userProfile: 'https://lh3.googleusercontent.com/aida/AEtjO1XPdy9xMmnLYIPR1wMkGrKoGr80QNFNZZN-3zQukkQvXMHXR_Rsp_-3wcoCNDew9vhBhJ5ljaBZqmXGveHEcO5YrF72ulMcs4YkPZE5IdO7U6EtZtGkROAV96YTdqoTvCIt_iLZLwIIiLsYcWncxVUrbvPhcpWhtesjTkfikSQUadlSjWLTgnbuhasnkkeB7afrOpwS7znjW-WK-vI3ry3nYUuorypEc2xNCCHgJdEmNggabLhowO8RNko',
  datacenterTelemetry: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvxd1zMJl5AdKbqLHLEFDayEi4TpN3RDMgS5kvSTmmbuT12DGLNqMk56jMa4QKH6Vo-wrh1TjlejYcIHEZn70UOkyIjCtRMpg8Co9vvYwMfAWpZaADDlKp0kPoF6tIwU0Nfv3wsco1SZKD-_pPpUO6ggi732pDKpcd7wBRzTEXLhZov27_PMJ0-CioYEPkc7GEX4ArPeEBIdnPZEkMyIFJsG2vM6JsjrsUXpU010iEdv9udp5wsO9b'
};

export const SECTORS = [
  { id: 'IT', name: 'Information Technology', count: 78 },
  { id: 'HC', name: 'Health Care', count: 64 },
  { id: 'FIN', name: 'Financials', count: 72 },
  { id: 'CD', name: 'Consumer Discretionary', count: 53 },
  { id: 'COMM', name: 'Communication Services', count: 22 },
  { id: 'IND', name: 'Industrials', count: 78 },
  { id: 'CS', name: 'Consumer Staples', count: 38 },
  { id: 'ENG', name: 'Energy', count: 23 },
  { id: 'RE', name: 'Real Estate', count: 31 },
  { id: 'MAT', name: 'Materials', count: 28 },
  { id: 'UTL', name: 'Utilities', count: 30 }
];

export const INITIAL_TICKERS: TickerData[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    price: 128.45,
    changePercent: 3.42,
    compositeScore: 94.8,
    valuationZ: -1.42,
    valuationLabel: '-1.42σ (Attractive)',
    peRatio: 48.6,
    mom3M: 24.8,
    mom6M: 48.2,
    rsi14: 58.4,
    volRatio: 1.38,
    volLabel: '1.38x (Spike)',
    adv: '48.2M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp',
    price: 428.10,
    changePercent: 1.18,
    compositeScore: 91.2,
    valuationZ: -0.85,
    valuationLabel: '-0.85σ (Low P/E)',
    peRatio: 29.1,
    mom3M: 12.4,
    mom6M: 26.1,
    rsi14: 54.2,
    volRatio: 1.04,
    volLabel: '1.04x (Normal)',
    adv: '22.8M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc',
    price: 162.20,
    changePercent: 2.05,
    compositeScore: 88.5,
    valuationZ: -0.45,
    valuationLabel: '-0.45σ (Fair)',
    peRatio: 32.5,
    mom3M: 19.2,
    mom6M: 41.0,
    rsi14: 61.9,
    volRatio: 1.25,
    volLabel: '1.25x (Spike)',
    adv: '16.4M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'ORCL',
    name: 'Oracle Corp',
    price: 174.60,
    changePercent: 0.88,
    compositeScore: 86.7,
    valuationZ: -1.10,
    valuationLabel: '-1.10σ (Attractive)',
    peRatio: 22.4,
    mom3M: 22.1,
    mom6M: 34.5,
    rsi14: 59.8,
    volRatio: 0.96,
    volLabel: '0.96x (Avg)',
    adv: '11.5M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'QCOM',
    name: 'QUALCOMM Inc',
    price: 168.30,
    changePercent: -0.42,
    compositeScore: 84.1,
    valuationZ: -1.78,
    valuationLabel: '-1.78σ (Value)',
    peRatio: 18.2,
    mom3M: 14.2,
    mom6M: 18.9,
    rsi14: 48.1,
    volRatio: 1.11,
    volLabel: '1.11x (Normal)',
    adv: '9.8M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'AMD',
    name: 'Adv Micro Dev',
    price: 139.75,
    changePercent: 1.65,
    compositeScore: 81.9,
    valuationZ: 0.32,
    valuationLabel: '+0.32σ (Fair)',
    peRatio: 38.0,
    mom3M: 11.8,
    mom6M: 22.4,
    rsi14: 52.3,
    volRatio: 1.09,
    volLabel: '1.09x (Normal)',
    adv: '34.1M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'CRM',
    name: 'Salesforce Inc',
    price: 312.40,
    changePercent: 0.50,
    compositeScore: 79.4,
    valuationZ: -0.64,
    valuationLabel: '-0.64σ (Low P/E)',
    peRatio: 26.5,
    mom3M: 8.5,
    mom6M: 17.2,
    rsi14: 51.0,
    volRatio: 0.91,
    volLabel: '0.91x (Avg)',
    adv: '6.2M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'ADBE',
    name: 'Adobe Systems',
    price: 504.80,
    changePercent: -0.82,
    compositeScore: 77.3,
    valuationZ: -0.98,
    valuationLabel: '-0.98σ (Low P/E)',
    peRatio: 24.8,
    mom3M: 4.1,
    mom6M: 14.6,
    rsi14: 45.7,
    volRatio: 0.88,
    volLabel: '0.88x (Low)',
    adv: '4.9M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'NOW',
    name: 'ServiceNow Inc',
    price: 915.20,
    changePercent: 1.40,
    compositeScore: 75.1,
    valuationZ: 0.68,
    valuationLabel: '+0.68σ (Premium)',
    peRatio: 52.0,
    mom3M: 16.4,
    mom6M: 29.0,
    rsi14: 57.0,
    volRatio: 1.02,
    volLabel: '1.02x (Avg)',
    adv: '3.1M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  },
  {
    symbol: 'PANW',
    name: 'Palo Alto Networks',
    price: 348.90,
    changePercent: 2.12,
    compositeScore: 73.8,
    valuationZ: 0.85,
    valuationLabel: '+0.85σ (Premium)',
    peRatio: 56.4,
    mom3M: 15.1,
    mom6M: 27.4,
    rsi14: 53.6,
    volRatio: 1.41,
    volLabel: '1.41x (Spike)',
    adv: '5.8M SHS',
    universe: 'S&P 500 TECH',
    sector: 'IT'
  }
];

export const VERDICT_STATES: Record<string, VerdictState> = {
  'real-catalyst': {
    ticker: 'NVDA',
    company: 'NASDAQ: NVIDIA CORP',
    sector: 'SEMICONDUCTORS // AI ACCELERATION',
    confidence: '94.2%',
    verdictClass: 'REAL CATALYST',
    subtitle: 'Unannounced hyperscaler multi-year CAPEX commitment expands gross margins above baseline street models.',
    badgeColor: 'text-tertiary',
    iconBg: 'bg-tertiary-container text-on-tertiary-container',
    icon: 'bolt',
    vector: '+6.48%',
    vectorColor: 'text-tertiary',
    vectorPeriod: 'Normalized 5-Day Run',
    rationale: 'Market reaction was evaluated against trailing FY25 Q1 guidance ($28.0B ±2%). The confirmed hyperscaler sovereign procurement announcements aggregate <span class="text-tertiary font-semibold font-mono">$14.2B</span> in unmodeled hardware obligations across 2H2025. Institutional dark pool cumulative delta shows high-conviction block accumulation with negligible sell-side supply overhang in the $118-$125 corridor.',
    eps: '+18.4 bps',
    disp: '1.82 σ (High)',
    dark: '+$482M Bid',
    hype: '0.31 (Low Sub)',
    conflict: '<strong class="text-on-surface font-medium">Contradictory Wire Flagged:</strong> A secondary Reuters opinion piece cited export curb headwinds affecting 11% of regional shipments. The engine deliberately committed to <span class="text-tertiary font-semibold font-mono">REAL CATALYST</span> rather than abstaining because SEC 8-K disclosures and corroborated procurement agreements on ledger supersede unverified geopolitical trade speculation by a 4.8:1 evidentiary weight coefficient.',
    citationsCount: '3 Primary Corroborations',
    citations: [
      { pub: 'Bloomberg Terminals', icon: 'verified', title: 'Nvidia Secures Multi-Billion Enterprise Compute Contracts Across Sovereign Cloud Initiatives', desc: 'Sovereign entities commit to $14.2B multi-year hardware expansion cycles with guaranteed foundry allocation.', time: '2025-05-18 10:41:22 UTC', cred: 'TIER-1 (99.1%)', hash: '0x7f9a...c421' },
      { pub: 'Reuters Financial', icon: 'verified', title: 'Hyperscale Cloud CAPEX Guidance Revised Upward 14% Citing Blackwell Architecture Lead', desc: 'Consensus checks affirm order backlog stretches 5 quarters forward with negligible cancellation provisions.', time: '2025-05-18 08:15:04 UTC', cred: 'TIER-1 (98.4%)', hash: '0x3b1c...e890' },
      { pub: 'SEC EDGAR', icon: 'policy', title: 'Form 8-K: Material Definitive Supply Agreement Execution and Schedule Revision', desc: 'Legal affirmation of capacity commitment with Tier-1 foundry packaging partner through Q4 2026.', time: '2025-05-17 21:02:11 UTC', cred: 'SEC OFFICIAL (100%)', hash: '0x9e44...fd12' }
    ]
  },
  'already-priced': {
    ticker: 'AAPL',
    company: 'NASDAQ: APPLE INC',
    sector: 'CONSUMER ELECTRONICS // ECOSYSTEM',
    confidence: '89.6%',
    verdictClass: 'ALREADY PRICED IN',
    subtitle: 'Feature integration announcement matches pre-existing sell-side research notes published 34 days prior.',
    badgeColor: 'text-secondary',
    iconBg: 'bg-secondary-container text-on-secondary-container',
    icon: 'sync_saved_locally',
    vector: '-0.32%',
    vectorColor: 'text-on-surface-variant',
    vectorPeriod: 'Post-Event Drift Flat',
    rationale: 'Comparative multi-factor analysis detected that the reported operating system AI feature rollout was fully modeled in 92% of street equity models following the February developer conference leak. Trailing 30-day option implied volatility contracted 4.2 vol points upon headline transmission, indicating an institutional "sell-the-news" liquidity absorption profile.',
    eps: '+0.2 bps',
    disp: '0.41 σ (Tight)',
    dark: '-$112M Overhang',
    hype: '0.84 (High Sat)',
    conflict: '<strong class="text-on-surface font-medium">Contradictory Wire Flagged:</strong> Consumer blogs reported viral social adoption spikes. However, dealer gamma exposure demonstrated market makers were structurally long calls at strike, dampening delta expansion. The system commits to <span class="text-secondary font-semibold font-mono">ALREADY PRICED IN</span> because institutional positioning absorbed retail churn with zero new capital commitment.',
    citationsCount: '2 Synthesized Citations',
    citations: [
      { pub: 'Wall Street Journal', icon: 'verified', title: 'Apple Intelligence Rollout Enters Tiered Deployment For International Markets', desc: 'Detailed release schedules match analyst models with no incremental subscription price adjustments.', time: '2025-05-18 06:12:00 UTC', cred: 'TIER-1 (96.5%)', hash: '0x22c4...aa81' },
      { pub: 'Morgan Stanley Res', icon: 'description', title: 'Equity Research Note: Device Replacement Cycle Multi-Year Model Reaffirmation', desc: 'Estimates for iPhone 16 Pro supercycle remain calibrated at 225M run-rate units.', time: '2025-05-17 14:22:15 UTC', cred: 'INSTITUTIONAL (94.0%)', hash: '0x18a9...b566' }
    ]
  },
  'hype': {
    ticker: 'TSLA',
    company: 'NASDAQ: TESLA INC',
    sector: 'AUTOMOTIVE // AUTONOMOUS AI',
    confidence: '91.8%',
    verdictClass: 'HYPE DETECTED',
    subtitle: 'Social headline velocity unbacked by regulatory filings, manufacturing certifications, or Capex.',
    badgeColor: 'text-error',
    iconBg: 'bg-error-container text-on-error-container',
    icon: 'campaign',
    vector: '-3.15%',
    vectorColor: 'text-error',
    vectorPeriod: 'Mean-Reverting Skew',
    rationale: 'Sentiment scoring engines flagged a 410% surge in retail social media chatter regarding a speculative autonomous fleet rollout. Cross-referencing SEC 10-Q filings, NHTSA regulatory submission registers, and municipal transport permit filings yielded zero factual corroborating artifacts. Order books display predatory retail ask-lifting into aggressive market-maker sweep limits.',
    eps: '0.0 bps',
    disp: '3.12 σ (Extreme)',
    dark: '-$340M Supply Wall',
    hype: '0.98 (Peak Hype)',
    conflict: '<strong class="text-on-surface font-medium">Contradictory Wire Flagged:</strong> An aggregator site claimed unverified prototype testing had concluded. The deterministic engine rejects unverified claims per STOCK-105 standards: social sentiment alone without regulatory or SEC filings is automatically classified as <span class="text-error font-semibold font-mono">HYPE</span> to safeguard user execution capital.',
    citationsCount: '2 Filtered Artifacts',
    citations: [
      { pub: 'Social Sentiment Aggregator', icon: 'forum', title: 'Speculative Robotaxi Pilot Fleet Sighted in Unmarked Test Corridor', desc: 'Unverified photograph cluster distributed via community forum without official corporate commentary.', time: '2025-05-18 11:10:00 UTC', cred: 'UNVERIFIED (32.1%)', hash: '0x55aa...3341' },
      { pub: 'NHTSA Public Register', icon: 'gavel', title: 'Monthly Autonomous Vehicle Exemption and Commercial Testing Log', desc: 'No active exemptions or test filings submitted by manufacturer for requested metropolitan area.', time: '2025-05-17 19:00:00 UTC', cred: 'GOV REGULATORY (100%)', hash: '0xee12...9990' }
    ]
  },
  'insufficient': {
    ticker: 'IONQ',
    company: 'NYSE: IONQ INC',
    sector: 'QUANTUM COMPUTING HARDWARE',
    confidence: '42.0%',
    verdictClass: 'INSUFFICIENT EVIDENCE',
    subtitle: 'Engine abstains: Zero credible tier-1 news or regulatory filings detected within the 48-72h window.',
    badgeColor: 'text-on-surface-variant',
    iconBg: 'bg-surface-container-high text-outline',
    icon: 'help_outline',
    vector: '0.00%',
    vectorColor: 'text-outline',
    vectorPeriod: 'Factor Void (No Action)',
    rationale: 'Strict compliance guardrails (FR5.3) require the deterministic engine to abstain from opinion formulation rather than hallucinate speculative conclusions. Within the bounded 48-72 hour lookback window, zero tier-1 publishers (Bloomberg, Reuters, WSJ) published qualifying financial artifacts, and zero SEC EDGAR entries were recorded.',
    eps: 'N/A',
    disp: 'N/A (Void)',
    dark: 'Neutral / Thin Book',
    hype: '0.08 (Dormant)',
    conflict: '<strong class="text-on-surface font-medium">Deterministic Abstention Notice:</strong> To adhere to SEC-IA non-hallucination mandates, the engine refuses to calculate trading strategies on unverified low-liquidity signals. Check back after market-moving corporate actions or official filings occur.',
    citationsCount: '0 Corroborated Citations',
    citations: []
  }
};

export const AUDIT_RECORDS: AuditLedgerRecord[] = [
  {
    traceId: 'TRC-2025-0518-NVDA-89204',
    event: 'STOCK-300: Strategy Studio',
    symbol: 'NVDA',
    pipeline: 'AlphaAgent v5.1 + Native Math',
    merkleHash: '0x7f9a882bc194d3e8a4901fec4908129d3810fec184910401bcae8841c42109aa',
    status: 'SEC-17a-4 Verified',
    timestamp: '2025-05-18 14:32:09 UTC',
    initiatingEntity: 'Auto-Trace Desk',
    latencyMs: 18.4
  },
  {
    traceId: 'TRC-2025-0518-IONQ-89203',
    event: 'STOCK-100: News Verdict',
    symbol: 'IONQ',
    pipeline: 'NewsAnalysisAgent v2.2',
    merkleHash: '0x34ac119a009bf21a78330198cd401882ea44109990bfaee4910029',
    status: 'SEC-17a-4 Verified',
    timestamp: '2025-05-18 14:28:11 UTC',
    initiatingEntity: 'Event Scanner',
    latencyMs: 14.1
  },
  {
    traceId: 'TRC-2025-0518-PLTR-89202',
    event: 'STOCK-200: Factor Scanner',
    symbol: 'PLTR',
    pipeline: 'Deterministic Engine C++',
    merkleHash: '0x8900acfe1190bc1230984da091cbeee810993019280148f9801827',
    status: 'SEC-17a-4 Verified',
    timestamp: '2025-05-18 14:22:45 UTC',
    initiatingEntity: 'Quantitative Batch Run',
    latencyMs: 19.8
  },
  {
    traceId: 'TRC-2025-0518-MSFT-89201',
    event: 'STOCK-400: Historical Precedents',
    symbol: 'MSFT',
    pipeline: 'PrecedentAnalogEngine v4',
    merkleHash: '0x11029baec498012984ef901928aeecc81928001848f90218730912',
    status: 'SEC-17a-4 Verified',
    timestamp: '2025-05-18 14:15:30 UTC',
    initiatingEntity: 'Pattern Match Task',
    latencyMs: 22.3
  },
  {
    traceId: 'TRC-2025-0518-AAPL-89200',
    event: 'STOCK-300: Strategy Studio',
    symbol: 'AAPL',
    pipeline: 'AlphaAgent v5.1 + Native Math',
    merkleHash: '0xaa891001ff9821800becc190284451992019485729103982740192',
    status: 'SEC-17a-4 Verified',
    timestamp: '2025-05-18 14:02:18 UTC',
    initiatingEntity: 'Auto-Trace Desk',
    latencyMs: 17.9
  }
];

export const CANONICAL_BUNDLE_JSON = `{
  "trace_id": "TRC-2025-0518-NVDA-89204",
  "correlation_uuid": "c08e4f1a-7b92-4f21-a39c-1982bde94a02",
  "schema_version": "SEC_17a4_v4.2",
  "timestamp": "2025-05-18T14:32:09.102Z",
  "symbol": "NVDA",
  "provenance_merkle_root": "0x7f9a882bc194d3e8a4901fec4908129d3810fec184910401bcae8841c42109aa",
  "engine_telemetry": {
    "agent": "AlphaAgent v5.1",
    "math_engine": "Deterministic-Cpp-Core",
    "llm_math_tokens": 0,
    "temperature": 0.0,
    "prompt_hash": "sha256:a721b01c..."
  },
  "claims_verified": [
    {
      "cid": "CLM-01",
      "source_doc": "SEC-EDGAR-8K-20250518",
      "match_confidence": 1.000
    },
    {
      "cid": "CLM-02",
      "source_doc": "DETERMINISTIC_FACTOR_PIPE",
      "match_confidence": 1.000
    }
  ],
  "finra_rule_2210": {
    "balanced_risk_profile": true,
    "promissory_language_detected": false,
    "substantiated_claims_ratio": 1.00
  },
  "digital_signature": "SIG_0x4c2199bfae8301ec97441bb4901f4220"
}`;
