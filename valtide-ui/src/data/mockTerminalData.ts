import { SectorAsset, CatalystVerdict, NewsHeadline, StrategyData, AuditRecord } from '../types/terminal';

export const TECH_SECTOR_ASSETS: SectorAsset[] = [
  {
    rank: '01',
    ticker: 'NVDA',
    name: 'NVIDIA Corp',
    price: '$128.40',
    priceNum: 128.40,
    change: '+3.20%',
    isPositive: true,
    peZ: '-0.42',
    peZPositive: false,
    mom: '+38.4%',
    momPositive: true,
    rsi: 58.2,
    score: 94.8,
    volumeTrend: '1.42x ACCUM',
    normPe: '46.2',
    mom6M: '+64.2%',
    cluster: 'Accelerated Compute & AI Silicon',
    clusterConf: '88%',
    clusterDesc: 'CoWoS packaging supply constraints easing; 3M institutional accumulation ratios affirm hardware capex continuity through Q4 2026.'
  },
  {
    rank: '02',
    ticker: 'AAPL',
    name: 'Apple Inc',
    price: '$224.50',
    priceNum: 224.50,
    change: '+0.80%',
    isPositive: true,
    peZ: '+0.15',
    peZPositive: true,
    mom: '+14.2%',
    momPositive: true,
    rsi: 51.0,
    score: 89.2,
    volumeTrend: '1.15x STEADY',
    normPe: '31.4',
    mom6M: '+22.8%',
    cluster: 'Consumer Edge Ecosystem & Services',
    clusterConf: '74%',
    clusterDesc: 'Annual contract values show high resilience; monetization multiples stabilized despite elevated discount rate environments.'
  },
  {
    rank: '03',
    ticker: 'AVGO',
    name: 'Broadcom Inc',
    price: '$168.20',
    priceNum: 168.20,
    change: '+2.10%',
    isPositive: true,
    peZ: '-0.85',
    peZPositive: false,
    mom: '+26.1%',
    momPositive: true,
    rsi: 44.5,
    score: 87.6,
    volumeTrend: '1.38x ACCUM',
    normPe: '38.0',
    mom6M: '+49.1%',
    cluster: 'Custom Silicon & Interconnect Networks',
    clusterConf: '88%',
    clusterDesc: 'CoWoS packaging supply constraints easing; 3M institutional accumulation ratios affirm hardware capex continuity through Q4 2026.'
  },
  {
    rank: '04',
    ticker: 'AMD',
    name: 'Adv Micro Dev',
    price: '$154.90',
    priceNum: 154.90,
    change: '-1.20%',
    isPositive: false,
    peZ: '-1.12',
    peZPositive: false,
    mom: '+19.8%',
    momPositive: true,
    rsi: 42.1,
    score: 85.3,
    volumeTrend: '1.28x STEADY',
    normPe: '42.6',
    mom6M: '+33.4%',
    cluster: 'Accelerated Compute & AI Silicon',
    clusterConf: '88%',
    clusterDesc: 'CoWoS packaging supply constraints easing; 3M institutional accumulation ratios affirm hardware capex continuity through Q4 2026.'
  },
  {
    rank: '05',
    ticker: 'MSFT',
    name: 'Microsoft Corp',
    price: '$448.10',
    priceNum: 448.10,
    change: '+0.40%',
    isPositive: true,
    peZ: '+0.68',
    peZPositive: true,
    mom: '+9.4%',
    momPositive: true,
    rsi: 49.3,
    score: 82.1,
    volumeTrend: '0.98x NEUTRAL',
    normPe: '35.8',
    mom6M: '+16.5%',
    cluster: 'Enterprise Software & Hyperscale Cloud',
    clusterConf: '74%',
    clusterDesc: 'Annual contract values show high resilience; monetization multiples stabilized despite elevated discount rate environments.'
  },
  {
    rank: '06',
    ticker: 'QCOM',
    name: 'Qualcomm Inc',
    price: '$172.30',
    priceNum: 172.30,
    change: '+1.80%',
    isPositive: true,
    peZ: '-0.74',
    peZPositive: false,
    mom: '+16.7%',
    momPositive: true,
    rsi: 53.6,
    score: 81.4,
    volumeTrend: '1.22x STEADY',
    normPe: '22.4',
    mom6M: '+28.9%',
    cluster: 'Edge Intelligence & Mobile Compute',
    clusterConf: '88%',
    clusterDesc: 'CoWoS packaging supply constraints easing; 3M institutional accumulation ratios affirm hardware capex continuity through Q4 2026.'
  },
  {
    rank: '07',
    ticker: 'CRM',
    name: 'Salesforce Inc',
    price: '$284.10',
    priceNum: 284.10,
    change: '+2.50%',
    isPositive: true,
    peZ: '-0.32',
    peZPositive: false,
    mom: '+12.3%',
    momPositive: true,
    rsi: 56.4,
    score: 79.8,
    volumeTrend: '1.10x STEADY',
    normPe: '29.7',
    mom6M: '+18.2%',
    cluster: 'Enterprise Software & Cloud',
    clusterConf: '74%',
    clusterDesc: 'Annual contract values show high resilience; monetization multiples stabilized despite elevated discount rate environments.'
  },
  {
    rank: '08',
    ticker: 'AMAT',
    name: 'Applied Materials',
    price: '$208.50',
    priceNum: 208.50,
    change: '+4.10%',
    isPositive: true,
    peZ: '-0.91',
    peZPositive: false,
    mom: '+22.4%',
    momPositive: true,
    rsi: 61.2,
    score: 78.5,
    volumeTrend: '1.65x ACCUM HIGH',
    normPe: '24.1',
    mom6M: '+41.0%',
    cluster: 'Semiconductor Fab Capex & Tools',
    clusterConf: '84%',
    clusterDesc: 'Foundry tool orders indicate trailing-to-leading transition. Strongest 20-day volume inflection ratio (1.65x) in tech cohort.'
  },
  {
    rank: '09',
    ticker: 'NOW',
    name: 'ServiceNow Inc',
    price: '$842.00',
    priceNum: 842.00,
    change: '+1.10%',
    isPositive: true,
    peZ: '+0.45',
    peZPositive: true,
    mom: '+15.8%',
    momPositive: true,
    rsi: 52.8,
    score: 76.9,
    volumeTrend: '1.05x STEADY',
    normPe: '55.3',
    mom6M: '+24.6%',
    cluster: 'Enterprise Workflow Automation',
    clusterConf: '74%',
    clusterDesc: 'Annual contract values show high resilience; monetization multiples stabilized despite elevated discount rate environments.'
  },
  {
    rank: '10',
    ticker: 'INTC',
    name: 'Intel Corp',
    price: '$21.80',
    priceNum: 21.80,
    change: '-0.60%',
    isPositive: false,
    peZ: '-1.84',
    peZPositive: false,
    mom: '-14.2%',
    momPositive: false,
    rsi: 31.4,
    score: 74.2,
    volumeTrend: '1.82x TURNOVER',
    normPe: '26.8',
    mom6M: '-28.1%',
    cluster: 'Turnaround Legacy Compute',
    clusterConf: 'MACRO CAUTION',
    clusterDesc: 'Ranked via extreme valuation z-score (-1.84); momentum profile (-14.2%) highlights severe ongoing capital expenditure headwinds.'
  }
];

