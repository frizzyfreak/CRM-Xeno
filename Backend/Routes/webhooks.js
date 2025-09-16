// backend/routes/webhooks.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { processDeliveryReceipt, batchProcessDeliveryReceipts } from '../services/campaignService.js';

const router = express.Router();

// Single delivery receipt webhook
router.post('/delivery-receipt',
  [
    body('messageId').notEmpty().withMessage('messageId is required'),
    body('status').isIn(['sent', 'delivered', 'failed', 'opened', 'clicked']).withMessage('Invalid status'),
    body('timestamp').optional().isISO8601().withMessage('Invalid timestamp'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      // Process the delivery receipt
      await processDeliveryReceipt(req.body);
      
      res.json({ message: 'Delivery receipt processed successfully' });
    } catch (error) {
      console.error('Error processing delivery receipt:', error);
      res.status(500).json({ error: 'Failed to process delivery receipt' });
    }
  }
);

// Batch delivery receipts webhook
router.post('/delivery-receipts/batch',
  [
    body().isArray().withMessage('Request body should be an array'),
    body('*.messageId').notEmpty().withMessage('messageId is required'),
    body('*.status').isIn(['sent', 'delivered', 'failed', 'opened', 'clicked']).withMessage('Invalid status'),
    body('*.timestamp').optional().isISO8601().withMessage('Invalid timestamp'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      // Process the batch of delivery receipts
      await batchProcessDeliveryReceipts(req.body);
      
      res.json({ message: 'Batch delivery receipts processed successfully' });
    } catch (error) {
      console.error('Error processing batch delivery receipts:', error);
      res.status(500).json({ error: 'Failed to process batch delivery receipts' });
    }
  }
);

// Simulate vendor API (for testing)
router.post('/simulate-vendor',
  [
    body('campaignId').isMongoId().withMessage('Valid campaignId is required'),
    body('customerId').isMongoId().withMessage('Valid customerId is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { campaignId, customerId, message } = req.body;
      
      // Simulate sending (90% success rate)
      const success = Math.random() < 0.9;
      const status = success ? 'delivered' : 'failed';
      
      // Simulate vendor API delay
      setTimeout(async () => {
        try {
          // Call our own delivery receipt API
          const response = await fetch(`${process.env.BACKEND_URL}/webhook/delivery-receipt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              status,
              timestamp: new Date().toISOString(),
              campaignId,
              customerId,
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to call delivery receipt API:', response.statusText);
          }
        } catch (error) {
          console.error('Error calling delivery receipt API:', error);
        }
      }, 100 + Math.random() * 2000); // Random delay between 100ms and 2s
      
      res.json({ 
        message: 'Message processing started',
        simulated: true,
        estimatedSuccess: success,
      });
    } catch (error) {
      console.error('Error simulating vendor API:', error);
      res.status(500).json({ error: 'Failed to simulate vendor API' });
    }
  }
);

export default router;