// 💡 Concept & Analogie : Comme un interprète simultané qui écoute une voix rapide pour la traduire en formulaire officiel, ce service appelle le modèle d'IA et bascule instantanément sur un parseur de secours local en cas de panne réseau.
// 🔄 Comparaison React / Flutter : Traite les requêtes de pré-remplissage transmises par `AiAutoFillBox` (React) et `AiAutoFillWidget` (Flutter).
// 🎯 À retenir pour la soutenance : "Ce service implémente un pattern de disjoncteur (Circuit Breaker) avec un timeout strict de 8 secondes et bascule automatiquement sur un parseur de secours culinaire en cas d'indisponibilité du LLM."
// Module : Intelligence Artificielle & Automatisation

import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AI_SYSTEM_PROMPT } from './ai.prompt.js';
import { aiSuggestionSchema } from './ai.schema.js';
import { parseRawNote } from './fallbackParser.js';

export const aiService = {
  /**
   * Analyse une note brute et extrait une suggestion structurée pour la création d'offre.
   * Utilise Anthropic Claude avec Structured Outputs si disponible, avec repli automatique vers fallbackParser.
   * @param {string} text - Description brute ou transcription vocale
   * @returns {Promise<{ suggestion: object, source: 'ai' | 'fallback' }>}
   */
  async autofillOffer(text) {
    // Si l'IA est explicitement désactivée ou qu'aucune clé API n'est fournie
    if (env.AI_PROVIDER === 'none' || !env.ANTHROPIC_API_KEY) {
      const fallbackResult = parseRawNote(text);
      return { suggestion: fallbackResult, source: 'fallback' };
    }

    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondes de timeout max

      const response = await client.messages.create(
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: AI_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Analyse cette note et produis un objet JSON strict correspondant à l'offre : "${text}"\nRéponds UNIQUEMENT par le JSON pur sans bloc markdown.`,
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.stop_reason !== 'end_turn') {
        throw new Error(`Stop reason inattendu : ${response.stop_reason}`);
      }

      const textBlock = response.content.find((c) => c.type === 'text')?.text || '';
      const cleanJson = textBlock.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = aiSuggestionSchema.parse(parsed);

      return { suggestion: validated, source: 'ai' };
    } catch (error) {
      logger.warn({ err: error.message }, 'Basculement vers le parseur de secours culinaire');
      const fallbackResult = parseRawNote(text);
      return { suggestion: fallbackResult, source: 'fallback' };
    }
  },
};
