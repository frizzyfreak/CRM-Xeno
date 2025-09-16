// backend/routes/ai.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { 
  naturalLanguageToRules, 
  generateMessageSuggestions, 
  generatePerformanceSummary 
} from '../services/aiService.js';

const router = express.Router();

// Convert natural language to segment rules
router.post('/nl-to-rules',
  authenticate,
  [
    body('query').notEmpty().withMessage('Query is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { query } = req.body;
      
      // Convert natural language to rules
      const rules = await naturalLanguageToRules(query);
      
      res.json(rules);
    } catch (error) {
      console.error('Error converting natural language to rules:', error);
      res.status(500).json({ error: 'Failed to convert natural language to rules' });
    }
  }
);

// Generate message suggestions
router.post('/message-suggestions',
  authenticate,
  [
    body('objective').notEmpty().withMessage('Objective is required'),
    body('audienceDescription').optional(),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { objective, audienceDescription } = req.body;
      
      // Generate message suggestions
      const suggestions = await generateMessageSuggestions(objective, audienceDescription);
      
      res.json(suggestions);
    } catch (error) {
      console.error('Error generating message suggestions:', error);
      res.status(500).json({ error: 'Failed to generate message suggestions' });
    }
  }
);

// Generate campaign performance summary
router.post('/performance-summary',
  authenticate,
  [
    body('stats').isObject().withMessage('Stats object is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { stats } = req.body;
      
      // Generate performance summary
      const summary = await generatePerformanceSummary(stats);
      
      res.json({ summary });
    } catch (error) {
      console.error('Error generating performance summary:', error);
      res.status(500).json({ error: 'Failed to generate performance summary' });
    }
  }
);

export default router;