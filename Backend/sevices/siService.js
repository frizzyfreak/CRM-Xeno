// backend/services/aiService.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Convert natural language to segment rules
export const naturalLanguageToRules = async (query) => {
  try {
    const prompt = `
Convert the following natural language query into a structured segment rule group in JSON format.

Natural Language Query: "${query}"

Respond with ONLY a JSON object in this exact format:
{
  "conjunction": "AND" or "OR",
  "conditions": [
    {
      "field": "field_name",
      "operator": "operator_name",
      "value": "value"
    }
  ],
  "groups": [] // nested groups if needed
}

Available fields: 
- firstName (string)
- lastName (string) 
- email (string)
- totalSpent (number)
- totalOrders (number)
- lastActive (date)
- "address.country" (string)
- "address.city" (string)

Available operators: 
- equals, not_equals, contains, 
- greater_than, less_than, 
- between, in, not_in

Examples:
1. "Customers who spent more than 10000" →
{
  "conjunction": "AND",
  "conditions": [
    {
      "field": "totalSpent",
      "operator": "greater_than",
      "value": 10000
    }
  ],
  "groups": []
}

2. "Customers from India or USA" →
{
  "conjunction": "OR",
  "conditions": [
    {
      "field": "address.country",
      "operator": "equals",
      "value": "India"
    },
    {
      "field": "address.country",
      "operator": "equals",
      "value": "USA"
    }
  ],
  "groups": []
}

3. "Customers who haven't shopped in 6 months and spent over 5000" →
{
  "conjunction": "AND",
  "conditions": [
    {
      "field": "lastActive",
      "operator": "less_than",
      "value": "2023-07-01" // Calculate date from today minus 6 months
    },
    {
      "field": "totalSpent",
      "operator": "greater_than",
      "value": 5000
    }
  ],
  "groups": []
}

Now convert: "${query}"
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that converts natural language queries into structured JSON rules for customer segmentation. Always respond with ONLY valid JSON, no other text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const result = response.choices[0].message.content.trim();
    return JSON.parse(result);
  } catch (error) {
    console.error('Error in naturalLanguageToRules:', error);
    throw new Error('Failed to convert natural language to rules');
  }
};

// Generate message suggestions based on campaign objective
export const generateMessageSuggestions = async (objective, audienceDescription) => {
  try {
    const prompt = `
Generate 3 personalized message variations for a marketing campaign.

Campaign Objective: ${objective}
Target Audience: ${audienceDescription}

Respond with ONLY a JSON array of message strings, like:
[
  "Message 1",
  "Message 2", 
  "Message 3"
]

Make the messages engaging, personalized, and relevant to the objective and audience.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a marketing copywriter that creates engaging campaign messages. Always respond with ONLY a JSON array of strings, no other text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = response.choices[0].message.content.trim();
    return JSON.parse(result);
  } catch (error) {
    console.error('Error in generateMessageSuggestions:', error);
    throw new Error('Failed to generate message suggestions');
  }
};

// Generate campaign performance summary
export const generatePerformanceSummary = async (campaignStats) => {
  try {
    const prompt = `
Create a human-readable summary of these campaign performance stats:

Total messages: ${campaignStats.total}
Sent successfully: ${campaignStats.sent}
Failed: ${campaignStats.failed}
Delivered: ${campaignStats.delivered}
Opened: ${campaignStats.opened}
Clicked: ${campaignStats.clicked}

Respond with a concise, insightful summary (2-3 sentences) that highlights key metrics and performance.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a marketing analyst that creates insightful summaries of campaign performance. Respond with only the summary text, no other content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 150
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in generatePerformanceSummary:', error);
    throw new Error('Failed to generate performance summary');
  }
};