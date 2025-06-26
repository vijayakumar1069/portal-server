import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
   handleFreshdeskWebhook,
   getWebhookLogs,

} from '../controllers/webhook.controller.js';
// import { verifyFreshdeskWebhook } from '../middleware/verifyFreshdeskWebhook.js';

const webhookRoutes = express.Router();

// Add raw body parser for webhook signature verification
// webhookRoutes.use('/freshdesk', express.raw({ type: 'application/json' }));

// Freshdesk will POST to this endpoint
webhookRoutes.post('/freshdesk', handleFreshdeskWebhook);

// Webhook logs endpoints (authenticated)
webhookRoutes.get('/logs', authenticateToken, getWebhookLogs);


export default webhookRoutes;