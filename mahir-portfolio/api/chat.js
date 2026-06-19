const knowledge = require('./portfolio-knowledge.json');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free';

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req.body;
}

function buildKnowledgeText() {
  return JSON.stringify(knowledge, null, 2);
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-8)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content || '').slice(0, 1000),
    }))
    .filter((message) => message.content.trim());
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENROUTER_API_KEY is missing. Add it in Vercel Environment Variables.',
    });
  }

  const body = readBody(req);
  const messages = sanitizeMessages(body.messages);
  const question = String(body.message || '').trim().slice(0, 1000);

  if (!question && messages.length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const systemPrompt = [
    'You are Mahir AI, a helpful chatbot on Mahir Sabotic portfolio website.',
    'Answer questions about Mahir, his skills, projects, contact details, availability and the knowledge below.',
    'If the visitor asks about something not present in the knowledge, say that Mahir has not added that information yet and offer to help them contact him.',
    'Keep replies concise, natural and friendly. Do not invent personal claims, prices, clients, degrees or private details.',
    'Portfolio knowledge:',
    buildKnowledgeText(),
  ].join('\n\n');

  const conversation = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  if (question) {
    conversation.push({ role: 'user', content: question });
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://github.com/mahirsabotic-stack/mahir-portfolio',
        'X-OpenRouter-Title': 'Mahir Portfolio AI',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages: conversation,
        temperature: 0.35,
        max_tokens: 450,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'The AI provider could not answer right now.',
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'The AI provider returned an empty response.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Chat service is unavailable right now.' });
  }
};
