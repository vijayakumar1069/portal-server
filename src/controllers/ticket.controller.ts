import { RequestHandler, Response } from 'express';
import { User } from '../models/user.js';
import { AuthRequest, HubSpotContact } from '../types';
import { FreshdeskService, HubSpotService } from '../services/connection.services.js';

export const getTicketsController = async (req:AuthRequest, res:Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);

    if (!user || !user.freshdeskApiKey || !user.freshdeskDomain) {
       res.status(400).json({
        success: false,
        message: 'Freshdesk integration not configured or user not found',
      });
      return;
    
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 30;

    const freshdeskService = new FreshdeskService(user.freshdeskDomain, user.freshdeskApiKey);
    const tickets = await freshdeskService.getTickets(page, perPage);

    res.json({
      success: true,
      message: 'Tickets retrieved successfully',
      data: {
        tickets
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
    });
    return;

  }
};

export const getTicketDetailsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const ticketId = parseInt(req.params.ticketId);

    if (isNaN(ticketId)) {
       res.status(400).json({ success: false, message: 'Invalid ticket ID' })
       return;
    }

    const user = await User.findById(userId);
    if (!user || !user.freshdeskApiKey || !user.freshdeskDomain) {
       res.status(400).json({
        success: false,
        message: 'Freshdesk integration not configured or user not found',
      });
      return;
    }

    const freshdeskService = new FreshdeskService(user.freshdeskDomain, user.freshdeskApiKey);
    const [ticket, conversations] = await Promise.all([
      freshdeskService.getTicketById(ticketId),
      freshdeskService.getTicketConversations(ticketId),
    ]);

    res.json({
      success: true,
      message: 'Ticket details retrieved successfully',
      data: { ticket, conversations },
    });
  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket details',
    });
  }
};

export const getTicketContactController = async (req: AuthRequest, res: Response) : Promise<void> => {
  try {
    const userId = req.user?.userId;
    const ticketId = parseInt(req.params.ticketId);

    if (isNaN(ticketId)) {
       res.status(400).json({ success: false, message: 'Invalid ticket ID' });
       return;
    }

    const user = await User.findById(userId);
    if (!user || !user.freshdeskApiKey || !user.freshdeskDomain) {
       res.status(400).json({
        success: false,
        message: 'Freshdesk integration not configured or user not found',
      });
      return;
    }

    const freshdeskService = new FreshdeskService(user.freshdeskDomain, user.freshdeskApiKey);
    const ticket = await freshdeskService.getTicketById(ticketId);

    if (!ticket.requester?.email) {
       res.json({
        success: true,
        message: 'No contact information available',
        data: { contact: null },
      });
      return;
    }

    let contact: HubSpotContact | null = null;

    if (user.hubspotAccessToken) {
      const hubspotService = new HubSpotService(user.hubspotAccessToken);
     
      contact = await hubspotService.getContactByEmail(ticket.requester.email);
    
    }

    res.json({
      success: true,
      message: contact ? 'Contact found in HubSpot' : 'Contact not found in HubSpot',
      data: {
        contact,
        requesterEmail: ticket.requester.email,
      },
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information',
    });
  }
};
