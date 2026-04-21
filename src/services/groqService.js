import { GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL } from '../config/ai.js';

async function callGroq(messages, maxTokens = 1024) {
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function generateSEO(projectName, description) {
  const prompt = `You are a YouTube SEO expert. Generate optimized YouTube metadata for a vlog titled "${projectName}".
Context: ${description || 'A travel/lifestyle vlog video'}

Respond with valid JSON only (no markdown, no explanation):
{
  "title": "compelling YouTube title under 70 chars with keywords",
  "description": "500 char YouTube description with timestamps, keywords, and call-to-action",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}`;

  const content = await callGroq([{ role: 'user', content: prompt }], 512);
  const json = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(json);
}

export async function generateAISuggestions(videoContext) {
  const prompt = `You are an AI video editing assistant. Analyze this vlog context and return 4 editing suggestions.
Context: "${videoContext || 'General travel vlog, 15 minutes long'}"

Respond with valid JSON only:
[
  {"id": "1", "title": "Short action title", "confidence": 96, "description": "Brief explanation of suggestion"},
  {"id": "2", "title": "Short action title", "confidence": 89, "description": "Brief explanation"},
  {"id": "3", "title": "Short action title", "confidence": 82, "description": "Brief explanation"},
  {"id": "4", "title": "Short action title", "confidence": 74, "description": "Brief explanation"}
]`;

  const content = await callGroq([{ role: 'user', content: prompt }], 512);
  const json = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(json);
}
