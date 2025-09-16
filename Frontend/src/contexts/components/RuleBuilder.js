// src/components/RuleBuilder.js
import React, { useState } from 'react';
import './RuleBuilder.css';

function RuleBuilder({ onRulesChange }) {
  const [rules, setRules] = useState({
    condition: 'AND',
    rules: []
  });

  const fieldOptions = [
    { value: 'spend', label: 'Total Spend' },
    { value: 'visits', label: 'Number of Visits' },
    { value: 'last_active', label: 'Days Since Last Activity' },
    { value: 'location', label: 'Location' },
    { value: 'purchases', label: 'Number of Purchases' }
  ];

  const operatorOptions = {
    spend: [
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'equals', label: 'Equals' }
    ],
    visits: [
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'equals', label: 'Equals' }
    ],
    last_active: [
      { value: 'greater_than', label: 'More Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'equals', label: 'Equals' }
    ],
    location: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' }
    ],
    purchases: [
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'equals', label: 'Equals' }
    ]
  };

  const addRule = () => {
    const newRules = [...rules.rules, { field: 'spend', operator: 'greater_than', value: '' }];
    const updatedRules = { ...rules, rules: newRules };
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  const removeRule = (index) => {
    const newRules = [...rules.rules];
    newRules.splice(index, 1);
    const updatedRules = { ...rules, rules: newRules };
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  const updateRule = (index, key, value) => {
    const newRules = [...rules.rules];
    newRules[index][key] = value;
    const updatedRules = { ...rules, rules: newRules };
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  const updateCondition = (condition) => {
    const updatedRules = { ...rules, condition };
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  return (
    <div className="rule-builder">
      <div className="condition-selector">
        <label>Match</label>
        <select 
          value={rules.condition} 
          onChange={(e) => updateCondition(e.target.value)}
        >
          <option value="AND">All</option>
          <option value="OR">Any</option>
        </select>
        <label>of the following rules:</label>
      </div>

      {rules.rules.map((rule, index) => (
        <div key={index} className="rule-row">
          <select
            value={rule.field}
            onChange={(e) => updateRule(index, 'field', e.target.value)}
          >
            {fieldOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={rule.operator}
            onChange={(e) => updateRule(index, 'operator', e.target.value)}
          >
            {operatorOptions[rule.field].map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={rule.value}
            onChange={(e) => updateRule(index, 'value', e.target.value)}
            placeholder="Value"
          />

          <button 
            className="remove-rule-btn" 
            onClick={() => removeRule(index)}
          >
            ×
          </button>
        </div>
      ))}

      <button className="add-rule-btn" onClick={addRule}>
        + Add Rule
      </button>
    </div>
  );
}

export default RuleBuilder;