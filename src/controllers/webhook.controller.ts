import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { WebhookLog } from "../models/webHookLog.js";

export const handleFreshdeskWebhook = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Received Freshdesk webhook:', req.body);

    // Extract webhook data - handle both old and new payload structures
    const webhookData = extractWebhookData(req.body);
    
    // Determine user ID from various sources
    const userId = determineUserId(req.body);
    
    console.log('Using userId:', userId);
    console.log('Detected event type:', webhookData.eventType);

    // Log the webhook event to database
    const webhookLog = await WebhookLog.create({
      userId: userId,
      event: webhookData.eventType,
      payload: req.body,
      source: 'freshdesk',
      timestamp: new Date()
    });

    console.log('Webhook logged to database:', webhookLog._id);

    // Handle different webhook events
    await processWebhookEvent(webhookData, userId);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Webhook received and processed successfully',
      data: {
        webhookLogId: webhookLog._id,
        event: webhookData.eventType,
        ticketId: webhookData.ticketId,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log error to database
    await logWebhookError(error, req.body);
    
    // Return 200 to prevent Freshdesk from retrying
    res.status(200).json({
      success: false,
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};

// Extract webhook data from various payload formats
function extractWebhookData(payload: any) {
  // Handle direct ticket object (like in your example)
  if (payload.id && payload.url && payload.subject) {
    return {
      eventType: determineEventTypeFromPayload(payload),
      ticketId: payload.id,
      ticketUrl: payload.url,
      subject: payload.subject,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      createdAt: payload.created_at,
      updatedAt: payload.updated_at,
      requesterEmail: payload.requester?.email,
      requesterName: payload.requester?.name,
      requesterPhone: payload.requester?.phone,
      agentEmail: payload.responder?.email,
      agentName: payload.responder?.name,
      groupName: payload.group?.name,
      productName: payload.product?.name,
      customFields: payload.custom_fields
    };
  }

  // Handle structured webhook format
  if (payload.freshdesk_webhook || payload.ticket_id) {
    return {
      eventType: payload.freshdesk_webhook?.event_type || 'ticket_updated',
      ticketId: payload.ticket_id,
      ticketUrl: payload.ticket_url,
      subject: payload.ticket_subject,
      description: payload.ticket_description,
      status: payload.ticket_status,
      priority: payload.ticket_priority,
      createdAt: payload.ticket_created_at,
      updatedAt: payload.ticket_updated_at,
      requesterEmail: payload.requester_email,
      requesterName: payload.requester_name,
      requesterPhone: payload.requester_phone,
      agentEmail: payload.agent_email,
      agentName: payload.agent_name,
      groupName: payload.group_name,
      productName: payload.product_name,
      customFields: payload.custom_fields
    };
  }

  // Fallback for unknown formats
  return {
    eventType: 'unknown',
    ticketId: null,
    ticketUrl: null,
    subject: null,
    description: null,
    status: null,
    priority: null,
    createdAt: null,
    updatedAt: null,
    requesterEmail: null,
    requesterName: null,
    requesterPhone: null,
    agentEmail: null,
    agentName: null,
    groupName: null,
    productName: null,
    customFields: null
  };
}

// Determine event type from payload when not explicitly provided
function determineEventTypeFromPayload(payload: any): string {
  // Check if this looks like a new ticket
  if (payload.created_at && !payload.updated_at) {
    return 'ticket_created';
  }
  
  // Check status to determine event type
  if (payload.status) {
    switch (payload.status.toLowerCase()) {
      case 'resolved':
        return 'ticket_resolved';
      case 'closed':
        return 'ticket_closed';
      case 'open':
      case 'pending':
        return payload.updated_at ? 'ticket_updated' : 'ticket_created';
      default:
        return 'ticket_updated';
    }
  }
  
  return 'ticket_updated';
}

// Determine user ID from various sources
function determineUserId(payload: any): string {
  // Try custom fields first
  if (payload.custom_fields && typeof payload.custom_fields === 'object') {
    const userId = payload.custom_fields.user_id || 
                  payload.custom_fields.userId || 
                  payload.custom_fields.customer_id;
    if (userId) return userId;
  }
  
  // Try requester email as fallback
  if (payload.requester_email) {
    return payload.requester_email;
  }
  
  if (payload.requester && payload.requester.email) {
    return payload.requester.email;
  }
  
  // Default fallback
  return 'system';
}

// Process webhook events
async function processWebhookEvent(webhookData: any, userId: string) {
  switch (webhookData.eventType) {
    case 'ticket_created':
      await handleTicketCreated(webhookData, userId);
      break;
      
    case 'ticket_updated':
      await handleTicketUpdated(webhookData, userId);
      break;
      
    case 'ticket_resolved':
      await handleTicketResolved(webhookData, userId);
      break;
      
    case 'ticket_closed':
      await handleTicketClosed(webhookData, userId);
      break;
      
    default:
      console.log('Unhandled webhook event:', webhookData.eventType);
      await handleUnknownEvent(webhookData, userId);
  }
}

// Log webhook processing errors
async function logWebhookError(error: any, originalPayload: any) {
  try {
    await WebhookLog.create({
      userId: 'error',
      event: 'webhook_error',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        originalPayload: originalPayload,
        timestamp: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }
}

// Event handlers with improved error handling
const handleTicketCreated = async (ticketData: any, userId: string) => {
  console.log('Processing ticket created event:', ticketData.ticketId);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket_created_processed',
      payload: {
        ticketId: ticketData.ticketId,
        subject: ticketData.subject,
        requesterEmail: ticketData.requesterEmail,
        status: ticketData.status,
        priority: ticketData.priority,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    
    console.log(`Ticket ${ticketData.ticketId} created successfully processed`);
    
    // Add your custom business logic here
    // Example: Send notification, create internal ticket, etc.
    
  } catch (error) {
    console.error('Error handling ticket created event:', error);
    
    await WebhookLog.create({
      userId,
      event: 'ticket_created_error',
      payload: {
        ticketId: ticketData.ticketId,
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
  console.log('Processing ticket updated event:', ticketData.ticketId);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket_updated_processed',
      payload: {
        ticketId: ticketData.ticketId,
        status: ticketData.status,
        updatedAt: ticketData.updatedAt,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    
    // Add your custom business logic here
    
  } catch (error) {
    console.error('Error handling ticket updated event:', error);
    throw error;
  }
};

const handleTicketResolved = async (ticketData: any, userId: string) => {
  console.log('Processing ticket resolved event:', ticketData.ticketId);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket_resolved_processed',
      payload: {
        ticketId: ticketData.ticketId,
        subject: ticketData.subject,
        requesterEmail: ticketData.requesterEmail,
        agentEmail: ticketData.agentEmail,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    
    // Add your custom business logic here
    // Example: Send satisfaction survey, update CRM, etc.
    
  } catch (error) {
    console.error('Error handling ticket resolved event:', error);
    throw error;
  }
};

const handleTicketClosed = async (ticketData: any, userId: string) => {
  console.log('Processing ticket closed event:', ticketData.ticketId);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'ticket_closed_processed',
      payload: {
        ticketId: ticketData.ticketId,
        subject: ticketData.subject,
        requesterEmail: ticketData.requesterEmail,
        agentEmail: ticketData.agentEmail,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    
    // Add your custom business logic here
    
  } catch (error) {
    console.error('Error handling ticket closed event:', error);
    throw error;
  }
};

const handleUnknownEvent = async (ticketData: any, userId: string) => {
  console.log('Processing unknown event:', ticketData.eventType, 'for ticket:', ticketData.ticketId);
  
  try {
    await WebhookLog.create({
      userId,
      event: 'unknown_event_processed',
      payload: {
        eventType: ticketData.eventType,
        ticketId: ticketData.ticketId,
        subject: ticketData.subject,
        status: ticketData.status,
        processedAt: new Date()
      },
      source: 'freshdesk',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error handling unknown event:', error);
    throw error;
  }
};

// Get webhook logs for a user (keeping your existing function)
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

// Get webhook statistics (keeping your existing function)
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