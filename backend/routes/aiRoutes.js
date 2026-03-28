import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const GROQ_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are CareConnect AI, an expert medical image analysis assistant specialising in dermatology, wound care, ophthalmic conditions, and other visually diagnosable symptoms.

Analyze the provided image carefully and respond ONLY with a valid JSON object — no markdown, no code fences, just raw JSON:
{
  "condition": "Most probable condition name",
  "confidence": <integer 0-100>,
  "urgencyLevel": <integer 1-5>,
  "specialist": "Recommended specialist type (e.g. Dermatologist)",
  "recommendation": "Clear 2–3 sentence advice on what the patient should do next.",
  "message": "A compassionate 3–4 sentence analysis of what you observe in the image."
}

Urgency scale: 1=Mild, 2=Minor, 3=Moderate, 4=Serious, 5=Critical Emergency.
Always remind the patient this is an AI assessment and not a substitute for professional diagnosis.`;

// POST /api/ai/analyze-image  (protected — requires patient JWT)
router.post('/analyze-image', protect, async (req, res) => {
  try {
    const { image, message, lang } = req.body;
    if (!image) return res.status(400).json({ message: 'No image data provided.' });

    if (!GROQ_KEY) {
      return res.json({
        condition: 'Contact Dermatitis (Demo)',
        confidence: 74,
        urgencyLevel: 2,
        specialist: 'Dermatologist',
        recommendation: 'Avoid scratching the affected area and keep it clean. Apply a mild fragrance-free moisturiser and see a dermatologist within the next few days if symptoms persist or worsen.',
        message: 'Based on the image, I can observe redness and slight inflammation that is consistent with contact dermatitis. (Demo Mode)',
      });
    }

    const userText = message?.trim() || 'Please analyse this image and identify any visible medical symptoms or conditions.';

    const visionSystemPrompt = `${SYSTEM_PROMPT} 
    CRITICAL: You MUST translate your entire response into the language specified by the user: "${lang || 'English'}".`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          { role: 'system', content: visionSystemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.2,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      return res.status(502).json({ message: err?.error?.message || 'Groq Vision API error.' });
    }

    const data = await groqRes.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return res.json(JSON.parse(jsonMatch[0]));
      } catch (e) {}
    }
    res.json({ condition: 'Analysis Complete', confidence: 0, urgencyLevel: 1, specialist: 'General Practitioner', recommendation: rawText, message: rawText });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/ai/triage (protected — text-only triage)
router.post('/triage', protect, async (req, res) => {
  try {
    const { message, patientName, lang } = req.body;
    if (!message) return res.status(400).json({ message: 'No message provided.' });

    if (!GROQ_KEY) {
      return res.json({
        message: "Hello! Since no API key is set, I'm in demo mode.",
        urgencyLevel: 1,
        specialist: "General Practitioner",
        recommendation: "Keep monitoring your symptoms."
      });
    }

    const triageSystemPrompt = `You are CareConnect AI, a medical triage assistant. The patient's name is ${patientName || 'Patient'}.
When a patient describes symptoms, always respond with a valid JSON object:
{
  "message": "Compassionate analysis",
  "urgencyLevel": <1-5>,
  "specialist": "Target specialist",
  "recommendation": "Next steps"
}
CRITICAL: You MUST translate your ENTIRE response into the language: "${lang || 'English'}".`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: triageSystemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      return res.status(502).json({ message: err?.error?.message || 'Groq API error.' });
    }

    const data = await groqRes.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return res.json(JSON.parse(jsonMatch[0]));
      } catch (e) {}
    }
    res.json({ message: rawText });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
