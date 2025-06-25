import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {

  handleFreshdeskWebhook,
 
  getWebhookLogs,
  getWebhookStats
} from '../controllers/webhook.controller.js';
import { verifyFreshdeskWebhook } from '../middleware/verifyFreshdeskWebhook.js';

const webhookRoutes = express.Router();

// Freshdesk will POST to this endpoint
webhookRoutes.post('/freshdesk',verifyFreshdeskWebhook, handleFreshdeskWebhook);

// Webhook logs endpoints (authenticated)
webhookRoutes.get('/logs/:userId', authenticateToken, getWebhookLogs);
webhookRoutes.get('/stats/:userId', authenticateToken, getWebhookStats);



export default webhookRoutes;