export const STRATEGY_DATA_MAP: Record<string, StrategyData> = {
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    price: '$128.40',
    priceNum: 128.40,
    change: '+3.42 (+2.73%)',
    volume: '64.2M',
    verdict: 'BUY_PULLBACK',
    auditStatus: 'Passed Independent Audit',
    confidence: 'HIGH - 84%',
    trendAlignment: {
      status: 'Bullish Aligned',
      daily: 'STRONG',
      weekly: 'BULLISH',
      monthly: 'ACCEL'
    },
    maSpread: '+4.82% (Expanded)',
    maSpreadPercent: 78,
    atrVolatility: '$3.84 (Normal)',
    anchoredVwap: '$118.20',
    confluenceZones: [
      { name: 'Zone A', range: '$124.00 - $125.50', tag: 'High Confluence', type: 'high' },
      { name: 'Zone B', range: '$118.50 - $120.00', tag: 'Major VWAP', type: 'major' }
    ],
    volumeProfilePoc: '$126.30',
    volumeProfileBars: [30, 45, 60, 40, 85, 100, 70, 90],
    tradeParams: {
      entryTarget: '$124.50',
      entryType: 'Limit Order',
      stopLoss: '$119.80',
      stopLossPercent: '-3.78% Risk',
      profitTarget: '$138.50',
      profitTargetPercent: '+11.24% Upside',
      riskReward: '1 : 2.98',
      ratioLabel: 'Optimized Ratio'
    },
    executionRules: {
      invalidation: 'Immediate exit if 4H candle closes below $119.50 on volume > 1.5x average.',
      upgrade: 'Trail stop to break-even ($124.50) once price reaches +5.0% unrealized gain.'
    },
    citations: [
      { id: 'CIT-901', name: 'SEC 10-Q Q2 Earnings Beat', status: 'Verified' },
      { id: 'CIT-904', name: 'Institutional Flow Delta', status: 'Verified' }
    ],
    historicalAnalogs: [
      {
        caseId: 'Case #482 (Nov 2023)',
        date: 'Nov 2023',
        returnText: '+18.40% / 22d',
        days: '22d',
        summary: 'Identical pre-earnings consolidation pattern with RSI reset to 48 and rising institutional block volume.',
        matchScore: '94.2%',
        status: 'Validated Outcome'
      },
      {
        caseId: 'Case #319 (Jul 2023)',
        date: 'Jul 2023',
        returnText: '+14.20% / 17d',
        days: '17d',
        summary: 'Post-breakout retest of 20-day MA during low volatility VIX regime with sector tailwinds.',
        matchScore: '91.8%',
        status: 'Validated Outcome'
      },
      {
        caseId: 'Case #112 (Jan 2023)',
        date: 'Jan 2023',
        returnText: '+22.10% / 31d',
        days: '31d',
        summary: 'Flag formation following aggressive supply chain expansion announcements.',
        matchScore: '89.5%',
        status: 'Validated Outcome'
      }
    ],
    secCorrelationId: 'VAL-2023-NVDA-8841',
    secHash: '8f92b4c10a3e91d84e591295b9c02871b6d081f92e94acb39a3f2184e9a14f9a',
    node: 'US-EAST-DMA-04'
  },
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc',
    exchange: 'NASDAQ',
    price: '$224.50',
    priceNum: 224.50,
    change: '+1.78 (+0.80%)',
    volume: '48.1M',
    verdict: 'BUY_PULLBACK',
    auditStatus: 'Passed Independent Audit',
    confidence: 'HIGH - 81%',
    trendAlignment: {
      status: 'Bullish Aligned',
      daily: 'STRONG',
      weekly: 'BULLISH',
      monthly: 'STABLE'
    },
    maSpread: '+3.15% (Consolidating)',
    maSpreadPercent: 62,
    atrVolatility: '$2.90 (Low)',
    anchoredVwap: '$218.40',
    confluenceZones: [
      { name: 'Zone A', range: '$221.00 - $222.50', tag: 'High Confluence', type: 'high' },
      { name: 'Zone B', range: '$216.80 - $218.00', tag: 'Major VWAP', type: 'major' }
    ],
    volumeProfilePoc: '$222.10',
    volumeProfileBars: [25, 50, 75, 90, 100, 80, 60, 45],
    tradeParams: {
      entryTarget: '$221.50',
      entryType: 'Limit Order',
      stopLoss: '$216.00',
      stopLossPercent: '-2.48% Risk',
      profitTarget: '$236.00',
      profitTargetPercent: '+6.54% Upside',
      riskReward: '1 : 2.64',
      ratioLabel: 'Optimized Ratio'
    },
    executionRules: {
      invalidation: 'Exit on daily close below $215.80 accompanied by sector outflow.',
      upgrade: 'Move protective stop to entry once $227.00 is established.'
    },
    citations: [
      { id: 'CIT-714', name: 'Services Gross Margin Expansion 10-Q', status: 'Verified' },
      { id: 'CIT-802', name: 'Options Gamma Pin Analysis', status: 'Verified' }
    ],
    historicalAnalogs: [
      {
        caseId: 'Case #214 (Oct 2023)',
        date: 'Oct 2023',
        returnText: '+9.40% / 19d',
        days: '19d',
        summary: 'Mean-reversion off 50-day EMA preceding flagship hardware release cycle.',
        matchScore: '92.1%',
        status: 'Validated Outcome'
      },
      {
        caseId: 'Case #188 (Apr 2023)',
        date: 'Apr 2023',
        returnText: '+11.80% / 24d',
        days: '24d',
        summary: 'Quarterly institutional replenishment following quiet period expiration.',
        matchScore: '88.7%',
        status: 'Validated Outcome'
      }
    ],
    secCorrelationId: 'VAL-2023-AAPL-3419',
    secHash: '3a42c1109a1bf04289ea67bc021873491ba6d8194e9f7830ac193bb44a19321f',
    node: 'US-EAST-DMA-02'
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    price: '$448.10',
    priceNum: 448.10,
    change: '+1.80 (+0.40%)',
    volume: '21.4M',
    verdict: 'ACCUMULATE_BREAKOUT',
    auditStatus: 'Passed Independent Audit',
    confidence: 'HIGH - 86%',
    trendAlignment: {
      status: 'Bullish Aligned',
      daily: 'STRONG',
      weekly: 'BULLISH',
      monthly: 'ACCEL'
    },
    maSpread: '+5.20% (Expanded)',
    maSpreadPercent: 82,
    atrVolatility: '$5.40 (Normal)',
    anchoredVwap: '$434.50',
    confluenceZones: [
      { name: 'Zone A', range: '$442.00 - $444.50', tag: 'High Confluence', type: 'high' },
      { name: 'Zone B', range: '$432.00 - $435.00', tag: 'Major VWAP', type: 'major' }
    ],
    volumeProfilePoc: '$443.20',
    volumeProfileBars: [40, 60, 55, 80, 95, 100, 75, 85],
    tradeParams: {
      entryTarget: '$443.00',
      entryType: 'Limit Order',
      stopLoss: '$431.50',
      stopLossPercent: '-2.60% Risk',
      profitTarget: '$475.00',
      profitTargetPercent: '+7.22% Upside',
      riskReward: '1 : 2.78',
      ratioLabel: 'Optimized Ratio'
    },
    executionRules: {
      invalidation: 'Immediate exit if 4H candle closes below $430.00 with elevated volume.',
      upgrade: 'Trail stop by 1.5x ATR once price exceeds previous 52W high.'
    },
    citations: [
      { id: 'CIT-988', name: 'Azure Commercial Cloud RPO Report', status: 'Verified' },
      { id: 'CIT-992', name: 'Enterprise Copilot Seat Penetration', status: 'Verified' }
    ],
    historicalAnalogs: [
      {
        caseId: 'Case #551 (Dec 2023)',
        date: 'Dec 2023',
        returnText: '+12.60% / 28d',
        days: '28d',
        summary: 'Cloud revenue acceleration confirmation following infrastructure ramp.',
        matchScore: '93.4%',
        status: 'Validated Outcome'
      }
    ],
    secCorrelationId: 'VAL-2023-MSFT-9182',
    secHash: '9e81f42289c0a1f7324891bca495123984e1b7a049182390abef918234ab8102',
    node: 'US-EAST-DMA-01'
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla Inc',
    exchange: 'NASDAQ',
    price: '$218.30',
    priceNum: 218.30,
    change: '-3.10 (-1.40%)',
    volume: '78.9M',
    verdict: 'HOLD_RANGE',
    auditStatus: 'Passed Independent Audit',
    confidence: 'MEDIUM - 68%',
    trendAlignment: {
      status: 'Neutral Rangebound',
      daily: 'WEAK',
      weekly: 'NEUTRAL',
      monthly: 'STABLE'
    },
    maSpread: '-1.40% (Contracting)',
    maSpreadPercent: 38,
    atrVolatility: '$9.20 (Elevated)',
    anchoredVwap: '$222.10',
    confluenceZones: [
      { name: 'Zone A', range: '$212.00 - $215.00', tag: 'Support Cluster', type: 'high' },
      { name: 'Zone B', range: '$202.00 - $205.00', tag: 'Macro Shelf', type: 'major' }
    ],
    volumeProfilePoc: '$219.80',
    volumeProfileBars: [90, 80, 100, 70, 60, 50, 40, 30],
    tradeParams: {
      entryTarget: '$213.50',
      entryType: 'Limit Order',
      stopLoss: '$204.00',
      stopLossPercent: '-4.45% Risk',
      profitTarget: '$238.00',
      profitTargetPercent: '+11.48% Upside',
      riskReward: '1 : 2.58',
      ratioLabel: 'Range Reversion'
    },
    executionRules: {
      invalidation: 'Stop out if delivery numbers miss consensus by > 5% on regulatory filing.',
      upgrade: 'Scale out 50% at 200-day simple moving average ($228.00).'
    },
    citations: [
      { id: 'CIT-603', name: 'Global Automotive Deliveries 8-K', status: 'Verified' },
      { id: 'CIT-619', name: 'Regulatory Credit Offset Recognition', status: 'Verified' }
    ],
    historicalAnalogs: [
      {
        caseId: 'Case #201 (Aug 2023)',
        date: 'Aug 2023',
        returnText: '+15.20% / 14d',
        days: '14d',
        summary: 'Oversold RSI rebound from lower Bollinger Band on macro liquidity injection.',
        matchScore: '89.1%',
        status: 'Validated Outcome'
      }
    ],
    secCorrelationId: 'VAL-2023-TSLA-5510',
    secHash: '55c29a834190ba823901baef48194301ba64810294371849102834bfae019284',
    node: 'US-EAST-DMA-03'
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com Inc',
    exchange: 'NASDAQ',
    price: '$186.40',
    priceNum: 186.40,
    change: '+2.75 (+1.50%)',
    volume: '39.8M',
    verdict: 'BUY_PULLBACK',
    auditStatus: 'Passed Independent Audit',
    confidence: 'HIGH - 83%',
    trendAlignment: {
      status: 'Bullish Aligned',
      daily: 'STRONG',
      weekly: 'BULLISH',
      monthly: 'ACCEL'
    },
    maSpread: '+3.90% (Expanded)',
    maSpreadPercent: 71,
    atrVolatility: '$3.10 (Normal)',
    anchoredVwap: '$179.60',
    confluenceZones: [
      { name: 'Zone A', range: '$182.50 - $184.00', tag: 'High Confluence', type: 'high' },
      { name: 'Zone B', range: '$176.00 - $178.50', tag: 'Major VWAP', type: 'major' }
    ],
    volumeProfilePoc: '$183.50',
    volumeProfileBars: [20, 35, 65, 85, 100, 70, 55, 40],
    tradeParams: {
      entryTarget: '$183.50',
      entryType: 'Limit Order',
      stopLoss: '$177.00',
      stopLossPercent: '-3.54% Risk',
      profitTarget: '$202.00',
      profitTargetPercent: '+10.08% Upside',
      riskReward: '1 : 2.85',
      ratioLabel: 'Optimized Ratio'
    },
    executionRules: {
      invalidation: 'Exit if AWS margins contract on subsequent quarterly update.',
      upgrade: 'Trail stop to break-even once price exceeds $191.00.'
    },
    citations: [
      { id: 'CIT-774', name: 'AWS Cloud Infrastructure Operating Margin 10-Q', status: 'Verified' },
      { id: 'CIT-780', name: 'Retail Fulfillment Unit Cost Reduction Report', status: 'Verified' }
    ],
    historicalAnalogs: [
      {
        caseId: 'Case #384 (Sep 2023)',
        date: 'Sep 2023',
        returnText: '+16.10% / 26d',
        days: '26d',
        summary: 'Operating leverage breakout following logistics network regionalization.',
        matchScore: '90.7%',
        status: 'Validated Outcome'
      }
    ],
    secCorrelationId: 'VAL-2023-AMZN-1188',
    secHash: '11b88e09f8190ba32901ba348102934810293840192834019283401928340192',
    node: 'US-EAST-DMA-04'
  }
};

