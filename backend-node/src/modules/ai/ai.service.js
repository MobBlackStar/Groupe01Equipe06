// 💡 Concept : Comme un interprète simultané polyglotte relié à Google Gemini 2.5 Flash avec disjoncteur automatique, ce service extrait les offres structurées via l'API Gemini et bascule sans latence sur le parseur culinaire local en cas d'indisponibilité.
// 🎯 Pour la soutenance : "Nous exploitons Google Gemini 2.5 Flash avec Structured Output JSON Schema (timeout 8s) et circuit-breaker déterministe vers le parseur local."
// Module : Intelligence Artificielle & Automatisation

import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '../../../../shared/constants.js';
import { AI_SYSTEM_PROMPT } from './ai.prompt.js';
import { aiSuggestionSchema } from './ai.schema.js';
import { parseRawNote } from './fallbackParser.js';

const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    description: { type: 'STRING' },
    category: { type: 'STRING', enum: Object.values(OFFER_CATEGORIES) },
    originalPriceMillimes: { type: 'INTEGER' },
    discountedPriceMillimes: { type: 'INTEGER' },
    startPriceMillimes: { type: 'INTEGER' },
    floorPriceMillimes: { type: 'INTEGER' },
    pricingMode: { type: 'STRING', enum: Object.values(PRICING_MODES) },
    quantityTotal: { type: 'INTEGER' },
    weightGramsPerUnit: { type: 'INTEGER' },
    isSurpriseBasket: { type: 'BOOLEAN' },
    surpriseContents: { type: 'STRING' },
    suggestedPickupStartAt: { type: 'STRING' },
    suggestedPickupEndAt: { type: 'STRING' },
    surprise: {
      type: 'OBJECT',
      properties: {
        rarity: { type: 'STRING', enum: Object.values(SURPRISE_RARITY) },
        teaser: { type: 'STRING' },
        itemCountHint: { type: 'INTEGER' },
      },
      required: ['rarity', 'teaser', 'itemCountHint'],
    },
  },
  required: [
    'title',
    'description',
    'category',
    'originalPriceMillimes',
    'discountedPriceMillimes',
    'pricingMode',
    'quantityTotal',
    'weightGramsPerUnit',
    'isSurpriseBasket',
  ],
};

function isValidApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return Boolean(trimmed && !trimmed.startsWith('your-') && !trimmed.startsWith('<'));
}

/** Garantit la cohérence des prix (remisé < initial, bornes Smart Decay) et des horaires. */
function normalizeSuggestion(suggestion, rawText, options = {}) {
  const fallback = parseRawNote(rawText, options);
  const orig = Math.min(100000, Math.max(500, Math.round(suggestion.originalPriceMillimes || fallback.originalPriceMillimes)));
  const disc = Math.max(100, Math.min(orig - 100, Math.round(suggestion.discountedPriceMillimes || fallback.discountedPriceMillimes)));
  const floorP = suggestion.floorPriceMillimes
    ? Math.max(100, Math.min(orig - 100, Math.round(suggestion.floorPriceMillimes)))
    : disc;
  const startP = suggestion.startPriceMillimes
    ? Math.max(floorP + 100, Math.min(orig, Math.round(suggestion.startPriceMillimes)))
    : Math.max(floorP + 100, Math.min(orig, Math.round((orig * 0.8) / 100) * 100));

  return {
    ...suggestion,
    title: String(suggestion.title || fallback.title).slice(0, 80),
    description: String(suggestion.description || fallback.description).slice(0, 500),
    originalPriceMillimes: orig,
    discountedPriceMillimes: disc,
    startPriceMillimes: startP,
    floorPriceMillimes: floorP,
    quantityTotal: Math.min(50, Math.max(1, Math.round(suggestion.quantityTotal || fallback.quantityTotal))),
    weightGramsPerUnit: Math.min(5000, Math.max(50, Math.round(suggestion.weightGramsPerUnit || fallback.weightGramsPerUnit))),
    suggestedPickupStartAt: suggestion.suggestedPickupStartAt || fallback.suggestedPickupStartAt,
    suggestedPickupEndAt: suggestion.suggestedPickupEndAt || fallback.suggestedPickupEndAt,
    closingHour: suggestion.closingHour ?? fallback.closingHour,
    closingMinute: suggestion.closingMinute ?? fallback.closingMinute,
    ...(suggestion.isSurpriseBasket
      ? {
          surpriseContents: suggestion.surpriseContents || suggestion.surprise?.teaser || fallback.surpriseContents,
          surpriseItems: suggestion.surpriseItems || fallback.surpriseItems,
        }
      : {}),
  };
}

