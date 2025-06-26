import { Request, Response } from "express";
import crypto from 'crypto';

export const verifyFreshdeskWebhook = (req: Request, res: Response, next: Function) => {
  try {
    const signature = req.headers['x-freshdesk-signature'] as string;
    const webhookSecret = process.env.FRESHDESK_WEBHOOK_SECRET;
    
    console.log("Webhooks middleware called");
    console.log("Received signature:", signature);
    console.log("Webhook secret exists:", !!webhookSecret);
    
    if (webhookSecret && signature) {
      // Work with raw body for signature verification
      const rawBody = req.body;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      console.log("Expected signature:", expectedSignature);
      
      if (signature !== expectedSignature) {
        console.log("Signature mismatch!");
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
      
      // Parse the JSON after signature verification
      try {
        req.body = JSON.parse(rawBody.toString());
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON payload'
        });
      }
    } else {
      console.log("Skipping signature verification - missing secret or signature");
      // If no signature verification is needed, ensure body is parsed
      if (Buffer.isBuffer(req.body)) {
        try {
          req.body = JSON.parse(req.body.toString());
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload'
          });
        }
      }
    }
    
    console.log("Webhook verification successful");
    next();
  } catch (error) {
    console.error("Webhook verification error:", error);
    res.status(500).json({
      success: false,
      message: 'Webhook verification failed'
    });
  }
};