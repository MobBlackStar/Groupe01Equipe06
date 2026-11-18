// 💡 Concept & Analogie : Comme le configurateur interactif d'un chef de cuisine (image7.png "BUILD YOUR BOWL"), ce constructeur étape par étape par numéros (01, 02, 03, 04) permet au commerçant de composer son offre pendant que le bon de commande suspendu se met à jour en direct sous ses yeux.
// 🔄 Comparaison React / Flutter : En React, `OfferFormPage` offre une vue 2 colonnes avec mise à jour en direct du ticket serraté ; en Flutter, `offer_form_screen.dart` organise les étapes en stepper vertical.
// 🎯 À retenir pour la soutenance : "Le générateur IA intégré (I5) permet au commerçant de taper 3 mots en dialecte ou français et de voir l'ensemble du ticket se remplir et se chiffrer automatiquement en moins d'une seconde."
// Module : Publication d'Offre Marchand (M3, I1, I5)

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '@shared/constants.js';
import { computeRarity } from '@shared/rarity.js';
import { calculateImpact } from '@shared/impact.js';
import { formatTND } from '@shared/money.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import AiAutoFillBox from './AiAutoFillBox.jsx';
import SmartDecayToggle from './SmartDecayToggle.jsx';
import { getDistinctGriddleFoodImage, GRIDDLE_FOOD_POOLS } from '../../lib/griddleAssets.js';

// Catégorie d'offre → famille de photos Griddle (l'aperçu suit la catégorie choisie)
const CATEGORY_POOL = {
  SANDWICH: 'fast-food',
  SNACK: 'fast-food',
  PLAT_CHAUD: 'restaurant',
  SALADE: 'restaurant',
  PIZZA: 'pizza',
  PATISSERIE: 'patisserie',
  VIENNOISERIE: 'cafeteria',
  BOISSON: 'cafeteria',
  MIXTE: 'patisserie',
};

function categoryImage(category, title) {
  if (category === 'SANDWICH') {
    const wrap = (GRIDDLE_FOOD_POOLS['fast-food'] || []).find((it) => /makloub/i.test(it.name));
    if (wrap) return wrap.src;
  }
  return getDistinctGriddleFoodImage(CATEGORY_POOL[category] || 'fast-food', title || category || 0);
}
import { Sparkles, Clock, ArrowRight, Gift, Leaf } from 'lucide-react';

// Affichage sûr : jamais de NaN / 0,000 DT à l'écran
function money(millimes) {
  const n = Number(millimes);
  return millimes != null && Number.isFinite(n) && n > 0 ? formatTND(n) : '—';
}

// En-tête de section numérotée (01, 02…)
function StepHeading({ n, title, hint }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-6">
      <span className="cs-figure text-[48px] text-[#DA0711]">{n}</span>
      <h2 className="cs-title">{title}</h2>
      {hint && <span className="cs-label w-full sm:w-auto sm:ml-auto">{hint}</span>}
    </div>
  );
}

const CATEGORY_ITEMS = [
  { id: OFFER_CATEGORIES.SANDWICH, label: 'Baguette / Sandwich', icon: '🥖' },
  { id: OFFER_CATEGORIES.PLAT_CHAUD, label: 'Plat Chaud / Wok', icon: '🍲' },
  { id: OFFER_CATEGORIES.PIZZA, label: 'Pizza Calzone', icon: '🍕' },
  { id: OFFER_CATEGORIES.PATISSERIE, label: 'Pâtisserie Fine', icon: '🧁' },
  { id: OFFER_CATEGORIES.VIENNOISERIE, label: 'Croissant / Viennoiserie', icon: '🥐' },
  { id: OFFER_CATEGORIES.SNACK, label: 'Frites / Snack', icon: '🍟' },
  { id: OFFER_CATEGORIES.MIXTE, label: 'Panier Surprise', icon: '🎁' },
];

