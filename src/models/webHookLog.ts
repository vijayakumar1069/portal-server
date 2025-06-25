import mongoose, { Schema } from "mongoose";
import { IWebhookLog } from "../types";

const webhookLogSchema = new Schema<IWebhookLog>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  event: {
    type: String,
    required: true,
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  source: {
    type: String,
    enum: ['freshdesk', 'hubspot'],
    required: true,
  },
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
});

// Indexes for better query performance
webhookLogSchema.index({ userId: 1, timestamp: -1 });
webhookLogSchema.index({ source: 1, timestamp: -1 });
webhookLogSchema.index({ event: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 90 days (optional)
webhookLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
export const WebhookLog = mongoose.model<IWebhookLog>('WebhookLog', webhookLogSchema);