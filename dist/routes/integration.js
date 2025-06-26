import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { integrationValidation, handleValidationErrors } from '../middleware/validation.js';
import { freshdeskIntegrationSaveController, hubspotIntegrationSaveController, integrationStatusController } from '../controllers/intergration.controller.js';
const integrationRoutes = express.Router();
// Save integration credentials
integrationRoutes.post('/freshdesk-save', authenticateToken, integrationValidation, handleValidationErrors, freshdeskIntegrationSaveController);
integrationRoutes.post('/hubSpot-save', authenticateToken, integrationValidation, handleValidationErrors, hubspotIntegrationSaveController);
// Get integration status
integrationRoutes.get('/status', authenticateToken, integrationStatusController);
export default integrationRoutes;