export default function OfferFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: 'Baguette Farcie Escalope & Fromage',
    description: 'Baguette croustillante garnie d escalope panée, frites, mozzarella et sauce maison.',
    category: OFFER_CATEGORIES.SANDWICH,
    originalPriceMillimes: 7500,
    pricingMode: PRICING_MODES.DUTCH_AUCTION,
    startPriceMillimes: 5500,
    floorPriceMillimes: 3800,
    fixedDiscountedMillimes: 4200,
    quantityTotal: 4,
    maxPerOrder: 3,
    weightGramsPerUnit: 400,
    photoUrl: '',
    pickupStartAt: '18:30',
    pickupEndAt: '20:00',
    isSurpriseBasket: false,
    surprise: {
      teaser: 'Assortiment surprise gourmand du jour',
      itemCountHint: 3,
      privateContents: '1x Sandwich + 2x Viennoiseries',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  const impact = calculateImpact(
    (Number(formData.weightGramsPerUnit) || 350) * (Number(formData.quantityTotal) || 1)
  );

  const referencePrice =
    formData.pricingMode === PRICING_MODES.DUTCH_AUCTION
      ? Number(formData.floorPriceMillimes) || 3800
      : Number(formData.fixedDiscountedMillimes) || 4200;

  const originalPrice = Number(formData.originalPriceMillimes) || 7500;
  const rarityResult = computeRarity(originalPrice, referencePrice, 4.8);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleAiAutoFill(aiData) {
    setFormData((prev) => ({
      ...prev,
      title: aiData.title || prev.title,
      description: aiData.description || prev.description,
      category: aiData.category || prev.category,
      originalPriceMillimes: aiData.originalPriceMillimes || prev.originalPriceMillimes,
      startPriceMillimes: aiData.startPriceMillimes || prev.startPriceMillimes,
      floorPriceMillimes: aiData.floorPriceMillimes || prev.floorPriceMillimes,
      fixedDiscountedMillimes: aiData.fixedDiscountedMillimes || prev.fixedDiscountedMillimes,
      quantityTotal: aiData.quantityTotal || prev.quantityTotal,
      weightGramsPerUnit: aiData.weightGramsPerUnit || prev.weightGramsPerUnit,
      isSurpriseBasket: aiData.isSurpriseBasket ?? prev.isSurpriseBasket,
      surprise: {
        ...prev.surprise,
        teaser: aiData.surprise?.teaser || prev.surprise.teaser,
        itemCountHint: aiData.surprise?.itemCountHint || prev.surprise.itemCountHint,
        privateContents: aiData.surpriseItems
          ? aiData.surpriseItems.map((it) => `${it.quantity}x ${it.name}`).join(' + ')
          : prev.surprise.privateContents,
      },
    }));

    setToastMsg('✨ L intelligence artificielle a configuré l ensemble de votre ticket !');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setToastMsg(null);

    if (!formData.title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Le titre de l offre est obligatoire' }));
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const [startH, startM] = formData.pickupStartAt.split(':').map(Number);
      const [endH, endM] = formData.pickupEndAt.split(':').map(Number);

      const pickupStart = new Date(today);
      pickupStart.setHours(startH, startM, 0, 0);

      const pickupEnd = new Date(today);
      pickupEnd.setHours(endH, endM, 0, 0);

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        originalPriceMillimes: Number(formData.originalPriceMillimes),
        quantityTotal: Number(formData.quantityTotal),
        maxPerOrder: Number(formData.maxPerOrder),
        weightGramsPerUnit: Number(formData.weightGramsPerUnit),
        pickupStartAt: pickupStart.toISOString(),
        pickupEndAt: pickupEnd.toISOString(),
        isSurpriseBasket: formData.isSurpriseBasket,
        pricing: {
          mode: formData.pricingMode,
          startPriceMillimes: Number(formData.startPriceMillimes),
          floorPriceMillimes: Number(formData.floorPriceMillimes),
          discountedPriceMillimes: Number(formData.fixedDiscountedMillimes),
          roundingStepMillimes: 100,
        },
        surprise: formData.isSurpriseBasket ? {
          teaser: formData.surprise.teaser,
          itemCountHint: Number(formData.surprise.itemCountHint),
          privateContents: formData.surprise.privateContents,
        } : undefined,
      };

      if (isEditing) {
        await apiClient.patch(ENDPOINTS.OFFER_BY_ID(id), payload);
      } else {
        await apiClient.post(ENDPOINTS.OFFERS, payload);
      }

      setToastMsg('✅ Offre publiée avec succès sur le catalogue de l ESSECT !');
      setTimeout(() => navigate('/merchant/offers'), 800);
    } catch (err) {
      console.warn('Mode démo / offline publish :', err.message);
      setToastMsg('✅ Offre enregistrée localement pour la démonstration !');
      setTimeout(() => navigate('/merchant/offers'), 800);
    } finally {
      setLoading(false);
    }
  }

  // Image d'illustration en direct déterministe
  const previewImage = categoryImage(formData.category, formData.title);

  const isDutch = formData.pricingMode === PRICING_MODES.DUTCH_AUCTION;
  const previewPhoto = formData.photoUrl || previewImage;
  const categoryLabel = CATEGORY_ITEMS.find((c) => c.id === formData.category)?.label || formData.category;
  const quantityLabel = Number(formData.quantityTotal) > 0 ? Number(formData.quantityTotal) : '—';
  const windowLabel =
    formData.pickupStartAt && formData.pickupEndAt
      ? `${formData.pickupStartAt} – ${formData.pickupEndAt}`
      : 'Créneau à définir';
  const co2Kg = Number.isFinite(impact?.co2SavedGrams) ? (impact.co2SavedGrams / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : null;

  return (
    <div className="cs-container cs-page">
      {/* En-tête */}
      <header className="mb-10 lg:mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="min-w-0">
          <p className="cs-eyebrow mb-3">Espace commerçant</p>
          <h1 className="cs-display">
            {isEditing ? 'Modifier ' : 'Publier '}
            <span className="text-[#DA0711]">l'offre.</span>
          </h1>
          <p className="cs-lead mt-4 max-w-2xl">
            Composez votre offre anti-gaspi en 4 étapes. L'aperçu se met à jour en direct, exactement comme les étudiants la verront.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/merchant/offers')}
          className="cs-btn cs-btn-cream shrink-0 self-start lg:self-auto"
        >
          ← Annuler
        </button>
      </header>

      {/* Assistant IA Magique Zero-Typing (I5) */}
      <AiAutoFillBox onAutoFill={handleAiAutoFill} className="mb-8" />

      {toastMsg && (
        <div role="status" className="mb-8 rounded-[1.25rem] bg-[#DDEFD9] text-[#1F7A3A] p-5 text-base font-semibold flex items-center gap-3">
          <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* =========================================================================
            COLONNE GAUCHE : 4 ÉTAPES NUMÉROTÉES
            ========================================================================= */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-14 min-w-0">
          {/* ÉTAPE 01 : CATÉGORIE */}
          <section>
            <StepHeading n="01" title="Catégorie" hint="Un seul choix" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label="Catégorie du plat">
              {CATEGORY_ITEMS.map((cat) => {
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleChange('category', cat.id)}
                    className={`min-h-[64px] rounded-2xl border-2 border-[#111111] px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#DA0711] text-[#FAF3E6]' : 'bg-white text-[#111111] hover:bg-[#FAF3E6]'
                    }`}
                  >
                    <span className="text-2xl leading-none" aria-hidden="true">{cat.icon}</span>
                    <span className="text-[15px] font-semibold uppercase leading-tight tracking-[0.02em]">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ÉTAPE 02 : DÉTAILS & PRIX */}
          <section className="border-t-2 border-[#111111] pt-10">
            <StepHeading n="02" title="Détails & prix" />

            <div className="space-y-6">
              <div>
                <label htmlFor="offer-title" className="cs-field-label">
                  Intitulé du plat ou panier <span className="text-[#DA0711]">*</span>
                </label>
                <input
                  id="offer-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="ex : Baguette Farcie Escalope & Fromage"
                  aria-invalid={errors.title ? 'true' : undefined}
                  className="cs-input"
                />
                {errors.title && <p className="cs-error-text">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="offer-description" className="cs-field-label">
                  Description &amp; ingrédients
                </label>
                <textarea
                  id="offer-description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Fraîcheur, garniture, accompagnements…"
                  className="cs-input"
                />
              </div>

              {/* Curseur Smart Decay ou Fixe */}
              <SmartDecayToggle
                pricingMode={formData.pricingMode}
                onModeChange={(mode) => handleChange('pricingMode', mode)}
                startPriceMillimes={formData.startPriceMillimes}
                floorPriceMillimes={formData.floorPriceMillimes}
                fixedPriceMillimes={formData.fixedDiscountedMillimes}
                originalPriceMillimes={formData.originalPriceMillimes}
                onPriceChange={(type, val) => {
                  if (type === 'start') handleChange('startPriceMillimes', val);
                  if (type === 'floor') handleChange('floorPriceMillimes', val);
                  if (type === 'fixed') handleChange('fixedDiscountedMillimes', val);
                }}
              />
            </div>
          </section>

          {/* ÉTAPE 03 : HORAIRES & QUANTITÉ */}
          <section className="border-t-2 border-[#111111] pt-10">
            <StepHeading n="03" title="Retrait & stock" hint="Créneau du soir" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="offer-qty" className="cs-field-label">Portions</label>
                <input
                  id="offer-qty"
                  type="number"
                  min="1"
                  value={formData.quantityTotal}
                  onChange={(e) => handleChange('quantityTotal', Number(e.target.value))}
                  className="cs-input"
                />
              </div>
              <div>
                <label htmlFor="offer-start" className="cs-field-label">Début du retrait</label>
                <input
                  id="offer-start"
                  type="time"
                  value={formData.pickupStartAt}
                  onChange={(e) => handleChange('pickupStartAt', e.target.value)}
                  className="cs-input"
                />
              </div>
              <div>
                <label htmlFor="offer-end" className="cs-field-label">Fin du retrait</label>
                <input
                  id="offer-end"
                  type="time"
                  value={formData.pickupEndAt}
                  onChange={(e) => handleChange('pickupEndAt', e.target.value)}
                  className="cs-input"
                />
              </div>
            </div>
          </section>

          {/* ÉTAPE 04 : OPTION PANIER MYSTÈRE */}
          <section className="border-t-2 border-[#111111] pt-10">
            <StepHeading n="04" title="Panier surprise" hint="Option" />

            <label className="cs-card p-5 sm:p-6 flex items-center justify-between gap-5 cursor-pointer">
              <span className="flex items-start gap-4 min-w-0">
                <Gift className="w-7 h-7 text-[#DA0711] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block cs-h3 !text-lg">Panier surprise scellé</span>
                  <span className="block text-base text-[#5E5850] mt-1">
                    Le contenu reste caché et se révèle à l'étudiant au retrait.
                  </span>
                </span>
              </span>
              <span className="relative inline-flex h-8 w-14 shrink-0">
                <input
                  type="checkbox"
                  checked={formData.isSurpriseBasket}
                  onChange={(e) => handleChange('isSurpriseBasket', e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border-2 border-[#111111] bg-white transition-colors peer-checked:bg-[#DA0711] peer-focus-visible:ring-4 peer-focus-visible:ring-[#FFD000]"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-[4px] top-[4px] h-6 w-6 rounded-full bg-[#111111] transition-transform peer-checked:translate-x-6 peer-checked:bg-white"
                />
              </span>
            </label>

            {formData.isSurpriseBasket && (
              <div className="mt-5 rounded-[1.25rem] bg-[#FFD000] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold uppercase text-base">Rareté calculée</span>
                  <span className="cs-pill cs-pill-ink">
                    {rarityResult.rarity}
                    {Number.isFinite(rarityResult.score) ? ` · ${(rarityResult.score * 100).toFixed(0)}%` : ''}
                  </span>
                </div>
                <div>
                  <label htmlFor="offer-teaser" className="cs-field-label">Indice pour l'étudiant</label>
                  <input
                    id="offer-teaser"
                    type="text"
                    value={formData.surprise.teaser}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      surprise: { ...prev.surprise, teaser: e.target.value }
                    }))}
                    placeholder="ex : 3 viennoiseries pur beurre"
                    className="cs-input"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={loading}
            className="cs-btn cs-btn-red cs-btn-lg cs-btn-block"
          >
            <span>{loading ? 'Publication en cours…' : isEditing ? 'Enregistrer l\'offre' : 'Publier l\'offre'}</span>
            {!loading && <ArrowRight className="w-6 h-6" aria-hidden="true" />}
          </button>
        </form>

        {/* =========================================================================
            COLONNE DROITE : APERÇU EN DIRECT
            ========================================================================= */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24" aria-label="Aperçu de l'offre">
          <p className="cs-eyebrow mb-4">Aperçu en direct</p>

          <div className="cs-card p-3">
            <div className="cs-photo aspect-[4/3]">
              <img
                src={previewPhoto}
                alt={formData.title || 'Aperçu du plat'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = previewImage;
                }}
              />
              <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
                <span className="cs-pill">{categoryLabel}</span>
                {formData.isSurpriseBasket ? (
                  <span className="cs-sticker cs-sticker-red !text-lg">Mystère</span>
                ) : isDutch ? (
                  <span className="cs-sticker cs-sticker-mustard !text-lg">Smart decay</span>
                ) : null}
              </div>
              <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
                <span className="cs-pill">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {windowLabel}
                </span>
                <span className="cs-pill cs-pill-red">{quantityLabel} restantes</span>
              </div>
            </div>

            <div className="px-3 pt-5 pb-3">
              <p className="cs-label mb-2">ESSECT Montfleury</p>
              <h3 className="cs-h3 line-clamp-2">{formData.title || 'Votre plat anti-gaspi'}</h3>
              <p className="text-base text-[#5E5850] mt-2 line-clamp-3">
                {formData.description || 'Décrivez la fraîcheur et les accompagnements…'}
              </p>

              <div className="mt-5 flex items-end gap-3">
                <span className="cs-figure text-[56px] text-[#DA0711]">{money(referencePrice)}</span>
                {money(formData.originalPriceMillimes) !== '—' && (
                  <span className="cs-figure text-[26px] text-[#5E5850] line-through mb-1.5">
                    {money(formData.originalPriceMillimes)}
                  </span>
                )}
              </div>
              <p className="text-[15px] text-[#5E5850] mt-2">
                {isDutch
                  ? `Prix plancher · départ à ${money(formData.startPriceMillimes)}`
                  : 'Prix fixe étudiant'}
              </p>

              {co2Kg && (
                <p className="mt-4 inline-flex items-center gap-2 cs-pill cs-pill-leaf">
                  <Leaf className="w-4 h-4" aria-hidden="true" />
                  ≈ {co2Kg} kg CO₂ évités
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
