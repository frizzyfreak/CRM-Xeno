// backend/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number,
    category: String
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cod'],
    required: true
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  notes: String
}, {
  timestamps: true
});

// Index for efficient querying
orderSchema.index({ customerId: 1, orderDate: -1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ totalAmount: -1 });
orderSchema.index({ status: 1 });

// Pre-save middleware to update customer stats
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Customer = mongoose.model('Customer');
      await Customer.findByIdAndUpdate(
        this.customerId,
        { 
          $inc: { 
            totalOrders: 1, 
            totalSpent: this.totalAmount 
          },
          $set: { lastActive: new Date() }
        }
      );
    } catch (error) {
      console.error('Error updating customer stats:', error);
    }
  }
  next();
});

export default mongoose.model('Order', orderSchema);