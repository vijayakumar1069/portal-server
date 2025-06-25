import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {

  handleFreshdeskWebhook,
 
  getWebhookLogs,
  getWebhookStats
} from '../controllers/webhook.controller';
import { verifyFreshdeskWebhook } from '../middleware/verifyFreshdeskWebhook';

const webhookRoutes = express.Router();

// Freshdesk will POST to this endpoint
webhookRoutes.post('/freshdesk',verifyFreshdeskWebhook, handleFreshdeskWebhook);

// Webhook logs endpoints (authenticated)
webhookRoutes.get('/logs/:userId', authenticateToken, getWebhookLogs);
webhookRoutes.get('/stats/:userId', authenticateToken, getWebhookStats);



export default webhookRoutes;