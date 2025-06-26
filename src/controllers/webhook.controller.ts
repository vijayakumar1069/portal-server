import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { WebhookLog } from "../models/webHookLog.js";
import { User } from "../models/user.js";


export const handleFreshdeskWebhook = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== RAW WEBHOOK PAYLOAD ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    // Extract data from the actual webhook structure
    const {
      event_type,
      ticket,
      requester,
      agent,
      changes
    } = req.body;

    console.log('=== EXTRACTED WEBHOOK DATA ===');
    console.log('Event type:', event_type);
    console.log('Ticket data:', ticket);
    console.log('Requester data:', requester);
    console.log('Agent data:', agent);
    console.log('Changes data:', changes);

    // For webhooks, we need to find the user by email
    let userId = 'system'; // Default fallback
    let userFound = false;

    console.log('=== USER LOOKUP PROCESS ===');
    
    if (requester && requester.email) {
      console.log('Looking up user by email:', requester.email);
      
      try {
        const user = await User.findOne({ email: requester.email }).lean();
        console.log('User lookup result:', user ? `Found user: ${user._id}` : 'No user found');
        
        if (user) {
          userId = user._id.toString();
          userFound = true;
          console.log('Using userId from database:', userId);
        } else {
          console.log('User not found in database, using system fallback');
        }
      } catch (userLookupError) {
        console.error('Error looking up user:', userLookupError);
        console.log('Using system fallback due to lookup error');
      }
    } else {
      console.log('No requester email found in webhook payload');
    }

    console.log('=== FINAL USER CONTEXT ===');
    console.log('Final userId:', userId);
    console.log('User found in database:', userFound);

    // Log the webhook event to database
    console.log('=== LOGGING WEBHOOK TO DATABASE ===');
    const webhookLogData = {
      userId: userId,
      event: event_type || 'unknown',
      payload: {
        ...req.body,
        processedAt: new Date(),
        userLookupStatus: userFound ? 'found' : 'not_found',
        requesterEmail: requester?.email || 'unknown'
      },
      source: 'freshdesk',
      timestamp: new Date()
    };
    
    console.log('Webhook log data to save:', JSON.stringify(webhookLogData, null, 2));
    
    const webhookLog = await WebhookLog.create(webhookLogData);
    console.log('Webhook logged to database with ID:', webhookLog._id);

    // Handle different webhook events
    console.log('=== PROCESSING WEBHOOK EVENT ===');
    console.log('Processing event type:', event_type);
    
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
        
      default:
        console.log('Unhandled webhook event:', event_type);
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    
    // Return success response with webhook log ID
    res.status(200).json({
      success: true,
      message: 'Webhook received and processed successfully',
      data: {
        webhookLogId: webhookLog._id,
        event: event_type,
        ticketId: ticket?.id,
        userId: userId,
        userFound: userFound,
        requesterEmail: requester?.email,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('=== WEBHOOK PROCESSING ERROR ===');
    console.error('Error details:', error);
    
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
      console.log('Error logged to database successfully');
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

// Updated helper functions with better error handling and logging
const handleTicketCreated = async (ticketData: any, userId: string) => {
  console.log('=== PROCESSING TICKET CREATED ===');
  console.log('Ticket ID:', ticketData.ticket_id);
  console.log('User ID:', userId);
  
  try {
    // Store additional event-specific data
    const logData = {
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
    };
    
    console.log('Saving ticket created log:', JSON.stringify(logData, null, 2));
    
    await WebhookLog.create(logData);
    
    console.log(`Ticket ${ticketData.ticket_id} created successfully processed for user ${userId}`);
    
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
  console.log('=== PROCESSING TICKET UPDATED ===');
  console.log('Ticket ID:', ticketData.ticket_id);
  console.log('User ID:', userId);
  
  try {
    const logData = {
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
    };
    
    console.log('Saving ticket updated log:', JSON.stringify(logData, null, 2));
    
    await WebhookLog.create(logData);
    
    console.log(`Ticket ${ticketData.ticket_id} updated successfully processed for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling ticket updated event:', error);
    throw error;
  }
};

const handleTicketResolved = async (ticketData: any, userId: string) => {
  console.log('=== PROCESSING TICKET RESOLVED ===');
  console.log('Ticket ID:', ticketData.ticket_id);
  console.log('User ID:', userId);
  
  try {
    const logData = {
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
    };
    
    console.log('Saving ticket resolved log:', JSON.stringify(logData, null, 2));
    
    await WebhookLog.create(logData);
    
    console.log(`Ticket ${ticketData.ticket_id} resolved successfully processed for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling ticket resolved event:', error);
    throw error;
  }
};

const handleTicketClosed = async (ticketData: any, userId: string) => {
  console.log('=== PROCESSING TICKET CLOSED ===');
  console.log('Ticket ID:', ticketData.ticket_id);
  console.log('User ID:', userId);
  
  try {
    const logData = {
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
    };
    
    console.log('Saving ticket closed log:', JSON.stringify(logData, null, 2));
    
    await WebhookLog.create(logData);
    
    console.log(`Ticket ${ticketData.ticket_id} closed successfully processed for user ${userId}`);
    
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

    console.log('=== FETCHING WEBHOOK LOGS ===');
    console.log('User ID:', userId);
    console.log('Filters:', { page, limit, event, source, startDate, endDate });

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

    console.log('Database filter:', JSON.stringify(filter, null, 2));

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [logs, total] = await Promise.all([
      WebhookLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      WebhookLog.countDocuments(filter)
    ]);

    console.log('Found logs count:', logs.length);
    console.log('Total logs:', total);

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
    
    console.log('=== GENERATING WEBHOOK STATS ===');
    console.log('User ID:', userId);
    console.log('Days:', days);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    
    console.log('Date range:', startDate, 'to', new Date());
    
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

    console.log('Generated stats:', JSON.stringify(stats, null, 2));

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