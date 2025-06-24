import { Request } from 'express';
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
}

