// backend/services/campaignService.js
import { produceMessage } from './kafka.js';
import { getCachedSegmentResults, cacheSegmentResults } from './redis.js';
import Customer from '../models/Customer.js';
import Segment from '../models/Segment.js';
import Campaign from '../models/Campaign.js';
import CommunicationLog from '../models/CommunicationLog.js';

// Initiate a campaign
export const initiateCampaign = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId).populate('segmentId');
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    // Update campaign status
    campaign.status = 'running';
    campaign.startedAt = new Date();
    await campaign.save();
    
    // Get customers in the segment
    let customerIds = await getCachedSegmentResults(campaign.segmentId._id);
    
    if (!customerIds) {
      // Evaluate segment if not cached
      customerIds = await campaign.segmentId.evaluate();
      await cacheSegmentResults(campaign.segmentId._id, customerIds);
    }
    
    // Get customer details
    const customers = await Customer.find({ _id: { $in: customerIds } });
    
    // Send messages to each customer
    for (const customer of customers) {
      // Personalize message
      const personalizedMessage = campaign.message
        .replace('{{firstName}}', customer.firstName)
        .replace('{{lastName}}', customer.lastName)
        .replace('{{email}}', customer.email);
      
      // Send message via Kafka (async)
      await produceMessage('campaign-delivery', {
        type: 'SEND_MESSAGE',
        campaignId: campaign._id,
        customerId: customer._id,
        message: personalizedMessage,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Update campaign stats
    campaign.stats.total = customers.length;
    await campaign.save();
    
    console.log(`Campaign ${campaign.name} initiated for ${customers.length} customers`);
    
    return campaign;
  } catch (error) {
    console.error('Error initiating campaign:', error);
    throw error;
  }
};

// Process delivery receipts
export const processDeliveryReceipt = async (receiptData) => {
  try {
    const { messageId, status, timestamp } = receiptData;
    
    // Find the communication log
    const log = await CommunicationLog.findOne({ messageId });
    
    if (!log) {
      console.error('Communication log not found for messageId:', messageId);
      return;
    }
    
    // Update the log
    log.status = status;
    
    if (status === 'delivered') {
      log.deliveredAt = new Date(timestamp);
    } else if (status === 'opened') {
      log.openedAt = new Date(timestamp);
    } else if (status === 'clicked') {
      log.clickedAt = new Date(timestamp);
    }
    
    await log.save();
    
    // Update campaign stats
    const updateField = `stats.${status}`;
    await Campaign.findByIdAndUpdate(log.campaignId, {
      $inc: { [updateField]: 1 },
    });
    
    console.log(`Updated delivery status for message ${messageId}: ${status}`);
  } catch (error) {
    console.error('Error processing delivery receipt:', error);
    throw error;
  }
};

// Batch process delivery receipts
export const batchProcessDeliveryReceipts = async (receipts) => {
  try {
    const bulkOperations = [];
    
    for (const receipt of receipts) {
      const { messageId, status, timestamp } = receipt;
      
      bulkOperations.push({
        updateOne: {
          filter: { messageId },
          update: {
            $set: {
              status,
              ...(status === 'delivered' && { deliveredAt: new Date(timestamp) }),
              ...(status === 'opened' && { openedAt: new Date(timestamp) }),
              ...(status === 'clicked' && { clickedAt: new Date(timestamp) }),
            },
          },
        },
      });
    }
    
    if (bulkOperations.length > 0) {
      await CommunicationLog.bulkWrite(bulkOperations);
      
      // Update campaign stats
      const campaignUpdates = {};
      for (const receipt of receipts) {
        const field = `stats.${receipt.status}`;
        if (!campaignUpdates[receipt.campaignId]) {
          campaignUpdates[receipt.campaignId] = {};
        }
        campaignUpdates[receipt.campaignId][field] = (campaignUpdates[receipt.campaignId][field] || 0) + 1;
      }
      
      for (const [campaignId, updates] of Object.entries(campaignUpdates)) {
        await Campaign.findByIdAndUpdate(campaignId, { $inc: updates });
      }
      
      console.log(`Batch processed ${receipts.length} delivery receipts`);
    }
  } catch (error) {
    console.error('Error batch processing delivery receipts:', error);
    throw error;
  }
};