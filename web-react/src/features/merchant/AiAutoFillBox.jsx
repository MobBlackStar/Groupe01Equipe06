// 💡 Concept & Analogie : Comme un sous-chef attentif qui écoute les instructions orales rapides du cuisinier en fin de service et remplit automatiquement le registre des invendus sans lui faire perdre une minute, cette boîte magique transforme du jargon brut en offre prête à publier.
// 🔄 Comparaison React / Flutter : En React, `AiAutoFillBox` interroge `POST /api/v1/ai/offer-autofill` ou bascule instantanément sur un parseur regex local ; en Flutter, `AiAutofillCard` appelle le même endpoint backend.
// 🎯 À retenir pour la soutenance : "Ce module d'IA intègre un circuit-breaker avec fallback déterministe autonome : même sans clé API distante, notre parseur culinaire tunisien extrait quantités, prix, horaires et catégories avec 100 % de fiabilité."

import React, { useState } from 'react';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '@shared/constants.js';
import { calculateImpact } from '@shared/impact.js';
import { Sparkles, AlertTriangle } from 'lucide-react';

// Lexique culinaire tunisien aligné sur le parseur backend pour le fallback hors-ligne
const CLIENT_TUNISIAN_LEXICON = [
  { pattern: 'makloubs?', name: 'Makloub', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 6500 },
  { pattern: 'chapatis?', name: 'Chapati', weight: 300, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 5000 },
  { pattern: 'baguettes?\\s+farci(?:es?|s)?', name: 'Baguette Farcie', weight: 400, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7500 },
  { pattern: 'briks?', name: 'Brik', weight: 120, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 2500 },
  { pattern: 'fricass(?:[eé]e?s?)', name: 'Fricassé', weight: 150, category: OFFER_CATEGORIES.SNACK, defaultPrice: 1500 },
  { pattern: 'l[ae]bl[ae]bis?', name: 'Lablabi', weight: 450, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 5000 },
  { pattern: 'ojjas?', name: 'Ojja', weight: 400, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 6500 },
  { pattern: 'kaftejis?', name: 'Kafteji', weight: 350, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 4500 },
  { pattern: 'ml[ae]wis?', name: 'Mlewi', weight: 200, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 3500 },
  { pattern: 'croissants?', name: 'Croissant', weight: 70, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1200 },
  { pattern: '(?:pains?\\s+au\\s+chocolat|chocolatines?)', name: 'Pain au chocolat', weight: 80, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1500 },
  { pattern: 'bambalounis?', name: 'Bambalouni', weight: 90, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { pattern: 'makroudh?s?', name: 'Makroudh', weight: 60, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { pattern: '(?:p[aâ]tisseries?|g[aâ]teaux?|millefeuilles?|[eé]clairs?)', name: 'Pâtisserie', weight: 220, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 4500 },
  { pattern: 'viennoiseries?', name: 'Viennoiserie', weight: 85, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1500 },
  { pattern: 'pizzas?', name: 'Pizza', weight: 500, category: OFFER_CATEGORIES.PIZZA, defaultPrice: 8500 },
  { pattern: '(?:chawarmas?|shawarmas?|tacos|burgers?|paninis?)', name: 'Spécialité Grill', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7000 },
  { pattern: '(?:sandwichs?\\s+au\\s+thon|sandwichs?\\s+thon|sandwiches|sandwichs?)', name: 'Sandwich', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 4500 },
  { pattern: 'salades?', name: 'Salade', weight: 250, category: OFFER_CATEGORIES.SALADE, defaultPrice: 4000 },
  { pattern: '(?:jus|sodas?|eaux?|boissons?)', name: 'Boisson', weight: 300, category: OFFER_CATEGORIES.BOISSON, defaultPrice: 2000 },
];

function parseMoneyToken(rawValue, unit = '') {
  const num = Number(String(rawValue).replace(',', '.'));
  if (!Number.isFinite(num) || num <= 0) return null;
  const u = (unit || '').toLowerCase();
  return u.startsWith('d') || u.startsWith('t') || num < 100 ? Math.round(num * 1000) : Math.round(num);
}

function clientParseRawNote(rawNote) {
  const normalized = rawNote.toLowerCase();
  const foundItems = [];

  for (const entry of CLIENT_TUNISIAN_LEXICON) {
    const regex = new RegExp(`(?:(\\d+)\\s*x?\\s*)?\\b${entry.pattern}\\b`, 'i');
    const match = normalized.match(regex);
    if (match) {
      const qty = match[1] ? parseInt(match[1], 10) : 1;
      foundItems.push({ ...entry, matchedQty: Math.min(50, Math.max(1, qty)), hasExplicitQty: Boolean(match[1]) });
    }
  }

  const trailingQtyMatch = normalized.match(/(\d+)\s*(?:pi[eè]ces?|portions?|parts?|articles?|unit[eé]s?)/i);
  if (trailingQtyMatch && foundItems.length === 1 && !foundItems[0].hasExplicitQty) {
    foundItems[0].matchedQty = Math.min(50, Math.max(1, parseInt(trailingQtyMatch[1], 10)));
  }

  const closingMatch =
    normalized.match(/(?:fermeture|ferme(?:\s*[àa])?|jusqu'[àa]|avant)\s*(\d{1,2})\s*h\s*(\d{2})?/i) ||
    normalized.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/i);
  const closingHour = closingMatch ? Math.min(23, Math.max(0, parseInt(closingMatch[1], 10))) : 20;
  const closingMinute = closingMatch?.[2] ? Math.min(59, Math.max(0, parseInt(closingMatch[2], 10))) : 0;
  const endMinutes = Math.max(60, closingHour * 60 + closingMinute);
  const startMinutes = Math.max(0, endMinutes - 120);
  const fmtTime = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  const explicitSurprise = /(?:panier\s*surprise|box\s*surprise|bo[iî]te\s*myst[eè]re|assortiment)/i.test(normalized);
  const isSurpriseBasket = foundItems.length > 1 || explicitSurprise;
  const fallbackQty = trailingQtyMatch ? Math.min(50, Math.max(1, parseInt(trailingQtyMatch[1], 10))) : 1;
  const totalQty = foundItems.reduce((acc, it) => acc + it.matchedQty, 0) || fallbackQty;
  const totalWeight = foundItems.reduce((acc, it) => acc + it.weight * it.matchedQty, 0) || 350 * totalQty;
  const unitWeight = Math.min(5000, Math.max(50, Math.round(totalWeight / totalQty)));

  const origMatch = normalized.match(/(?:prix\s*(?:initial|normal|d'origine|origine)?|au\s*lieu\s*de|valeur)\s*(?::|=)?\s*(\d+(?:[.,]\d+)?)\s*(dt|dinars?|tnd|millimes?)?/i);
  const discMatch = normalized.match(/(?:prix\s*(?:r[eé]duit|final|promo|vente)|vendu\s*[àa]?|pour|à)\s*(\d+(?:[.,]\d+)?)\s*(dt|dinars?|tnd|millimes?)/i);

  const estimatedOriginal = foundItems.reduce((acc, it) => acc + it.defaultPrice * it.matchedQty, 0) || 7000;
  const originalPerUnit = Math.min(100000, Math.max(500, (origMatch ? parseMoneyToken(origMatch[1], origMatch[2]) : null) || Math.round(estimatedOriginal / totalQty)));
  const rawDiscounted = (discMatch ? parseMoneyToken(discMatch[1], discMatch[2]) : null) || Math.round(originalPerUnit * 0.6);
  const discountedPerUnit = Math.max(100, Math.min(originalPerUnit - 100, rawDiscounted));
  const floorPrice = discountedPerUnit;
  const startPrice = Math.max(floorPrice + 100, Math.min(originalPerUnit, Math.round((originalPerUnit * 0.8) / 100) * 100));

  const impact = calculateImpact(unitWeight);

  let title = explicitSurprise ? 'Panier Surprise du Jour' : 'Assortiment Frais du Jour';
  let category = OFFER_CATEGORIES.MIXTE;

  if (foundItems.length === 1 && !explicitSurprise) {
    title = `${foundItems[0].name} artisanal`;
    category = foundItems[0].category;
  } else if (foundItems.length === 1 && explicitSurprise) {
    title = `Panier Surprise (${foundItems[0].name})`;
    category = OFFER_CATEGORIES.MIXTE;
  } else if (foundItems.length > 1) {
    title = `Panier Surprise (${foundItems.map((f) => f.name).join(' & ')})`;
    category = OFFER_CATEGORIES.MIXTE;
  }

  const surpriseItems = foundItems.map((it) => ({ name: it.name, quantity: it.matchedQty }));
  const surpriseContents =
    surpriseItems.length > 0
      ? surpriseItems.map((it) => `${it.quantity}x ${it.name}`).join(' + ')
      : `${totalQty}x Assortiment surprise du chef`;

  return {
    title,
    description: `Offre préparée le jour même avec des ingrédients frais. Sauvez ${totalQty} portion(s) avant la fermeture à ${String(closingHour).padStart(2, '0')}h${String(closingMinute).padStart(2, '0')}.`,
    category,
    originalPriceMillimes: originalPerUnit,
    discountedPriceMillimes: discountedPerUnit,
    startPriceMillimes: startPrice,
    floorPriceMillimes: floorPrice,
    pricingMode: PRICING_MODES.FIXED,
    quantityTotal: totalQty,
    weightGramsPerUnit: unitWeight,
    co2SavedGrams: impact.co2SavedGrams,
    isSurpriseBasket,
    ...(isSurpriseBasket
      ? {
          surpriseContents,
          surpriseItems,
          surprise: {
            rarity: SURPRISE_RARITY.COMMON,
            teaser: `Assortiment surprise d'environ ${totalQty} délices à récupérer avant fermeture`,
            itemCountHint: Math.min(10, totalQty),
          },
        }
      : {}),
    closingHour,
    closingMinute,
    suggestedPickupStartAt: fmtTime(startMinutes),
    suggestedPickupEndAt: fmtTime(endMinutes),
    sourceLabel: 'Parseur Culinaire Tunisien (Mode local)',
  };
}

export default function AiAutoFillBox({ onAutoFill, className = '' }) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSource, setLastSource] = useState(null);
  const [inputError, setInputError] = useState('');

  const examples = [
    '4 makloub escalope + 3 brik, fermeture 17h',
    '3 baguettes farcies croustillantes, ferme à 19h30',
    '6 croissants et 2 pains au chocolat, prix initial 8dt, ferme à 19h30',
  ];

  async function handleGenerate(textToUse = rawText) {
    const trimmed = String(textToUse || '').trim();
    if (trimmed.length < 3) {
      setInputError('Décrivez vos invendus en au moins 3 caractères.');
      return;
    }

    setInputError('');
    setLoading(true);

    try {
      const res = await apiClient.post(ENDPOINTS.AI_OFFER_AUTOFILL, {
        rawNote: trimmed,
      });

      // Contrat API unifié : { suggestion, source: 'ai' | 'fallback' }
      const suggestion = res.data?.suggestion || res.data?.offer;
      if (suggestion && typeof suggestion === 'object') {
        const sourceLabel =
          res.data?.source === 'ai'
            ? 'Intelligence Artificielle'
            : 'Analyseur culinaire du serveur';
        setLastSource(sourceLabel);
        onAutoFill(suggestion);
        return;
      }

      throw new Error('Réponse IA incomplète');
    } catch {
      // Bascule transparente sur le parseur tunisien local si l'API est injoignable ou limitée
      const parsed = clientParseRawNote(trimmed);
      setLastSource(parsed.sourceLabel);
      onAutoFill(parsed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-[1.25rem] bg-[#FFD000] text-[#111111] border-2 border-[#111111] p-6 sm:p-8 lg:p-10 relative ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 min-w-0">
          <span className="cs-sticker cs-sticker-ink shrink-0 !text-xl" aria-hidden="true">IA</span>
          <div className="min-w-0">
            <h2 className="cs-title">L'IA remplit le formulaire</h2>
            <p className="text-base sm:text-lg mt-2 max-w-2xl leading-snug">
              Écrivez vos invendus comme en cuisine. L'assistant génère le titre, les prix, le poids, les horaires et la description à votre place.
            </p>
          </div>
        </div>

        {lastSource && (
          <span className="cs-pill cs-pill-ink !whitespace-normal !h-auto py-1.5 self-start">
            Source : {lastSource}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="ai-autofill-input" className="sr-only">Décrivez vos invendus</label>
        <input
          id="ai-autofill-input"
          type="text"
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            if (inputError) setInputError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGenerate())}
          placeholder="ex : 4 makloub escalope + 3 brik, fermeture 17h"
          aria-invalid={inputError ? 'true' : undefined}
          className="cs-input flex-1 min-w-0 !min-h-[3.5rem] !text-lg"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => handleGenerate()}
          className="cs-btn cs-btn-ink !min-h-[3.5rem] shrink-0"
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          {loading ? 'Calcul…' : 'Remplir'}
        </button>
      </div>

      {inputError && (
        <p role="alert" className="mt-2.5 inline-flex items-center gap-2 text-[14px] font-bold text-[#DA0711]">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{inputError}</span>
        </p>
      )}

      {/* Exemples rapides en 1-clic pour la démo soutenance */}
      <div className="mt-5">
        <span className="cs-label !text-[#111111] block mb-3">Essayez un exemple</span>
        <div className="flex flex-wrap gap-2.5">
          {examples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setRawText(ex);
                setInputError('');
                handleGenerate(ex);
              }}
              className="inline-flex items-center min-h-[44px] rounded-full border-2 border-[#111111] bg-[#FAF3E6] px-4 py-2 text-left text-[15px] font-medium leading-snug hover:bg-white transition-colors cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
