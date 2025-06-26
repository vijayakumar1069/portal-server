import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { WebhookLog } from "../models/webHookLog.js";
import { User } from "../models/user.js";

export const handleFreshdeskWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const {
      event_type,
      ticket,
      requester,
      agent,
      changes
    } = req.body;

    let userId = 'system';
    let userFound = false;

    if (requester && requester.email) {
      try {
        const user = await User.findOne({ email: requester.email }).lean();
        if (user) {
          userId = user._id.toString();
          userFound = true;
        }
      } catch (userLookupError) {}
    }

  

    switch (event_type) {
      case 'ticket_created':
        await handleTicketCreated({
          ticket_id: ticket?.id,
          ticket_url: ticket?.url,
          ticket_subject: ticket?.subject,
          ticket_description: ticket?.description,
          ticket_status: ticket?.status,
          ticket_priority: ticket?.priority,
          ticket_created_at: ticket?.created_at,
          ticket_updated_at: ticket?.updated_at,
          requester_email: requester?.email,
          requester_name: requester?.name,
          requester_phone: requester?.phone,
          agent_email: agent?.email,
          agent_name: agent?.name,
          group_name: ticket?.group_name,
          product_name: ticket?.product_name,
          custom_fields: ticket?.custom_fields
        }, userId);
        break;

      case 'ticket_updated':
        await handleTicketUpdated({
          ticket_id: ticket?.id,
          ticket_url: ticket?.url,
          ticket_subject: ticket?.subject,
          ticket_status: ticket?.status,
          ticket_priority: ticket?.priority,
          ticket_updated_at: ticket?.updated_at,
          requester_email: requester?.email,
          agent_email: agent?.email,
          agent_name: agent?.name,
          custom_fields: ticket?.custom_fields
        }, userId);
        break;

      case 'ticket_resolved':
        await handleTicketResolved({
          ticket_id: ticket?.id,
          ticket_url: ticket?.url,
          ticket_subject: ticket?.subject,
          ticket_status: ticket?.status,
          requester_email: requester?.email,
          agent_email: agent?.email,
          agent_name: agent?.name
        }, userId);
        break;

      case 'ticket_closed':
        await handleTicketClosed({
          ticket_id: ticket?.id,
          ticket_url: ticket?.url,
          ticket_subject: ticket?.subject,
          ticket_status: ticket?.status,
          requester_email: requester?.email,
          agent_email: agent?.email,
          agent_name: agent?.name
        }, userId);
        break;
         case 'ticket_reopened':
        await handleTicketReopened({
          ticket_id: ticket?.id,
          ticket_url: ticket?.url,
          ticket_subject: ticket?.subject,
          ticket_status: ticket?.status,
          requester_email: requester?.email,
          agent_email: agent?.email,
          agent_name: agent?.name
        }, userId);
        break;

      default:
        break;
    }

    res.status(200).json({
      success: true,
      message: 'Webhook received and processed successfully',
      data: {
     
        event: event_type,
        ticketId: ticket?.id,
        userId,
        userFound,
        requesterEmail: requester?.email,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    try {
      await WebhookLog.create({
        userId: 'error',
        event: 'webhook_error',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          originalPayload: req.body,
          timestamp: new Date()
        },
        source: 'freshdesk',
        timestamp: new Date()
      });
    } catch {}

    res.status(200).json({
      success: false,
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};
const handleTicketCreated = async (ticketData: any, userId: string) => {
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket created',
      payload: {
        ticketId: ticketData.ticket_id,
        subject: ticketData.ticket_subject,
        requesterEmail: ticketData.requester_email,
        status: ticketData.ticket_status,
        priority: ticketData.ticket_priority,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
  } catch (error) {
    await WebhookLog.create({
      userId,
      event: 'ticket_created_error',
      payload: {
        ticketId: ticketData.ticket_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalData: ticketData
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    throw error;
  }
};

const handleTicketUpdated = async (ticketData: any, userId: string) => {
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket updated from Open to Pending',
      payload: {
        ticketId: ticketData.ticket_id,
        status: ticketData.ticket_status,
        updatedAt: ticketData.ticket_updated_at,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
  } catch (error) {
    throw error;
  }
};

const handleTicketResolved = async (ticketData: any, userId: string) => {
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket updated from Pending to Resolved',
      payload: {
        ticketId: ticketData.ticket_id,
        subject: ticketData.ticket_subject,
        requesterEmail: ticketData.requester_email,
        status: ticketData.ticket_status,
        agentEmail: ticketData.agent_email,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
  } catch (error) {
    throw error;
  }
};

const handleTicketClosed = async (ticketData: any, userId: string) => {
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket updated from Resolved to Closed',
      payload: {
        ticketId: ticketData.ticket_id,
        subject: ticketData.ticket_subject,
        status: ticketData.ticket_status,
        requesterEmail: ticketData.requester_email,
        agentEmail: ticketData.agent_email,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
  } catch (error) {
    throw error;
  }
};
const handleTicketReopened = async (ticketData: any, userId: string) => {
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket Reopened',
      payload: {
        ticketId: ticketData.ticket_id,
        subject: ticketData.ticket_subject,
        requesterEmail: ticketData.requester_email,
        
        status: ticketData.ticket_status,
        priority: ticketData.ticket_priority,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
  } catch (error) {
    await WebhookLog.create({
      userId,
      event: 'ticket_created_error',
      payload: {
        ticketId: ticketData.ticket_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalData: ticketData
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    throw error;
  }
};
export const getWebhookLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId= req.user?.userId;

    const logs = await WebhookLog.find({ userId })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      success: true,
      message: 'Webhook logs retrieved successfully',
      data: { logs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook logs'
    });
  }
};


