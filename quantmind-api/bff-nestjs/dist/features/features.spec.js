"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const agent_client_1 = require("../agent/agent.client");
const news_controller_1 = require("./news.controller");
const scanner_controller_1 = require("./scanner.controller");
const strategy_controller_1 = require("./strategy.controller");
const req = { correlationId: 'cid-123' };
describe('BFF feature controllers', () => {
    let news;
    let scanner;
    let strategy;
    const post = jest.fn().mockResolvedValue({ ok: true });
    beforeEach(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            controllers: [news_controller_1.NewsController, scanner_controller_1.ScannerController, strategy_controller_1.StrategyController],
            providers: [{ provide: agent_client_1.AgentClient, useValue: { post } }],
        }).compile();
        news = moduleRef.get(news_controller_1.NewsController);
        scanner = moduleRef.get(scanner_controller_1.ScannerController);
        strategy = moduleRef.get(strategy_controller_1.StrategyController);
        post.mockClear();
    });
    it('news controller forwards symbol + simulate_empty and cid', async () => {
        await news.check({ symbol: 'NVDA', simulateEmpty: true }, req);
        expect(post).toHaveBeenCalledWith('/internal/v1/news-check', { symbol: 'NVDA', simulate_empty: true }, 'cid-123');
    });
    it('scanner controller forwards universe (null default) and cid', async () => {
        await scanner.scan({}, req);
        expect(post).toHaveBeenCalledWith('/internal/v1/scan', { universe: null }, 'cid-123');
    });
    it('strategy controller maps framing/news label and cid', async () => {
        await strategy.generate({ symbol: 'NVDA', userFraming: 'x', newsLabel: 'REAL_CATALYST' }, req);
        expect(post).toHaveBeenCalledWith('/internal/v1/strategy', { symbol: 'NVDA', user_framing: 'x', news_label: 'REAL_CATALYST' }, 'cid-123');
    });
});
//# sourceMappingURL=features.spec.js.map