export const NEWS_CATALYST_DATA: Record<string, { verdict: CatalystVerdict; headlines: NewsHeadline[] }> = {
  NVDA: {
    verdict: {
      ticker: 'NVDA',
      confidence: '94.2%',
      status: 'REAL_CATALYST',
      statusLabel: 'Fundamentally accretive EPS impact',
      rationale: 'Recent announcements regarding custom AI silicon architecture supply agreements indicate a projected 18-22% increase in enterprise segment recurring revenue for Q3. Unlike retail-driven hype cycles, this release is corroborated by verified SEC Form 8-K filings and tier-1 supplier confirmations.',
      citations: [
        {
          id: 1,
          title: 'SEC Form 8-K: Material Definitive Agreement Filing',
          source: 'EDGAR Direct',
          timeAgo: '3h ago',
          textExcerpt: 'Item 1.01 Entry into a Material Definitive Agreement. On September 28, 2026, NVIDIA entered into binding multi-year hardware infrastructure capacity contracts with leading hyperscale operators.'
        },
        {
          id: 2,
          title: 'Bloomberg Terminal: Exclusive Supply Chain Verification',
          source: 'Bloomberg Quint',
          timeAgo: '7h ago',
          textExcerpt: 'Checks across Taiwan semiconductor packaging facilities confirm 24% month-over-month increase in advanced sub-assembly throughput for Blackwell and Rubin successor dies.'
        }
      ],
      model: 'Valtide-LLM-v4-Alpha',
      latencyMs: 48
    },
    headlines: [
      {
        id: 'h-1',
        sourceType: 'SEC FILING',
        wireName: 'EDGAR Direct Wire',
        timestampUtc: 'UTC 14:15:20',
        title: 'NVIDIA CORP Files Form 8-K Disclosing Major Multi-Billion Infrastructure Expansion With Hyperscale Partners',
        impactScore: '9.4/10',
        sentiment: 'Bullish',
        sentimentType: 'positive',
        entityMatch: '100%'
      },
      {
        id: 'h-2',
        sourceType: 'BLOOMBERG',
        wireName: 'Verified Terminal Feed',
        timestampUtc: 'UTC 11:42:00',
        title: 'Advanced Chip Architecture Rollout Accelerates by One Quarter Amid Unprecedented Enterprise AI Demand',
        impactScore: '8.7/10',
        sentiment: 'Bullish',
        sentimentType: 'positive',
        entityMatch: '98%'
      },
      {
        id: 'h-3',
        sourceType: 'REUTERS',
        wireName: 'Global Markets Wire',
        timestampUtc: 'UTC 08:20:15',
        title: 'Wall Street Analysts Revise Price Targets Upward Following Semiconductor Supply Chain Audit',
        impactScore: '7.2/10',
        sentiment: 'Neutral-Positive',
        sentimentType: 'neutral',
        entityMatch: '95%'
      },
      {
        id: 'h-4',
        sourceType: 'SOCIAL / HYPE',
        wireName: 'Unverified Aggregator',
        timestampUtc: 'UTC 02:10:00',
        title: 'Rumors Surface Regarding Potential Proprietary Quantum Integration Partnership (Unsubstantiated)',
        impactScore: '3.1/10 (Hype Filtered)',
        sentiment: 'Speculative',
        sentimentType: 'speculative',
        entityMatch: '64%'
      }
    ]
  },
  AAPL: {
    verdict: {
      ticker: 'AAPL',
      confidence: '91.8%',
      status: 'REAL_CATALYST',
      statusLabel: 'Operating Margin Accretion',
      rationale: 'Supply chain audit affirms 14% increase in high-margin services attach rates and on-device neural processing engine adoption across enterprise enterprise contracts.',
      citations: [
        {
          id: 1,
          title: 'SEC Form 10-Q Services Segment Audit',
          source: 'EDGAR Direct',
          timeAgo: '5h ago',
          textExcerpt: 'Quarterly gross margin expanded 80 bps driven by ecosystem monetization and recurring enterprise subscriptions.'
        },
        {
          id: 2,
          title: 'Reuters Tech Wire: Enterprise Procurement Surge',
          source: 'Reuters Desk',
          timeAgo: '9h ago',
          textExcerpt: 'Fortune 500 institutional refresh cycle indicates 18% accelerated replacement timeline for unified architecture silicon.'
        }
      ],
      model: 'Valtide-LLM-v4-Alpha',
      latencyMs: 44
    },
    headlines: [
      {
        id: 'h-aapl-1',
        sourceType: 'SEC FILING',
        wireName: 'EDGAR Direct Wire',
        timestampUtc: 'UTC 13:04:12',
        title: 'Apple Inc Form 10-Q Notes Record High Enterprise Services Subscriptions and Stable Component Yields',
        impactScore: '8.9/10',
        sentiment: 'Bullish',
        sentimentType: 'positive',
        entityMatch: '100%'
      },
      {
        id: 'h-aapl-2',
        sourceType: 'BLOOMBERG',
        wireName: 'Verified Terminal Feed',
        timestampUtc: 'UTC 10:15:00',
        title: 'Institutional Survey Shows 72% Intent to Upgrade Enterprise Workstations Within 6 Months',
        impactScore: '8.1/10',
        sentiment: 'Bullish',
        sentimentType: 'positive',
        entityMatch: '97%'
      },
      {
        id: 'h-aapl-3',
        sourceType: 'REUTERS',
        wireName: 'Global Markets Wire',
        timestampUtc: 'UTC 06:40:22',
        title: 'European Union Regulatory Compliance Architecture Approved Without Material Fine Overhang',
        impactScore: '7.5/10',
        sentiment: 'Neutral-Positive',
        sentimentType: 'neutral',
        entityMatch: '96%'
      }
    ]
  },
  TSLA: {
    verdict: {
      ticker: 'TSLA',
      confidence: '82.4%',
      status: 'SPECULATIVE_HYPE',
      statusLabel: 'Volatile Narrative Filtered',
      rationale: 'While retail social sentiment exhibits elevated spikes regarding autonomous taxi fleet deployment, regulatory filings demonstrate pending local jurisdictional approvals and zero formal revenue guidance adjustments.',
      citations: [
        {
          id: 1,
          title: 'NHTSA Regulatory Review Docket No. 2026-891',
          source: 'Federal Register',
          timeAgo: '12h ago',
          textExcerpt: 'Preliminary inquiries regarding autonomous testing parameters ongoing; formal commercial waiver pending supplemental validation data.'
        },
        {
          id: 2,
          title: 'Bloomberg Markets: Delivery Variance Verification',
          source: 'Bloomberg Terminal',
          timeAgo: '14h ago',
          textExcerpt: 'Regional registry tallies in key European and Asian markets show volume tracking in line with baseline consensus estimates.'
        }
      ],
      model: 'Valtide-LLM-v4-Alpha',
      latencyMs: 52
    },
    headlines: [
      {
        id: 'h-tsla-1',
        sourceType: 'BLOOMBERG',
        wireName: 'Verified Terminal Feed',
        timestampUtc: 'UTC 12:10:45',
        title: 'State Transportation Department Requests Extended Public Hearing Schedule for Autonomous Permitting',
        impactScore: '6.4/10',
        sentiment: 'Neutral-Positive',
        sentimentType: 'neutral',
        entityMatch: '99%'
      },
      {
        id: 'h-tsla-2',
        sourceType: 'SOCIAL / HYPE',
        wireName: 'Unverified Aggregator',
        timestampUtc: 'UTC 09:30:00',
        title: 'Social Forums Claim Imminent Nationwide Autonomous Commercial Launch Without Safety Drivers',
        impactScore: '2.8/10 (Hype Filtered)',
        sentiment: 'Speculative',
        sentimentType: 'speculative',
        entityMatch: '71%'
      },
      {
        id: 'h-tsla-3',
        sourceType: 'SEC FILING',
        wireName: 'EDGAR Direct Wire',
        timestampUtc: 'UTC 04:12:18',
        title: 'Tesla Files Periodic Director Compensation and Insider Trading Plan Schedule 14A',
        impactScore: '5.0/10',
        sentiment: 'Neutral-Positive',
        sentimentType: 'neutral',
        entityMatch: '100%'
      }
    ]
  },
  MSFT: {
    verdict: {
      ticker: 'MSFT',
      confidence: '95.1%',
      status: 'REAL_CATALYST',
      statusLabel: 'Accretive Cloud Backlog Expansion',
      rationale: 'Commercial remaining performance obligations (cRPO) confirmed up 24% year-over-year in multi-tenant cloud operations, with average contract length expanding to 3.8 years across public sector agencies.',
      citations: [
        {
          id: 1,
          title: 'SEC Form 8-K Cloud Procurement Award',
          source: 'EDGAR Direct',
          timeAgo: '4h ago',
          textExcerpt: 'Award of multi-agency cloud computational modernization contract spanning 48 calendar months.'
        }
      ],
      model: 'Valtide-LLM-v4-Alpha',
      latencyMs: 41
    },
    headlines: [
      {
        id: 'h-msft-1',
        sourceType: 'SEC FILING',
        wireName: 'EDGAR Direct Wire',
        timestampUtc: 'UTC 14:02:11',
        title: 'Microsoft Files Form 8-K Disclosing $14B Federal Sovereign Cloud Modernization Architecture',
        impactScore: '9.2/10',
        sentiment: 'Bullish',
        sentimentType: 'positive',
        entityMatch: '100%'
      },
      {
        id: 'h-msft-2',
        sourceType: 'BLOOMBERG',
        wireName: 'Verified Terminal Feed',
        timestampUtc: 'UTC 11:15:30',
        title: 'Enterprise Software Spending Intentions Point to Expanded Azure Consumption Commitments',
        impactScore: '8.4/10',
        sentiment: 'Bullish',
        sentimentType: 'positive',
        entityMatch: '98%'
      }
    ]
  }
};

