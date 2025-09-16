// backend/models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
customerSchema.index({ email: 1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ lastActive: -1 });
customerSchema.index({ 'address.country': 1 });

// Method to update customer activity
customerSchema.methods.updateActivity = function() {
  this.lastActive = new Date();
  return this.save();
};

// Static method to find high-value customers
customerSchema.statics.findHighValue = function(threshold = 10000) {
  return this.find({ totalSpent: { $gte: threshold } });
};

export default mongoose.model('Customer', customerSchema);