const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const portfolioContext = `
You are the portfolio assistant for Guna Banka.

Important context about the portfolio:
- Guna Banka presents himself as an AI Product Engineer focused on practical outcomes.
- The portfolio is aimed at two audiences: students and recruiters.
- The core focus is building practical AI tools for student career readiness.
- Main project 1: AI Resume Feedback Tool. It helps students strengthen resume bullets, improve clarity, add metrics, and sound more recruiter-ready.
- Main project 2: AI Job Description Translator. It helps students translate job postings into clear requirements, proof signals, and action steps.
- Main project 3: AI Cover Letter Feedback. It helps students improve role alignment, specificity, and evidence in cover letters.
- Additional support work: a student loan guidance website with an interactive repayment estimator.
- Guna emphasizes prompt design, iteration, rubric-based evaluation, grounding, and practical product thinking.
- The portfolio is designed to show product workflow, problem framing, and AI-assisted student support.

Behavior rules:
- Answer questions about Guna, the portfolio, the projects, the workflow, and the site's purpose.
- Be concise, clear, and professional.
- If a user asks for recruiter-oriented insight, answer from the perspective of what a recruiter would likely find relevant in the portfolio.
- If a user asks for student-oriented guidance, connect the answer to the student-facing value of the projects.
- If the user asks something unrelated to the portfolio, politely say that you are the portfolio assistant and redirect them to questions about Guna's work, projects, workflow, or goals.
- Do not invent experiences, credentials, employers, or achievements that are not supported by the portfolio context.
`;

const chatResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'suggestedQuestions'],
  properties: {
    answer: { type: 'string' },
    suggestedQuestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
      maxItems: 3,
    },
  },
};

const extractJson = (content) => {
  const trimmed = String(content || '').trim();

  if (trimmed.startsWith('{')) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => message && typeof message === 'object')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: typeof message.content === 'string' ? message.content.trim().slice(0, 2000) : '',
    }))
    .filter((message) => message.content)
    .slice(-6);
};

const validateChatPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (typeof payload.answer !== 'string' || !payload.answer.trim()) {
    return false;
  }

  if (!Array.isArray(payload.suggestedQuestions)) {
    return false;
  }

  return payload.suggestedQuestions.every((item) => typeof item === 'string');
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured.' });
  }

  const { message, messages } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'A user message is required.' });
  }

  const trimmedMessage = message.trim().slice(0, 3000);
  const priorMessages = sanitizeMessages(messages);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: `${portfolioContext}\n\nReturn valid JSON matching this schema exactly: ${JSON.stringify(chatResponseSchema)}`,
          },
          ...priorMessages,
          {
            role: 'user',
            content: trimmedMessage,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'portfolio_chat_response',
            schema: chatResponseSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: 'OpenAI request failed.', details: errorText });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      return res.status(502).json({ error: 'OpenAI response was missing message content.' });
    }

    const jsonText = extractJson(content);

    if (!jsonText) {
      return res.status(502).json({ error: 'Could not parse JSON from the model response.' });
    }

    const parsed = JSON.parse(jsonText);

    if (!validateChatPayload(parsed)) {
      return res.status(502).json({ error: 'Model response did not match the expected chat shape.' });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error.', details: error.message });
  }
};
