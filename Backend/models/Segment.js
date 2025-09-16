// backend/models/Segment.js
import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    required: true,
    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in']
  },
  value: {
    type: mongoose.Schema.Types.Mixed
  },
  value2: {
    type: mongoose.Schema.Types.Mixed // For between operator
  }
});

const ruleGroupSchema = new mongoose.Schema({
  conjunction: {
    type: String,
    enum: ['AND', 'OR'],
    required: true
  },
  conditions: [conditionSchema],
  groups: [this] // Recursive reference for nested groups
});

const segmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ruleGroup: ruleGroupSchema,
  estimatedSize: {
    type: Number,
    default: 0
  },
  actualSize: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastCalculated: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
segmentSchema.index({ createdBy: 1 });
segmentSchema.index({ isActive: 1 });

// Method to evaluate the segment and get customer IDs
segmentSchema.methods.evaluate = async function() {
  const Customer = mongoose.model('Customer');
  const query = this.buildQuery();
  const customers = await Customer.find(query).select('_id');
  this.actualSize = customers.length;
  this.lastCalculated = new Date();
  await this.save();
  return customers.map(c => c._id);
};

// Method to build MongoDB query from rule group
segmentSchema.methods.buildQuery = function() {
  return this.buildQueryFromGroup(this.ruleGroup);
};

segmentSchema.methods.buildQueryFromGroup = function(group) {
  const conditions = [];
  
  // Process all conditions in this group
  for (const condition of group.conditions) {
    conditions.push(this.buildCondition(condition));
  }
  
  // Process all nested groups
  for (const nestedGroup of group.groups) {
    conditions.push(this.buildQueryFromGroup(nestedGroup));
  }
  
  // Combine conditions with the group's conjunction
  if (conditions.length === 0) {
    return {};
  }
  
  if (conditions.length === 1) {
    return conditions[0];
  }
  
  return { [`$${group.conjunction.toLowerCase()}`]: conditions };
};

segmentSchema.methods.buildCondition = function(condition) {
  const { field, operator, value, value2 } = condition;
  let mongoOperator;
  let mongoValue;
  
  switch (operator) {
    case 'equals':
      mongoOperator = '$eq';
      mongoValue = value;
      break;
    case 'not_equals':
      mongoOperator = '$ne';
      mongoValue = value;
      break;
    case 'contains':
      mongoOperator = '$regex';
      mongoValue = new RegExp(value, 'i');
      break;
    case 'greater_than':
      mongoOperator = '$gt';
      mongoValue = value;
      break;
    case 'less_than':
      mongoOperator = '$lt';
      mongoValue = value;
      break;
    case 'between':
      return { 
        [field]: { 
          $gte: value, 
          $lte: value2 
        } 
      };
    case 'in':
      mongoOperator = '$in';
      mongoValue = Array.isArray(value) ? value : [value];
      break;
    case 'not_in':
      mongoOperator = '$nin';
      mongoValue = Array.isArray(value) ? value : [value];
      break;
    default:
      mongoOperator = '$eq';
      mongoValue = value;
  }
  
  return { [field]: { [mongoOperator]: mongoValue } };
};

export default mongoose.model('Segment', segmentSchema);