import { Request, Response } from "express";
import crypto from 'crypto';
export const verifyFreshdeskWebhook = (req: Request, res: Response, next: Function) => {
  const signature = req.headers['x-freshdesk-signature'] as string;
  const webhookSecret = process.env.FRESHDESK_WEBHOOK_SECRET;
  
  if (webhookSecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

      console.log("webhooks middleware called ")
    
    if (signature !== expectedSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }
  }
  
  next();
};