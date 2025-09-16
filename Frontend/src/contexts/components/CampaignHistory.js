// src/components/CampaignHistory.js
import React, { useState, useEffect } from 'react';
import './CampaignHistory.css';

function CampaignHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">Loading campaigns...</div>;
  }

  return (
    <div className="campaign-history">
      <div className="header">
        <h1>Campaign History</h1>
        <button 
          onClick={() => window.location.href = '/create-campaign'}
          className="new-campaign-btn"
        >
          + New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="empty-state">
          <p>No campaigns yet. Create your first campaign to get started.</p>
          <button onClick={() => window.location.href = '/create-campaign'}>
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3>{campaign.name}</h3>
                <span className={`status ${campaign.status}`}>
                  {campaign.status}
                </span>
              </div>
              
              <div className="campaign-stats">
                <div className="stat">
                  <span className="label">Audience Size:</span>
                  <span className="value">{campaign.audience_size}</span>
                </div>
                <div className="stat">
                  <span className="label">Sent:</span>
                  <span className="value">{campaign.sent_count}</span>
                </div>
                <div className="stat">
                  <span className="label">Failed:</span>
                  <span className="value">{campaign.failed_count}</span>
                </div>
                <div className="stat">
                  <span className="label">Success Rate:</span>
                  <span className="value">
                    {campaign.audience_size > 0 
                      ? `${Math.round((campaign.sent_count / campaign.audience_size) * 100)}%` 
                      : '0%'
                    }
                  </span>
                </div>
              </div>
              
              <div className="campaign-message">
                <p>{campaign.message}</p>
              </div>
              
              <div className="campaign-footer">
                <span className="date">
                  Created: {new Date(campaign.created_at).toLocaleDateString()}
                </span>
                {campaign.ai_insights && (
                  <button className="insights-btn">
                    View AI Insights
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CampaignHistory;