// 💡 Concept & Analogie : Comme un interprète simultané qui écoute une voix rapide pour la traduire en formulaire officiel, ce service appelle le modèle d'IA et bascule instantanément sur un parseur de secours local en cas de panne réseau.
// 🔄 Comparaison React / Flutter : Traite les requêtes de pré-remplissage transmises par `AiAutoFillBox` (React) et `AiAutofillCard` (Flutter).
// 🎯 À retenir pour la soutenance : "Ce service implémente un pattern de disjoncteur (Circuit Breaker) avec un timeout strict configurable et bascule automatiquement sur un parseur de secours culinaire en cas d'indisponibilité du LLM."
// Module : Intelligence Artificielle & Automatisation

import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AI_SYSTEM_PROMPT } from './ai.prompt.js';
import { aiSuggestionSchema } from './ai.schema.js';
import { parseRawNote } from './fallbackParser.js';

function isValidApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return Boolean(trimmed && !trimmed.startsWith('your-') && !trimmed.startsWith('<'));
}

/** Garantit la cohérence des prix (remisé < initial, start/floor pour Smart Decay) et des horaires. */
function normalizeSuggestion(suggestion, rawText, options = {}) {
  const fallback = parseRawNote(rawText, options);
  const orig = Math.max(500, Math.round(suggestion.originalPriceMillimes || fallback.originalPriceMillimes));
  const disc = Math.max(100, Math.min(orig - 100, Math.round(suggestion.discountedPriceMillimes || fallback.discountedPriceMillimes)));
  const floorP = suggestion.floorPriceMillimes
    ? Math.max(100, Math.min(orig - 100, Math.round(suggestion.floorPriceMillimes)))
    : disc;
  const startP = suggestion.startPriceMillimes
    ? Math.max(floorP + 100, Math.min(orig, Math.round(suggestion.startPriceMillimes)))
    : Math.max(floorP + 100, Math.min(orig, Math.round((orig * 0.8) / 100) * 100));

  return {
    ...suggestion,
    originalPriceMillimes: orig,
    discountedPriceMillimes: disc,
    startPriceMillimes: startP,
    floorPriceMillimes: floorP,
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

export const aiService = {
  /**
   * Analyse une note brute et extrait une suggestion structurée pour la création d'offre.
   * Utilise Anthropic si configuré et joignable, sinon bascule instantanément sur fallbackParser.
   * @param {string} text - Description brute ou transcription vocale
   * @param {{ closingTime?: string }} [options] - Paramètres optionnels
   * @returns {Promise<{ suggestion: object, source: 'ai' | 'fallback' }>}
   */
  async autofillOffer(text, options = {}) {
    if (env.AI_PROVIDER === 'none' || !isValidApiKey(env.ANTHROPIC_API_KEY)) {
      const fallbackResult = parseRawNote(text, options);
      return { suggestion: fallbackResult, source: 'fallback' };
    }

    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const controller = new AbortController();
      const timeoutMs = env.AI_TIMEOUT_MS || 8000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await client.messages.create(
        {
          model: env.AI_MODEL || 'claude-sonnet-4-5-20250929',
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

      clearTimeout(timeoutId);

      if (response.stop_reason && response.stop_reason !== 'end_turn' && response.stop_reason !== 'stop_sequence') {
        throw new Error(`Stop reason inattendu : ${response.stop_reason}`);
      }

      const textBlock = response.content.find((c) => c.type === 'text')?.text || '';
      const cleanJson = textBlock.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = aiSuggestionSchema.parse(parsed);

      return { suggestion: normalizeSuggestion(validated, text, options), source: 'ai' };
    } catch (error) {
      logger.warn({ err: error.message }, 'Basculement vers le parseur de secours culinaire');
      const fallbackResult = parseRawNote(text, options);
      return { suggestion: fallbackResult, source: 'fallback' };
    }
  },
};
