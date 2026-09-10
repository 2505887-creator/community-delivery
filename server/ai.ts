import express, { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from './lib/supabaseAdmin';
import type { AuthedRequest } from './lib/supabaseAdmin';

const router = express.Router();

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_DESCRIPTION_LENGTH = 2000;

const diagnosisShape = {
  diagnosis: 'string',
  urgency: 'emergency | high | medium | standard',
  recommendedTrade: 'plumbing | electrical | cleaning | carpentry | appliances',
  estimatedCostRange: 'string in Kenyan shillings (KSh), clearly marked as an estimate',
  estimatedTimeHours: 'string',
  safetyWarning: 'string',
  recommendedSpecialty: 'string',
  materialsLikelyNeeded: ['string'],
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) return JSON.parse(fenced[1]);
    const object = trimmed.match(/\{[\s\S]*\}/);
    if (object) return JSON.parse(object[0]);
    throw new Error('AI returned invalid JSON');
  }
}

function sanitizeResult(value: any) {
  const urgency = ['emergency', 'high', 'medium', 'standard'].includes(value?.urgency)
    ? value.urgency
    : 'standard';
  const trades = ['plumbing', 'electrical', 'cleaning', 'carpentry', 'appliances'];
  const recommendedTrade = trades.includes(value?.recommendedTrade)
    ? value.recommendedTrade
    : 'plumbing';

  return {
    diagnosis: String(value?.diagnosis || 'Unable to determine a reliable diagnosis from the description.').slice(0, 1500),
    urgency,
    recommendedTrade,
    estimatedCostRange: String(value?.estimatedCostRange || 'KSh 1,000–5,000 (estimate only)').slice(0, 120),
    estimatedTimeHours: String(value?.estimatedTimeHours || '1–3 hours').slice(0, 80),
    safetyWarning: String(value?.safetyWarning || 'If there is immediate danger, isolate the area and contact the appropriate emergency service or qualified professional.').slice(0, 1000),
    recommendedSpecialty: String(value?.recommendedSpecialty || 'Qualified local professional').slice(0, 160),
    materialsLikelyNeeded: Array.isArray(value?.materialsLikelyNeeded)
      ? value.materialsLikelyNeeded.map((item: unknown) => String(item).slice(0, 100)).slice(0, 12)
      : [],
  };
}

router.post('/diagnose', requireAuth(['tenant', 'provider', 'driver', 'merchant', 'admin']), async (req: AuthedRequest, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: 'AI diagnosis is not configured on this server.',
    });
  }

  const issueDescription = String(req.body?.issueDescription || '').trim();
  if (!issueDescription) {
    return res.status(400).json({ success: false, error: 'Issue description is required.' });
  }
  if (issueDescription.length > MAX_DESCRIPTION_LENGTH) {
    return res.status(400).json({ success: false, error: `Issue description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are OmniServe's home-maintenance triage assistant for Kenya.\n\nAnalyze the customer's issue below. This is triage, not a definitive diagnosis. Never claim certainty where the description is insufficient. Prioritize immediate safety for electricity, fire, gas, structural danger, flooding, or other hazards. Recommend a trade from exactly: plumbing, electrical, cleaning, carpentry, appliances. Estimate likely labour/material cost in Kenyan shillings (KSh), but clearly label it as an estimate and avoid pretending it is a quote.\n\nReturn ONLY a JSON object matching this shape, with no markdown:\n${JSON.stringify(diagnosisShape)}\n\nCustomer issue:\n${issueDescription}`,
    });

    const result = sanitizeResult(extractJson(response.text || ''));
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ai] diagnosis failed:', error);
    return res.status(502).json({
      success: false,
      error: 'AI diagnosis is temporarily unavailable. Please try again or book a verified professional directly.',
    });
  }
});

export default router;