async function callGemini(text, options = {}) {
  const model = env.AI_MODEL && env.AI_MODEL.includes('gemini') ? env.AI_MODEL : 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const timeoutMs = env.AI_TIMEOUT_MS || 8000;

  const userPrompt = `Analyse cette note (français, anglais ou derja) et génère une offre CampusSave en français : "${text}"${
    options.closingTime ? ` (heure de fermeture : ${options.closingTime})` : ''
  }`;

  const response = await axios.post(
    url,
    {
      systemInstruction: {
        parts: [{ text: AI_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: GEMINI_RESPONSE_SCHEMA,
      },
    },
    {
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
    }
  );

  const rawJson = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) {
    throw new Error('Réponse Gemini vide');
  }

  const parsed = JSON.parse(rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  const validated = aiSuggestionSchema.parse(parsed);
  return normalizeSuggestion(validated, text, options);
}

async function callAnthropic(text, options = {}) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const controller = new AbortController();
  const timeoutMs = env.AI_TIMEOUT_MS || 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const model = env.AI_MODEL && env.AI_MODEL.includes('claude') ? env.AI_MODEL : 'claude-sonnet-4-5-20250929';
    const response = await client.messages.create(
      {
        model,
        max_tokens: 1024,
        system: AI_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyse cette note et produis un objet JSON strict correspondant à l'offre : "${text}"${
              options.closingTime ? ` (fermeture prévue à ${options.closingTime})` : ''
            }\nRéponds UNIQUEMENT par le JSON pur sans bloc markdown.`,
          },
        ],
      },
      { signal: controller.signal }
    );

    if (response.stop_reason && response.stop_reason !== 'end_turn' && response.stop_reason !== 'stop_sequence') {
      throw new Error(`Stop reason inattendu : ${response.stop_reason}`);
    }

    const textBlock = response.content.find((c) => c.type === 'text')?.text || '';
    const cleanJson = textBlock.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const validated = aiSuggestionSchema.parse(parsed);
    return normalizeSuggestion(validated, text, options);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const aiService = {
  /**
   * Analyse une note brute et extrait une suggestion structurée pour la création d'offre.
   * Utilise Google Gemini 2.5 Flash (ou Anthropic) si configuré, avec repli automatique vers fallbackParser.
   * @param {string} text - Description brute ou transcription vocale
   * @param {{ closingTime?: string }} [options] - Paramètres optionnels
   * @returns {Promise<{ suggestion: object, source: 'GEMINI' | 'ANTHROPIC' | 'FALLBACK' }>}
   */
  async autofillOffer(text, options = {}) {
    if (env.AI_PROVIDER === 'none') {
      return { suggestion: parseRawNote(text, options), source: 'FALLBACK' };
    }

    if (env.AI_PROVIDER === 'gemini') {
      if (!isValidApiKey(env.GEMINI_API_KEY)) {
        return { suggestion: parseRawNote(text, options), source: 'FALLBACK' };
      }
      try {
        const suggestion = await callGemini(text, options);
        return { suggestion, source: 'GEMINI' };
      } catch (error) {
        logger.warn({ err: error.message }, 'Gemini indisponible, bascule vers fallbackParser');
        return { suggestion: parseRawNote(text, options), source: 'FALLBACK' };
      }
    }

    if (env.AI_PROVIDER === 'anthropic') {
      if (!isValidApiKey(env.ANTHROPIC_API_KEY)) {
        return { suggestion: parseRawNote(text, options), source: 'FALLBACK' };
      }
      try {
        const suggestion = await callAnthropic(text, options);
        return { suggestion, source: 'ANTHROPIC' };
      } catch (error) {
        logger.warn({ err: error.message }, 'Anthropic indisponible, bascule vers fallbackParser');
        return { suggestion: parseRawNote(text, options), source: 'FALLBACK' };
      }
    }

    return { suggestion: parseRawNote(text, options), source: 'FALLBACK' };
  },
};
