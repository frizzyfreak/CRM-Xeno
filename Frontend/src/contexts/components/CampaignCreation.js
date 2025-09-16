// src/components/CampaignCreation.js
import React, { useState } from 'react';
import RuleBuilder from './RuleBuilder';
import AISuggestions from './AISuggestions';
import './CampaignCreation.css';

function CampaignCreation() {
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [rules, setRules] = useState({ condition: 'AND', rules: [] });
  const [audienceSize, setAudienceSize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState([]);

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rules })
      });
      const data = await response.json();
      setAudienceSize(data.audienceSize);
    } catch (error) {
      console.error('Error previewing audience:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: campaignName,
          message,
          rules
        })
      });
      
      if (response.ok) {
        // Redirect to campaign history
        window.location.href = '/campaign-history';
      } else {
        console.error('Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <div className="campaign-creation">
      <h1>Create New Campaign</h1>
      
      <div className="campaign-form">
        <div className="form-group">
          <label>Campaign Name</label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Enter campaign name"
          />
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your campaign message"
            rows="3"
          />
          <AISuggestions 
            campaignObjective={campaignName}
            onSuggestionSelect={setMessage}
          />
        </div>

        <div className="form-group">
          <label>Audience Segmentation Rules</label>
          <RuleBuilder onRulesChange={setRules} />
        </div>

        <div className="preview-section">
          <button 
            onClick={handlePreview} 
            disabled={isLoading || rules.rules.length === 0}
          >
            {isLoading ? 'Calculating...' : 'Preview Audience Size'}
          </button>
          
          {audienceSize !== null && (
            <div className="audience-preview">
              <h3>Estimated Audience Size: {audienceSize}</h3>
            </div>
          )}
        </div>

        <div className="actions">
          <button 
            onClick={handleSave} 
            disabled={!campaignName || !message || rules.rules.length === 0}
            className="save-btn"
          >
            Save Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

export default CampaignCreation;