const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const sharedResponseShape = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'summary',
    'explanation',
    'rewriteTitle',
    'rewrite',
    'firstListTitle',
    'firstListItems',
    'secondListTitle',
    'secondListItems',
  ],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    explanation: { type: 'string' },
    rewriteTitle: { type: 'string' },
    rewrite: { type: 'string' },
    firstListTitle: { type: 'string' },
    firstListItems: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
    secondListTitle: { type: 'string' },
    secondListItems: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
  },
};

const toolConfigs = {
  resume: {
    title: 'Resume Feedback',
    system: `You are an elite university career coach and resume reviewer. Give specific, honest, high-quality feedback for student resumes. Do not give generic encouragement. Focus on action, context, measurable impact, recruiter readability, and how strong the bullet sounds for internships or entry-level roles.`,
    instructions: `Review the user's resume bullet(s) or short resume snippet. Return JSON only.
- Explain what is already working and what is weak.
- Point out vagueness, missing metrics, weak verbs, missing context, or missing outcomes when relevant.
- Rewrite the input into a stronger resume version.
- Make the rewrite sound credible and realistic.
- If the input lacks information, say exactly what is missing instead of inventing facts.
- Keep the response practical and useful for a student editing a resume today.`,
  },
  job: {
    title: 'Job Description Feedback',
    system: `You are an expert job description translator for students. Turn dense employer language into clear, useful guidance. Focus on what the employer actually values, what evidence the student should show, and how to respond strategically.`,
    instructions: `Review the user's job requirement or job description snippet. Return JSON only.
- Translate the posting into plain language.
- Explain what the role is really asking for beneath the wording.
- Highlight the strongest signals: technical expectations, communication expectations, ownership, analysis, tools, or experience level.
- Give a concise rewrite that summarizes what the job is really asking for.
- Provide specific response advice the student can use in a resume or cover letter.
- If the posting is vague, say what would still matter most to prove fit.`,
  },
  'cover-letter': {
    title: 'Cover Letter Feedback',
    system: `You are a strong cover letter editor and recruiter-minded writing coach. Give specific, evidence-based feedback. Focus on credibility, specificity, role alignment, tone, and whether the writing proves fit instead of just claiming it.`,
    instructions: `Review the user's cover letter paragraph or draft. Return JSON only.
- Identify whether the draft is too generic, too repetitive, weak on evidence, or weak on role alignment.
- Explain what is already helping the paragraph and what weakens it.
- Rewrite the paragraph so it sounds more specific, professional, and convincing.
- Do not invent major experiences. If details are missing, improve the structure while signaling what evidence should be added.
- Keep the rewrite realistic for a student applicant.`,
  },
};

const buildMessages = (tool, input) => {
  const config = toolConfigs[tool];

  return [
    {
      role: 'system',
      content: `${config.system}\n\nYou must return valid JSON that matches this schema exactly: ${JSON.stringify(sharedResponseShape)}`,
    },
    {
      role: 'user',
      content: `${config.instructions}\n\nUser input:\n${input}`,
    },
  ];
};

const extractJson = (content) => {
  const trimmed = content.trim();

  if (trimmed.startsWith('{')) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

const validateFeedback = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const requiredStringFields = [
    'title',
    'summary',
    'explanation',
    'rewriteTitle',
    'rewrite',
    'firstListTitle',
    'secondListTitle',
  ];

  if (!requiredStringFields.every((field) => typeof payload[field] === 'string' && payload[field].trim())) {
    return false;
  }

  if (!Array.isArray(payload.firstListItems) || !payload.firstListItems.length) {
    return false;
  }

  if (!Array.isArray(payload.secondListItems) || !payload.secondListItems.length) {
    return false;
  }

  return true;
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

  const { tool, input } = req.body || {};

  if (!toolConfigs[tool]) {
    return res.status(400).json({ error: 'Unsupported tool type.' });
  }

  if (typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'Input is required.' });
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.6,
        messages: buildMessages(tool, input.trim()),
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'feedback_response',
            schema: sharedResponseShape,
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

    if (!validateFeedback(parsed)) {
      return res.status(502).json({ error: 'Model response did not match the expected feedback shape.' });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error.', details: error.message });
  }
};
