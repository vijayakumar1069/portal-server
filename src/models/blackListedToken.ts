import mongoose, { Schema } from 'mongoose';

const blacklistedTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB will automatically delete documents when this date is reached
    expires: 0
  }
}, {
  timestamps: true,
});

export const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);