import { Request, Response, NextFunction  } from 'express';
import { Document } from 'mongoose';




// User interfaces
export interface IUser extends Document {
  email: string;
  password: string;
  freshdeskApiKey?: string;
  freshdeskDomain?: string;
  hubspotAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}


// Request interfaces
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}


// Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
}


export interface IntegrationRequest {
  freshdeskApiKey?: string;
  freshdeskDomain?: string;
  hubspotAccessToken?: string;
}
export interface FreshdeskTicket {
  id: number;
  subject: string;
  status: number;
  priority: number;
  requester_id: number;
  requester: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  description: string;
}
export interface FreshdeskConversation {
  id: number;
  body: string;
  body_text: string;
  from_email: string;
  to_emails: string[];
  created_at: string;
  updated_at: string;
  private: boolean;
  user_id?: number;
}
export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    lifecyclestage?: string;
    phone?: string;
    company?: string;
    createdate: string;
    lastmodifieddate: string;
  };
}

export interface IWebhookLog extends Document {
  userId: string;
  event: string;
  payload: any;
  timestamp: Date;
  source: 'freshdesk' | 'hubspot';
  createdAt?: Date;
  updatedAt?: Date;
}