import { Request, Response } from "express";

import { AuthRequest } from "../types";
import { WebhookLog } from "../models/webHookLog.js";


export const handleFreshdeskWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      freshdesk_webhook: webhook,
      ticket_id,
      ticket_url,
      ticket_subject,
      ticket_description,
      ticket_status,
      ticket_priority,
      ticket_created_at,
      ticket_updated_at,
      requester_email,
      requester_name,
      requester_phone,
      agent_email,
      agent_name,
      group_name,
      product_name,
      custom_fields
    } = req.body;

    console.log('Received Freshdesk webhook:', {
      event: webhook?.event_type,
      ticket_id,
      ticket_status,
      requester_email,
      rawBody: JSON.stringify(req.body, null, 2)
    });

    // For webhooks, we don't have authenticated user context
    // You might want to derive userId from custom_fields or other ticket data
    let userId = 'system'; // Default fallback
    
    // Try to get userId from custom fields if available
    if (custom_fields && typeof custom_fields === 'object') {
      userId = custom_fields.user_id || custom_fields.userId || 'system';
    }

    console.log('Using userId:', userId);

    // Log the webhook event to database
    const webhookLog = await WebhookLog.create({
      userId: userId,
      event: webhook?.event_type || 'unknown',
      payload: req.body,
      source: 'freshdesk',
      timestamp: new Date()
    });

    console.log('Webhook logged to database:', webhookLog._id);

    // Handle different webhook events
    switch (webhook?.event_type) {
      case 'ticket_created':
        await handleTicketCreated({
          ticket_id,
          ticket_url,
          ticket_subject,
          ticket_description,
          ticket_status,
          ticket_priority,
          ticket_created_at,
          requester_email,
          requester_name,
          requester_phone,
          agent_email,
          agent_name,
          group_name,
          product_name,
          custom_fields
        }, userId);
        break;
        
      case 'ticket_updated':
        await handleTicketUpdated({
          ticket_id,
          ticket_url,
          ticket_subject,
          ticket_status,
          ticket_priority,
          ticket_updated_at,
          requester_email,
          agent_email,
          agent_name,
          custom_fields
        }, userId);
        break;
        
      case 'ticket_resolved':
        await handleTicketResolved({
          ticket_id,
          ticket_url,
          ticket_subject,
          ticket_status,
          requester_email,
          agent_email,
          agent_name
        }, userId);
        break;
        
      case 'ticket_closed':
        await handleTicketClosed({
          ticket_id,
          ticket_url,
          ticket_subject,
          ticket_status,
          requester_email,
          agent_email,
          agent_name
        }, userId);
        break;
        
      default:
        console.log('Unhandled webhook event:', webhook?.event_type);
    }

    // Return success response with webhook log ID
    res.status(200).json({
      success: true,
      message: 'Webhook received and processed successfully',
      data: {
        webhookLogId: webhookLog._id,
        event: webhook?.event_type,
        ticketId: ticket_id,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Try to log the error to database as well
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
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    // Still return 200 to prevent Freshdesk from retrying
    res.status(200).json({
      success: false,
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};

// Updated helper functions with better error handling
const handleTicketCreated = async (ticketData: any, userId: string) => {
  console.log('Processing ticket created event:', ticketData.ticket_id);
  
  try {
    // Store additional event-specific data
    await WebhookLog.create({
      userId,
      event: 'ticket_created_processed',
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
    
    console.log(`Ticket ${ticketData.ticket_id} created successfully processed`);
    
  } catch (error) {
    console.error('Error handling ticket created event:', error);
    
    // Log the processing error
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
  console.log('Processing ticket updated event:', ticketData.ticket_id);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket_updated_processed',
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
    console.error('Error handling ticket updated event:', error);
    throw error;
  }
};

const handleTicketResolved = async (ticketData: any, userId: string) => {
  console.log('Processing ticket resolved event:', ticketData.ticket_id);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket_resolved_processed',
      payload: {
        ticketId: ticketData.ticket_id,
        subject: ticketData.ticket_subject,
        requesterEmail: ticketData.requester_email,
        agentEmail: ticketData.agent_email,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error handling ticket resolved event:', error);
    throw error;
  }
};

const handleTicketClosed = async (ticketData: any, userId: string) => {
  console.log('Processing ticket closed event:', ticketData.ticket_id);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket_closed_processed',
      payload: {
        ticketId: ticketData.ticket_id,
        subject: ticketData.ticket_subject,
        requesterEmail: ticketData.requester_email,
        agentEmail: ticketData.agent_email,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error handling ticket closed event:', error);
    throw error;
  }
};



// Get webhook logs for a user
export const getWebhookLogs = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      event, 
      source,
      startDate,
      endDate 
    } = req.query;

    // Build filter
    const filter: any = { userId };
    
    if (event) {
      filter.event = event;
    }
    
    if (source) {
      filter.source = source;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [logs, total] = await Promise.all([
      WebhookLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      WebhookLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Webhook logs retrieved successfully',
      data: {
        logs,
        pagination: {
          current: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook logs'
    });
  }
};

// Get webhook statistics
export const getWebhookStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    
    const stats = await WebhookLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            event: '$event',
            source: '$source'
          },
          count: { $sum: 1 },
          lastReceived: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      message: 'Webhook statistics retrieved successfully',
      data: {
        stats,
        period: `Last ${days} days`,
        total: stats.reduce((sum, stat) => sum + stat.count, 0)
      }
    });

  } catch (error) {
    console.error('Get webhook stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook statistics'
    });
  }
};

