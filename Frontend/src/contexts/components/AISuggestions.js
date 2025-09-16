// src/components/AISuggestions.js
import React, { useState } from 'react';
import './AISuggestions.css';

function AISuggestions({ campaignObjective, onSuggestionSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = async () => {
    if (!campaignObjective) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ objective: campaignObjective })
      });
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="ai-suggestions">
      <button 
        onClick={generateSuggestions} 
        disabled={isLoading || !campaignObjective}
        className="generate-btn"
      >
        {isLoading ? 'Generating...' : 'Generate AI Suggestions'}
      </button>
      
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          <h4>AI Suggestions:</h4>
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="suggestion-item"
              onClick={() => onSuggestionSelect(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AISuggestions;