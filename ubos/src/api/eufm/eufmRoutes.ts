
import express from 'express';
import type { Response } from 'express';
import { apiBillingMiddleware, BillingRequest } from '../../middleware/api-billing.js';
import { EUFMAgentSummoner } from '../../agents/premium/eufmAgentSummoner.js';

export const eufmRouter = express.Router();

eufmRouter.post('/search', (req, res) => {
    res.json({ message: 'Search endpoint placeholder' });
});

eufmRouter.post('/analyze', apiBillingMiddleware, async (req: BillingRequest, res: Response) => {
    try {
        const { opportunity } = req.body as { opportunity: string };
        if (!opportunity || String(opportunity).trim().length === 0) {
            return res.status(400).json({ error: 'Missing opportunity' });
        }
        const summoner = new EUFMAgentSummoner('eufm-analyze', 'eufm-analyze');
        const result = await summoner.run({ input: opportunity, userId: req.customer?.id ?? 'system' });
        res.json(result);
    } catch (e: unknown) {
        res.status(500).json({ error: (e as Error)?.message || 'Analyze failed' });
    }
});

eufmRouter.post('/generate', (req, res) => {
    res.json({ message: 'Generate endpoint placeholder' });
});

eufmRouter.get('/opportunities', (req, res) => {
    res.json({ message: 'Opportunities endpoint placeholder' });
});

eufmRouter.post('/upgrade', (req, res) => {
    res.json({ message: 'Upgrade endpoint placeholder' });
});
