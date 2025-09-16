// backend/models/CommunicationLog.js
import mongoose from 'mongoose';

const communicationLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'],
    default: 'pending'
  },
  messageId: {
    type: String,
    unique: true
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
communicationLogSchema.index({ campaignId: 1, status: 1 });
communicationLogSchema.index({ customerId: 1 });
communicationLogSchema.index({ messageId: 1 });
communicationLogSchema.index({ sentAt: -1 });

export default mongoose.model('CommunicationLog', communicationLogSchema);