import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getTicketContactController, getTicketDetailsController, getTicketsController, } from '../controllers/ticket.controller.js';
const ticketRoutes = express.Router();
ticketRoutes.get('/', authenticateToken, getTicketsController);
ticketRoutes.get('/:ticketId', authenticateToken, getTicketDetailsController);
ticketRoutes.get('/:ticketId/contact', authenticateToken, getTicketContactController);
export default ticketRoutes;
