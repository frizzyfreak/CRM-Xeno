// backend/routes/campaigns.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import CommunicationLog from '../models/CommunicationLog.js';
import { initiateCampaign } from '../services/campaignService.js';

const router = express.Router();

// Get all campaigns
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const campaigns = await Campaign.find({ createdBy: req.user.id })
      .populate('segmentId', 'name estimatedSize')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Campaign.countDocuments({ createdBy: req.user.id });
    
    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get campaign by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('segmentId')
      .populate('createdBy', 'name email');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user owns this campaign
    if (campaign.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get communication logs for this campaign
    const logs = await CommunicationLog.find({ campaignId: campaign._id })
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      campaign,
      logs
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create campaign
router.post('/', 
  authenticate,
  [
    body('name').notEmpty().withMessage('Campaign name is required'),
    body('segmentId').isMongoId().withMessage('Valid segment ID is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { name, segmentId, message, scheduledFor } = req.body;
      
      // Check if segment exists and belongs to user
      const segment = await Segment.findById(segmentId);
      if (!segment) {
        return res.status(404).json({ error: 'Segment not found' });
      }
      
      if (segment.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Create campaign
      const campaign = new Campaign({
        name,
        segmentId,
        message,
        scheduledFor,
        createdBy: req.user.id,
        status: scheduledFor ? 'scheduled' : 'draft'
      });
      
      await campaign.save();
      
      // If no scheduled time, initiate campaign immediately
      if (!scheduledFor) {
        await initiateCampaign(campaign._id);
      }
      
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// Update campaign
router.put('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user owns this campaign
    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, message, scheduledFor } = req.body;
    
    // Update campaign
    if (name) campaign.name = name;
    if (message) campaign.message = message;
    if (scheduledFor) {
      campaign.scheduledFor = scheduledFor;
      campaign.status = 'scheduled';
    }
    
    await campaign.save();
    
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user owns this campaign
    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Campaign.findByIdAndDelete(req.params.id);
    
    // Also delete associated communication logs
    await CommunicationLog.deleteMany({ campaignId: req.params.id });
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Initiate campaign
router.post('/:id/initiate', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user owns this campaign
    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if campaign is already running or completed
    if (campaign.status === 'running') {
      return res.status(400).json({ error: 'Campaign is already running' });
    }
    
    if (campaign.status === 'completed') {
      return res.status(400).json({ error: 'Campaign is already completed' });
    }
    
    // Initiate campaign
    await initiateCampaign(campaign._id);
    
    res.json({ message: 'Campaign initiated successfully' });
  } catch (error) {
    console.error('Error initiating campaign:', error);
    res.status(500).json({ error: 'Failed to initiate campaign' });
  }
});

// Get campaign stats
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user owns this campaign
    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get detailed stats from communication logs
    const stats = await CommunicationLog.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
});

export default router;