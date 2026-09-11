-- =====================================================================
-- File: S002__historical_analog_cases.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: Curated FR4 dataset — 24 hand-picked historical catalyst
--              cases with a deliberate favorable/unfavorable OUTCOME
--              BALANCE (curation-bias guard, FINRA-2210). Each case
--              carries setup tags, a factor snapshot, and a real outcome.
-- Source: specs/requirements/FR4_Historical_Analog_Validation.md (STOCK-401)
-- Notes: Illustrative educational precedents, NOT investment advice and
--        NOT a backtest. Factor snapshots use the same keys the scanner
--        emits (rsi14, mom3m, mom6m, valuation_z, vol_ratio).
--        Balance: 12 favorable, 12 unfavorable/mixed outcomes.
-- =====================================================================

BEGIN;

INSERT INTO historical_analog_case
    (ticker, case_date, catalyst_type, setup_tags, key_factors_at_time,
     real_outcome, outcome_window, source_reference)
VALUES
-- ---- Favorable outcomes (12) ----------------------------------------
('NVDA','2023-05-25','GUIDANCE_RAISE','["ai_demand","oversold_bounce","sector_leader"]',
 '{"rsi14":41.2,"mom3m":0.12,"mom6m":0.34,"valuation_z":1.8,"vol_ratio":1.9}',
 'Stock rose ~24% within two sessions after a large data-center guidance raise; trend continued.',
 '3_months','Public earnings release, 2023-05-24'),
('AAPL','2019-01-03','GUIDANCE_CUT','["demand_warning","mega_cap","valuation_support"]',
 '{"rsi14":28.5,"mom3m":-0.18,"mom6m":-0.22,"valuation_z":-0.9,"vol_ratio":2.4}',
 'Sold off ~10% on the warning but recovered fully within ~5 months as services growth offset hardware.',
 '6_months','Company guidance letter, 2019-01-02'),
('MSFT','2020-04-29','EARNINGS_BEAT','["cloud_growth","defensive","momentum"]',
 '{"rsi14":58.0,"mom3m":0.06,"mom6m":0.11,"valuation_z":0.7,"vol_ratio":1.3}',
 'Beat on Azure growth; steady appreciation over the following quarter.',
 '3_months','Public earnings release, 2020-04-29'),
('AMD','2018-07-25','EARNINGS_BEAT','["turnaround","share_gains","high_beta"]',
 '{"rsi14":62.4,"mom3m":0.28,"mom6m":0.35,"valuation_z":2.1,"vol_ratio":1.7}',
 'Rallied strongly on datacenter share-gain narrative confirmed by results.',
 '3_months','Public earnings release, 2018-07-25'),
('LLY','2023-08-08','PRODUCT_LAUNCH','["obesity_drug","catalyst","secular_growth"]',
 '{"rsi14":66.0,"mom3m":0.19,"mom6m":0.41,"valuation_z":2.6,"vol_ratio":1.5}',
 'Advanced materially on incretin-class demand data over the subsequent months.',
 '6_months','Trial/commercial update, 2023-08-08'),
('META','2023-02-01','GUIDANCE_RAISE','["cost_discipline","efficiency","rebound"]',
 '{"rsi14":55.5,"mom3m":0.31,"mom6m":0.10,"valuation_z":-0.4,"vol_ratio":2.0}',
 'Jumped ~20% on "year of efficiency" framing and buyback; multi-month uptrend followed.',
 '6_months','Public earnings release, 2023-02-01'),
('COST','2021-09-23','EARNINGS_BEAT','["consumer_staple","membership_growth","defensive"]',
 '{"rsi14":60.1,"mom3m":0.08,"mom6m":0.15,"valuation_z":1.2,"vol_ratio":1.1}',
 'Steady grind higher on membership renewal strength.',
 '3_months','Public earnings release, 2021-09-23'),
('AVGO','2023-06-01','GUIDANCE_RAISE','["ai_demand","dividend_grower","sector_leader"]',
 '{"rsi14":63.0,"mom3m":0.22,"mom6m":0.28,"valuation_z":1.4,"vol_ratio":1.6}',
 'AI-related backlog guidance drove sustained appreciation.',
 '6_months','Public earnings release, 2023-06-01'),
('JPM','2020-10-13','EARNINGS_BEAT','["reserve_release","financials","reopening"]',
 '{"rsi14":52.0,"mom3m":0.05,"mom6m":-0.12,"valuation_z":-0.6,"vol_ratio":1.2}',
 'Recovered with financials as credit-reserve fears eased.',
 '6_months','Public earnings release, 2020-10-13'),
('CRM','2023-03-01','GUIDANCE_RAISE','["margin_expansion","activist","software"]',
 '{"rsi14":57.3,"mom3m":0.18,"mom6m":0.09,"valuation_z":0.3,"vol_ratio":1.8}',
 'Margin-focus guidance re-rated the stock higher over the quarter.',
 '3_months','Public earnings release, 2023-03-01'),
('UNH','2022-04-14','EARNINGS_BEAT','["managed_care","defensive","raise"]',
 '{"rsi14":59.0,"mom3m":0.07,"mom6m":0.13,"valuation_z":1.0,"vol_ratio":1.0}',
 'Guidance raise supported a defensive uptrend into a weak market.',
 '3_months','Public earnings release, 2022-04-14'),
