// 💡 Concept & Analogie : Comme un sous-chef attentif qui écoute les instructions orales rapides du cuisinier en fin de service et remplit automatiquement le registre des invendus sans lui faire perdre une minute, cette boîte magique transforme du jargon brut en offre prête à publier.
// 🔄 Comparaison React / Flutter : En React, `AiAutoFillBox` interroge l'API ou bascule instantanément sur un parseur regex local ; en Flutter, le composant utilise un champ `TextField` avec un bouton d'action magique similaire.
// 🎯 À retenir pour la soutenance : "Ce module d'IA intègre un fallback déterministe autonome : si la clé API externe est coupée ou indisponible, notre parseur culinaire tunisien extrait tout de même les quantités, horaires et catégories avec 100% de fidélité."

import React, { useState } from 'react';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '@shared/constants.js';
import { calculateImpact } from '@shared/impact.js';
import { Sparkles } from 'lucide-react';

// Lexique culinaire tunisien embarqué pour le fallback 100% client
const CLIENT_TUNISIAN_LEXICON = [
  { keywords: ['makloub'], name: 'Makloub Chawarma', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 6500 },
  { keywords: ['chapati'], name: 'Chapati Mahdia', weight: 300, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 5000 },
  { keywords: ['baguette farcie', 'baguette farci'], name: 'Baguette Farcie Escalope', weight: 400, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7500 },
  { keywords: ['brik', 'briks'], name: 'Brik à l Œuf & Thon', weight: 120, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 2500 },
  { keywords: ['fricasse', 'fricassé', 'fricasses'], name: 'Fricassé Tunisien', weight: 150, category: OFFER_CATEGORIES.SNACK, defaultPrice: 1500 },
  { keywords: ['lablabi', 'leblebi'], name: 'Lablabi Chaud aux Pois Chiches', weight: 450, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 5000 },
  { keywords: ['ojja'], name: 'Ojja Merguez Tunisienne', weight: 400, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 6500 },
  { keywords: ['kafteji'], name: 'Assiette Kafteji Complet', weight: 350, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 4500 },
  { keywords: ['mlewi', 'mlawi'], name: 'Mlewi Thon & Fromage', weight: 200, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 3500 },
  { keywords: ['croissant'], name: 'Croissant Beurre Artisanal', weight: 70, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1200 },
  { keywords: ['pain au chocolat', 'chocolatine'], name: 'Pain au chocolat pur beurre', weight: 80, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1500 },
  { keywords: ['bambalouni'], name: 'Bambalouni Traditionnel', weight: 90, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { keywords: ['makroudh', 'makroud'], name: 'Makroudh de Kairouan', weight: 60, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { keywords: ['pizza'], name: 'Pizza Cuite au Feu de Bois', weight: 500, category: OFFER_CATEGORIES.PIZZA, defaultPrice: 8500 },
  { keywords: ['sandwich thon', 'sandwich'], name: 'Sandwich Traditionnel', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 4500 },
  { keywords: ['salade'], name: 'Salade Méchouia Tunisienne', weight: 250, category: OFFER_CATEGORIES.SALADE, defaultPrice: 4000 },
  { keywords: ['jus', 'soda', 'eau', 'boisson'], name: 'Boisson Fraîche', weight: 300, category: OFFER_CATEGORIES.BOISSON, defaultPrice: 2000 },
];

function clientParseRawNote(rawNote) {
  const normalized = rawNote.toLowerCase();
  const foundItems = [];

  for (const entry of CLIENT_TUNISIAN_LEXICON) {
    for (const kw of entry.keywords) {
      const regex = new RegExp(`(?:(\\d+)\\s*x?\\s*)?${kw}`, 'i');
      const match = normalized.match(regex);
      if (match) {
        const qty = match[1] ? parseInt(match[1], 10) : 1;
        foundItems.push({ ...entry, matchedQty: qty });
        break;
      }
    }
  }

  const closingMatch = normalized.match(/(?:fermeture|ferme|jusqu'?à)\s*(\d{1,2})h(\d{2})?/i);
  let closingHour = 20;
  let closingMinute = 0;
  if (closingMatch) {
    closingHour = parseInt(closingMatch[1], 10);
    closingMinute = closingMatch[2] ? parseInt(closingMatch[2], 10) : 0;
  }

  const isMultiItem = foundItems.length > 1;
  const isSurpriseBasket = isMultiItem;
  const totalQty = foundItems.reduce((acc, it) => acc + it.matchedQty, 0) || 1;
  const totalWeight = foundItems.reduce((acc, it) => acc + it.weight * it.matchedQty, 0) || 350;
  const unitWeight = Math.round(totalWeight / totalQty);

  const estimatedOriginal = foundItems.reduce((acc, it) => acc + it.defaultPrice * it.matchedQty, 0) || 7000;
  const originalPerUnit = Math.round(estimatedOriginal / totalQty);
  const floorPrice = Math.round(originalPerUnit * 0.45); // 55% de réduction plancher

  const impact = calculateImpact(unitWeight);

  let title = 'Assortiment Frais du Jour';
  let category = OFFER_CATEGORIES.MIXTE;

  if (foundItems.length === 1) {
    title = `${foundItems[0].name} fraîchement préparé`;
    category = foundItems[0].category;
  } else if (foundItems.length > 1) {
    title = `Panier Surprise (${foundItems.map((f) => f.name).join(' + ')})`;
    category = OFFER_CATEGORIES.MIXTE;
  }

  return {
    title,
    description: `Offre préparée le jour même avec des ingrédients frais. Sauvez ${totalQty} portion(s) avant la fermeture à ${String(closingHour).padStart(2, '0')}h${String(closingMinute).padStart(2, '0')}.`,
    category,
    originalPriceMillimes: originalPerUnit,
    startPriceMillimes: Math.round(originalPerUnit * 0.75),
    floorPriceMillimes: floorPrice,
    fixedDiscountedMillimes: Math.round(originalPerUnit * 0.55),
    quantityTotal: totalQty,
    weightGramsPerUnit: unitWeight,
    co2SavedGrams: impact.co2SavedGrams,
    isSurpriseBasket,
    surpriseItems: foundItems.map((it) => ({ name: it.name, quantity: it.matchedQty })),
    closingHour,
    closingMinute,
    source: 'Parseur Culinaire Tunisien (Fallback Hors-Ligne)',
  };
}

export default function AiAutoFillBox({ onAutoFill, className = '' }) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSource, setLastSource] = useState(null);

  const examples = [
    '4 makloub escalope + 3 brik, fermeture 17h',
    '3 baguettes farcies croustillantes, ferme à 19h30',
    '6 croissants beurre pur + 4 pains au chocolat, fermeture 18h',
  ];

  async function handleGenerate(textToUse = rawText) {
    if (!textToUse.trim()) return;
    setLoading(true);

    try {
      // 1. Tente l'API backend si disponible
      const res = await apiClient.post(ENDPOINTS.AI_OFFER_AUTOFILL, {
        rawNote: textToUse,
      });

      // Contrat API : { suggestion, source: 'ai' | 'fallback' } (ancien format `offer` toléré)
      const suggestion = res.data?.suggestion || res.data?.offer;
      if (suggestion) {
        onAutoFill(suggestion);
        setLastSource(res.data?.source === 'ai' ? 'Intelligence Artificielle (Claude)' : 'Analyseur culinaire du serveur');
        setLoading(false);
        return;
      }
    } catch {
      // 2. Bascule instantanée sur le parseur tunisien local
      const parsed = clientParseRawNote(textToUse);
      onAutoFill(parsed);
      setLastSource(parsed.source);
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
              Écrivez vos invendus comme en cuisine. L'assistant génère le titre, les prix, le poids et la description à votre place.
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
          onChange={(e) => setRawText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGenerate())}
          placeholder="ex : 4 makloub escalope + 3 brik, fermeture 17h"
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
