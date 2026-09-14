-- =====================================================================
-- File: S001__ticker_universe.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: Reference seed — the fixed universe of liquid U.S. equity
--              symbols the FR2 scanner ranks. Inserts master ticker rows
--              then marks them active in ticker_universe version 1.
-- Source: specs/requirements/FR2_Stock_Scanner.md (STOCK-201), HLD §1
-- Notes: Universe size is bounds-checked (75-100) by the scanner loader.
--        This seed provides 80 symbols. Idempotent via ON CONFLICT.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Master symbols. company_name/exchange are reference-only metadata.
-- ---------------------------------------------------------------------
INSERT INTO ticker (symbol, exchange, company_name) VALUES
    ('AAPL','NASDAQ','Apple Inc.'),
    ('MSFT','NASDAQ','Microsoft Corporation'),
    ('NVDA','NASDAQ','NVIDIA Corporation'),
    ('AMZN','NASDAQ','Amazon.com Inc.'),
    ('GOOGL','NASDAQ','Alphabet Inc. Class A'),
    ('META','NASDAQ','Meta Platforms Inc.'),
    ('TSLA','NASDAQ','Tesla Inc.'),
    ('AVGO','NASDAQ','Broadcom Inc.'),
    ('AMD','NASDAQ','Advanced Micro Devices Inc.'),
    ('NFLX','NASDAQ','Netflix Inc.'),
    ('ADBE','NASDAQ','Adobe Inc.'),
    ('CRM','NYSE','Salesforce Inc.'),
    ('ORCL','NYSE','Oracle Corporation'),
    ('CSCO','NASDAQ','Cisco Systems Inc.'),
    ('INTC','NASDAQ','Intel Corporation'),
    ('QCOM','NASDAQ','Qualcomm Inc.'),
    ('TXN','NASDAQ','Texas Instruments Inc.'),
    ('MU','NASDAQ','Micron Technology Inc.'),
    ('AMAT','NASDAQ','Applied Materials Inc.'),
    ('NOW','NYSE','ServiceNow Inc.'),
    ('JPM','NYSE','JPMorgan Chase & Co.'),
    ('BAC','NYSE','Bank of America Corporation'),
    ('WFC','NYSE','Wells Fargo & Company'),
    ('GS','NYSE','Goldman Sachs Group Inc.'),
    ('MS','NYSE','Morgan Stanley'),
    ('C','NYSE','Citigroup Inc.'),
    ('AXP','NYSE','American Express Company'),
    ('V','NYSE','Visa Inc.'),
    ('MA','NYSE','Mastercard Inc.'),
    ('BLK','NYSE','BlackRock Inc.'),
    ('JNJ','NYSE','Johnson & Johnson'),
    ('UNH','NYSE','UnitedHealth Group Inc.'),
    ('LLY','NYSE','Eli Lilly and Company'),
    ('PFE','NYSE','Pfizer Inc.'),
    ('MRK','NYSE','Merck & Co. Inc.'),
    ('ABBV','NYSE','AbbVie Inc.'),
    ('TMO','NYSE','Thermo Fisher Scientific Inc.'),
    ('ABT','NYSE','Abbott Laboratories'),
    ('DHR','NYSE','Danaher Corporation'),
    ('BMY','NYSE','Bristol-Myers Squibb Company'),
    ('XOM','NYSE','Exxon Mobil Corporation'),
    ('CVX','NYSE','Chevron Corporation'),
    ('COP','NYSE','ConocoPhillips'),
    ('SLB','NYSE','Schlumberger Limited'),
    ('EOG','NYSE','EOG Resources Inc.'),
    ('WMT','NYSE','Walmart Inc.'),
    ('COST','NASDAQ','Costco Wholesale Corporation'),
    ('PG','NYSE','Procter & Gamble Company'),
    ('KO','NYSE','Coca-Cola Company'),
    ('PEP','NASDAQ','PepsiCo Inc.'),
    ('MCD','NYSE','McDonald''s Corporation'),
    ('NKE','NYSE','NIKE Inc.'),
    ('SBUX','NASDAQ','Starbucks Corporation'),
    ('HD','NYSE','Home Depot Inc.'),
    ('LOW','NYSE','Lowe''s Companies Inc.'),
    ('TGT','NYSE','Target Corporation'),
    ('DIS','NYSE','Walt Disney Company'),
    ('CMCSA','NASDAQ','Comcast Corporation'),
    ('T','NYSE','AT&T Inc.'),
    ('VZ','NYSE','Verizon Communications Inc.'),
    ('BA','NYSE','Boeing Company'),
    ('CAT','NYSE','Caterpillar Inc.'),
    ('DE','NYSE','Deere & Company'),
    ('GE','NYSE','General Electric Company'),
    ('HON','NASDAQ','Honeywell International Inc.'),
    ('LMT','NYSE','Lockheed Martin Corporation'),
    ('RTX','NYSE','RTX Corporation'),
    ('UPS','NYSE','United Parcel Service Inc.'),
    ('UNP','NYSE','Union Pacific Corporation'),
    ('MMM','NYSE','3M Company'),
    ('IBM','NYSE','International Business Machines Corporation'),
    ('PYPL','NASDAQ','PayPal Holdings Inc.'),
    ('UBER','NYSE','Uber Technologies Inc.'),
    ('SHOP','NYSE','Shopify Inc.'),
    ('SNOW','NYSE','Snowflake Inc.'),
    ('PLTR','NASDAQ','Palantir Technologies Inc.'),
    ('COIN','NASDAQ','Coinbase Global Inc.'),
    ('SQ','NYSE','Block Inc.'),
    ('F','NYSE','Ford Motor Company'),
    ('GM','NYSE','General Motors Company')
ON CONFLICT (symbol) DO NOTHING;

-- ---------------------------------------------------------------------
-- Universe membership — version 1, all active. updated_by is the seed
-- process identity (never a real person).
-- ---------------------------------------------------------------------
INSERT INTO ticker_universe (ticker_id, version, active, updated_by)
SELECT t.ticker_id, 1, true, 'seed:S001'
FROM ticker t
ON CONFLICT (ticker_id, version) DO NOTHING;

COMMIT;