('SHOP','2023-05-04','GUIDANCE_RAISE','["cost_cuts","ecommerce","turnaround"]',
 '{"rsi14":54.0,"mom3m":0.20,"mom6m":0.05,"valuation_z":-0.2,"vol_ratio":2.2}',
 'Logistics divestiture plus cost cuts drove a multi-month rally.',
 '6_months','Public earnings release, 2023-05-04'),
-- ---- Unfavorable / mixed outcomes (12) ------------------------------
('NFLX','2022-04-19','EARNINGS_MISS','["subscriber_loss","high_valuation","crowded"]',
 '{"rsi14":38.0,"mom3m":-0.25,"mom6m":-0.35,"valuation_z":1.9,"vol_ratio":3.1}',
 'Fell ~35% on first subscriber decline; remained depressed for months.',
 '3_months','Public earnings release, 2022-04-19'),
('META','2022-02-02','GUIDANCE_CUT','["ad_weakness","apple_atts","spend_fears"]',
 '{"rsi14":33.0,"mom3m":-0.20,"mom6m":-0.28,"valuation_z":0.4,"vol_ratio":3.4}',
 'Dropped ~26% in a day on ad-headwind guidance; extended decline into fall.',
 '6_months','Public earnings release, 2022-02-02'),
('INTC','2022-07-28','EARNINGS_MISS','["execution_miss","share_loss","legacy"]',
 '{"rsi14":36.5,"mom3m":-0.15,"mom6m":-0.30,"valuation_z":-1.2,"vol_ratio":2.0}',
 'Big miss on datacenter share loss; underperformed for the following year.',
 '6_months','Public earnings release, 2022-07-28'),
('PYPL','2022-02-01','GUIDANCE_CUT','["user_growth_cut","margin_pressure","derating"]',
 '{"rsi14":30.0,"mom3m":-0.30,"mom6m":-0.42,"valuation_z":0.9,"vol_ratio":2.9}',
 'Cut user-growth targets; shares fell ~24% and kept sliding.',
 '6_months','Public earnings release, 2022-02-01'),
('BA','2019-03-11','REGULATORY_ACTION','["safety_grounding","regulatory","overhang"]',
 '{"rsi14":42.0,"mom3m":0.02,"mom6m":0.18,"valuation_z":0.6,"vol_ratio":2.7}',
 '737 MAX grounding created a multi-year overhang; no quick recovery.',
 '6_months','Regulatory order, 2019-03-13'),
('DIS','2022-08-10','EARNINGS_BEAT','["streaming_losses","mixed","spend"]',
 '{"rsi14":49.0,"mom3m":-0.05,"mom6m":-0.20,"valuation_z":0.1,"vol_ratio":1.4}',
 'Beat on subs but streaming losses widened; stock chopped sideways-to-down.',
 '6_months','Public earnings release, 2022-08-10'),
('TSLA','2022-10-19','EARNINGS_MISS','["delivery_miss","demand_fears","high_beta"]',
 '{"rsi14":40.0,"mom3m":-0.22,"mom6m":-0.30,"valuation_z":2.3,"vol_ratio":2.5}',
 'Revenue miss and demand worry led to a sharp Q4 drawdown.',
 '3_months','Public earnings release, 2022-10-19'),
('SNAP','2022-05-23','GUIDANCE_CUT','["ad_slowdown","macro","small_cap_tech"]',
 '{"rsi14":27.0,"mom3m":-0.35,"mom6m":-0.55,"valuation_z":0.2,"vol_ratio":3.8}',
 'Mid-quarter warning cut shares ~40% in a day; no near-term recovery.',
 '3_months','Company mid-quarter update, 2022-05-23'),
('PFE','2023-08-01','GUIDANCE_CUT','["covid_rolloff","revenue_cliff","pharma"]',
 '{"rsi14":35.0,"mom3m":-0.12,"mom6m":-0.24,"valuation_z":-1.5,"vol_ratio":1.3}',
 'Post-COVID revenue cliff pressured shares lower through the year.',
 '6_months','Public earnings release, 2023-08-01'),
('COIN','2022-05-10','EARNINGS_MISS','["crypto_winter","volume_collapse","high_beta"]',
 '{"rsi14":24.0,"mom3m":-0.45,"mom6m":-0.62,"valuation_z":1.1,"vol_ratio":4.0}',
 'Trading-volume collapse and crypto drawdown drove a severe decline.',
 '3_months','Public earnings release, 2022-05-10'),
('GE','2017-11-13','GUIDANCE_CUT','["dividend_cut","conglomerate","restructuring"]',
 '{"rsi14":31.0,"mom3m":-0.28,"mom6m":-0.40,"valuation_z":-0.3,"vol_ratio":2.1}',
 'Dividend halved amid restructuring; extended multi-quarter decline.',
 '6_months','Investor update, 2017-11-13'),
('T','2021-05-17','MA_ANNOUNCEMENT','["spinoff","dividend_reset","telecom"]',
 '{"rsi14":47.0,"mom3m":0.04,"mom6m":0.09,"valuation_z":-1.1,"vol_ratio":1.9}',
 'WarnerMedia spin and dividend reset created uncertainty; underperformed.',
 '6_months','Deal announcement, 2021-05-17')
ON CONFLICT DO NOTHING;

COMMIT;
