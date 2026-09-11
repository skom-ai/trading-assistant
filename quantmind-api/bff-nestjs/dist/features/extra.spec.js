"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const features_module_1 = require("./features.module");
const news_controller_1 = require("./news.controller");
const strategy_controller_1 = require("./strategy.controller");
const req = { correlationId: 'cid' };
describe('HealthController', () => {
    it('reports ok', () => {
        expect(new features_module_1.HealthController().health()).toEqual({
            status: 'ok',
            service: 'quantmind-bff',
        });
    });
});
describe('Controller default branches', () => {
    const post = jest.fn().mockResolvedValue({});
    const client = { post };
    beforeEach(() => post.mockClear());
    it('news defaults simulate_empty to false when omitted', async () => {
        await new news_controller_1.NewsController(client).check({ symbol: 'NVDA' }, req);
        expect(post).toHaveBeenCalledWith('/internal/v1/news-check', { symbol: 'NVDA', simulate_empty: false }, 'cid');
    });
    it('strategy defaults framing/news label to null when omitted', async () => {
        await new strategy_controller_1.StrategyController(client).generate({ symbol: 'NVDA' }, req);
        expect(post).toHaveBeenCalledWith('/internal/v1/strategy', { symbol: 'NVDA', user_framing: null, news_label: null }, 'cid');
    });
});
//# sourceMappingURL=extra.spec.js.map