export const INITIAL_AUDIT_RECORDS: AuditRecord[] = [
  {
    id: 'rec-1',
    timestamp: '14:32:04.102',
    correlationId: 'req-7f89b21a-val',
    ticker: 'NVDA',
    featureTriggered: 'News Catalyst Check',
    citations: 14,
    status: 'PASSED',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    wormState: 'LOCKED',
    logs: [
      '[14:32:04] Prompt received & tokenized.',
      '[14:32:04] Multi-factor weights applied.',
      '[14:32:04] 14 SEC EDGAR filings cited.',
      '[14:32:04] Output linter verified 0 infractions.',
      '[14:32:04] Immutable record written to WORM storage.'
    ]
  },
  {
    id: 'rec-2',
    timestamp: '14:31:58.890',
    correlationId: 'req-3a42c110-val',
    ticker: 'AAPL',
    featureTriggered: 'Scanner & Multi-Factor',
    citations: 8,
    status: 'PASSED',
    hash: '8f92b4c10a3e91d84e591295b9c02871b6d081f92e94acb39a3f2184e9a14f9a',
    wormState: 'LOCKED',
    logs: [
      '[14:31:58] Canonical factor weights initialized (PE 25%, Mom 35%, RSI 20%, Vol 20%).',
      '[14:31:58] Z-scores normalized across 74 tech sector peers.',
      '[14:31:58] 8 historical SEC 10-Q filings verified.',
      '[14:31:58] Zero look-ahead bias confirmed by deterministic validator.',
      '[14:31:58] Record sealed under SEC Rule 17a-4.'
    ]
  },
  {
    id: 'rec-3',
    timestamp: '14:30:12.441',
    correlationId: 'req-9e81f422-val',
    ticker: 'MSFT',
    featureTriggered: 'Strategy Engine',
    citations: 22,
    status: 'PASSED',
    hash: '9e81f42289c0a1f7324891bca495123984e1b7a049182390abef918234ab8102',
    wormState: 'LOCKED',
    logs: [
      '[14:30:12] Entry limit ($443.00) & stop loss ($431.50) calibrated.',
      '[14:30:12] Risk/Reward verified at 1:2.78.',
      '[14:30:12] 22 regulatory filings & institutional flows verified.',
      '[14:30:12] Invalidation rule registered with DMA execution route.',
      '[14:30:12] Cryptographic WORM stamp generated.'
    ]
  },
  {
    id: 'rec-4',
    timestamp: '14:28:45.012',
    correlationId: 'req-11b88e09-val',
    ticker: 'AMZN',
    featureTriggered: 'Analog Matching',
    citations: 19,
    status: 'PASSED',
    hash: '11b88e09f8190ba32901ba348102934810293840192834019283401928340192',
    wormState: 'LOCKED',
    logs: [
      '[14:28:45] Historical pattern matching query executed.',
      '[14:28:45] 19 precedent market regimes evaluated.',
      '[14:28:45] Analog match score calculated at 90.7%.',
      '[14:28:45] FINRA Rule 2214 notice appended.',
      '[14:28:45] Audit record committed to distributed ledger.'
    ]
  },
  {
    id: 'rec-5',
    timestamp: '14:25:11.993',
    correlationId: 'req-55c29a83-val',
    ticker: 'TSLA',
    featureTriggered: 'News Catalyst Check',
    citations: 5,
    status: 'PASSED',
    hash: '55c29a834190ba823901baef48194301ba64810294371849102834bfae019284',
    wormState: 'LOCKED',
    logs: [
      '[14:25:11] Newswire ingest: 3 unverified social posts flagged.',
      '[14:25:11] Hype linter deducted 6.2 impact points.',
      '[14:25:11] 5 SEC filings and regulatory dockets cited.',
      '[14:25:11] Verdict classified as SPECULATIVE_HYPE.',
      '[14:25:11] Audit payload verified and secured.'
    ]
  }
];
