// backend/routes/segments.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// Get all segments
router.get('/', authenticate, async (req, res) => {
  try {
    const segments = await Segment.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    
    res.json(segments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// Get segment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    // Check if user owns this segment
    if (segment.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(segment);
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({ error: 'Failed to fetch segment' });
  }
});

// Create segment
router.post('/', 
  authenticate,
  [
    body('name').notEmpty().withMessage('Segment name is required'),
    body('ruleGroup').isObject().withMessage('Rule group is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { name, description, ruleGroup } = req.body;
      
      // Create segment
      const segment = new Segment({
        name,
        description,
        ruleGroup,
        createdBy: req.user.id
      });
      
      // Estimate segment size
      const query = segment.buildQuery();
      const count = await Customer.countDocuments(query);
      segment.estimatedSize = count;
      
      await segment.save();
      
      res.status(201).json(segment);
    } catch (error) {
      console.error('Error creating segment:', error);
      res.status(500).json({ error: 'Failed to create segment' });
    }
  }
);

// Preview segment (get customers matching the rules without saving)
router.post('/preview', 
  authenticate,
  [
    body('ruleGroup').isObject().withMessage('Rule group is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { ruleGroup } = req.body;
      
      // Create a temporary segment to build the query
      const tempSegment = new Segment({
        ruleGroup,
        createdBy: req.user.id
      });
      
      const query = tempSegment.buildQuery();
      const customers = await Customer.find(query)
        .select('firstName lastName email totalSpent totalOrders lastActive')
        .limit(100); // Limit preview to 100 customers
      
      const totalCount = await Customer.countDocuments(query);
      
      res.json({
        customers,
        totalCount,
        previewCount: customers.length
      });
    } catch (error) {
      console.error('Error previewing segment:', error);
      res.status(500).json({ error: 'Failed to preview segment' });
    }
  }
);

// Update segment
router.put('/:id', authenticate, async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    // Check if user owns this segment
    if (segment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, description, ruleGroup } = req.body;
    
    // Update segment
    if (name) segment.name = name;
    if (description) segment.description = description;
    if (ruleGroup) {
      segment.ruleGroup = ruleGroup;
      
      // Recalculate estimated size if rules changed
      const query = segment.buildQuery();
      const count = await Customer.countDocuments(query);
      segment.estimatedSize = count;
    }
    
    await segment.save();
    
    res.json(segment);
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({ error: 'Failed to update segment' });
  }
});

// Delete segment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    // Check if user owns this segment
    if (segment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Segment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
});

export default router;