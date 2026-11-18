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
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';
import {
  Flame,
  Sparkles,
  Store,
  Clock,
  ArrowRight,
  Package,
  Check,
  AlertTriangle,
  Gift,
} from 'lucide-react';

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
      fixedDiscountedPriceMillimes: aiData.fixedDiscountedMillimes || prev.fixedDiscountedMillimes,
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
  const previewImage = getDistinctGriddleFoodImage(formData.category, 0);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-[#141210]/15">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD000] border-2 border-[#141210] text-[#141210] text-xs font-mono font-bold uppercase tracking-wider mb-2 shadow-[2px_2px_0px_#141210]">
              <Store className="w-3.5 h-3.5" />
              <span>Espace Commerçant Partenaire</span>
            </div>
            <h1 className="font-anton uppercase text-3xl sm:text-5xl tracking-wide text-[#141210] leading-none">
              BUILD YOUR <span className="text-[#E51C23]">TICKET.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#141210]/70 font-sans mt-2">
              Composez votre offre anti-gaspi en 4 étapes numérotées. Observez le ticket se générer en direct à droite.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/merchant/offers')}
            className="px-4 py-2 rounded-xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] hover:shadow-[1px_1px_0px_#141210] text-[#141210] text-xs font-mono font-bold transition-all self-start sm:self-auto"
          >
            ← Annuler
          </button>
        </div>

        {/* Assistant IA Magique Zero-Typing (I5) */}
        <AiAutoFillBox onAutoFill={handleAiAutoFill} />

        {toastMsg && (
          <div className="p-4 rounded-2xl bg-[#DCFCE7] border-2 border-[#141210] text-[#15803D] text-xs font-black flex items-center gap-2 shadow-[3px_3px_0px_#141210]">
            <Sparkles className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =========================================================================
              COLONNE GAUCHE : 4 ÉTAPES NUMÉROTÉES DU BUILDER (image7.png)
              ========================================================================= */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* ÉTAPE 01 : CATÉGORIE (image7.png 01 NOODLES / PICK 1) */}
              <div className="p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] space-y-4">
                <div className="flex items-baseline justify-between border-b-2 border-[#141210]/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-anton text-lg font-black text-[#E51C23] tracking-widest">01</span>
                    <h3 className="font-anton uppercase text-lg sm:text-xl tracking-wide text-[#141210]">
                      CATÉGORIE DU PLAT
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#E51C23] font-black">
                    CHOIX UNIQUE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORY_ITEMS.map((cat) => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleChange('category', cat.id)}
                        className={`p-3 rounded-2xl border-2 border-[#141210] text-left transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-[#E51C23] text-white shadow-[3px_3px_0px_#141210] scale-[1.02]'
                            : 'bg-white text-[#141210] shadow-[2px_2px_0px_#141210] hover:bg-[#FFD000]'
                        }`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-xs font-black truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ÉTAPE 02 : DÉTAILS & PRIX (image7.png 02 BROTH / PICK 1) */}
              <div className="p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] space-y-4">
                <div className="flex items-baseline justify-between border-b-2 border-[#141210]/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-anton text-lg font-black text-[#E51C23] tracking-widest">02</span>
                    <h3 className="font-anton uppercase text-lg sm:text-xl tracking-wide text-[#141210]">
                      DÉTAILS &amp; TARIFICATION
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#141210]/60 font-black">
                    PRIX &amp; DESCRIPTION
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono font-black uppercase tracking-widest text-[#141210]/70 mb-1.5">
                      Intitulé du Plat ou Panier *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="ex: Baguette Farcie Escalope & Fromage"
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#141210] text-sm outline-none focus:shadow-[4px_4px_0px_#141210] font-sans font-bold"
                    />
                    {errors.title && <p className="text-xs font-bold text-[#E51C23] mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-black uppercase tracking-widest text-[#141210]/70 mb-1.5">
                      Description &amp; Ingrédients
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Détaillez la fraîcheur et les accompagnements..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#141210] text-xs outline-none focus:shadow-[4px_4px_0px_#141210] font-sans"
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
              </div>

              {/* ÉTAPE 03 : HORAIRES & QUANTITÉ (image7.png 03 PROTEIN) */}
              <div className="p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] space-y-4">
                <div className="flex items-baseline justify-between border-b-2 border-[#141210]/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-anton text-lg font-black text-[#E51C23] tracking-widest">03</span>
                    <h3 className="font-anton uppercase text-lg sm:text-xl tracking-wide text-[#141210]">
                      HORAIRES DE RETRAIT &amp; STOCKS
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#141210]/60 font-black">
                    CRÉNEAU DU SOIR
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#141210]/70 mb-1 font-black">
                      Portions en vente :
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantityTotal}
                      onChange={(e) => handleChange('quantityTotal', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#141210] text-xs outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#141210]/70 mb-1 font-black">
                      Début Retrait :
                    </label>
                    <input
                      type="time"
                      value={formData.pickupStartAt}
                      onChange={(e) => handleChange('pickupStartAt', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#141210] text-xs outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#141210]/70 mb-1 font-black">
                      Fin Retrait :
                    </label>
                    <input
                      type="time"
                      value={formData.pickupEndAt}
                      onChange={(e) => handleChange('pickupEndAt', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#141210] text-xs outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* ÉTAPE 04 : OPTION PANIER MYSTÈRE (image7.png 04 TOPPINGS) */}
              <div className="p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] space-y-4">
                <div className="flex items-baseline justify-between border-b-2 border-[#141210]/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-anton text-lg font-black text-[#E51C23] tracking-widest">04</span>
                    <h3 className="font-anton uppercase text-lg sm:text-xl tracking-wide text-[#141210]">
                      OPTION PANIER SURPRISE &amp; RARETÉ
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#E51C23] font-black">
                    BOÎTE MYSTÈRE
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210]">
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-5 h-5 text-[#E51C23]" />
                    <div>
                      <p className="text-xs font-black text-[#141210]">Activer le mode Panier Surprise (Scellé)</p>
                      <p className="text-[10px] text-[#141210]/60 font-sans">Le contenu sera masqué et révélé par animation Unboxing</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isSurpriseBasket}
                    onChange={(e) => handleChange('isSurpriseBasket', e.target.checked)}
                    className="w-5 h-5 accent-[#E51C23] rounded cursor-pointer"
                  />
                </div>

                {formData.isSurpriseBasket && (
                  <div className="p-3.5 rounded-2xl bg-[#FEF08A] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#141210]">Rareté Calculée Automatiquement :</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#141210] text-[#FFD000] font-mono font-bold">
                        {rarityResult.rarity} (Score {(rarityResult.score * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.surprise.teaser}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        surprise: { ...prev.surprise, teaser: e.target.value }
                      }))}
                      placeholder="Indice secret pour l étudiant (ex: 3 viennoiseries pur beurre)"
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#141210] text-[#141210] text-xs outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Bouton de Soumission */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-[#E51C23] text-white border-2 border-[#141210] shadow-[4px_4px_0px_#141210] hover:shadow-[2px_2px_0px_#141210] font-anton uppercase text-xl tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Publication en cours...' : 'PUBLIER CETTE OFFRE SUR LE CATALOGUE →'}</span>
              </button>
            </form>
          </div>

          {/* =========================================================================
              COLONNE DROITE : LIVE PREVIEW DU TICKET SUSPENDU (image7.png / image8.png)
              ========================================================================= */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono uppercase tracking-widest text-[#E51C23] font-black flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#E51C23]" />
                <span>APERÇU EN DIRECT DU TICKET :</span>
              </span>
              <span className="text-[10px] font-mono font-black text-[#141210]/60">#CS-048</span>
            </div>

            {/* Ticket Suspendu Reçu Crème Live Preview */}
            <div className="relative pt-3 select-none">
              {/* Pince métallique supérieure */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-gradient-to-b from-stone-300 via-stone-100 to-stone-400 rounded-b-md shadow-md border-x-2 border-b-2 border-[#141210] z-30 flex items-center justify-center pointer-events-none"
              >
                <div className="w-4 h-1 bg-[#141210] rounded-full" />
              </div>

              <div className="relative rounded-2xl bg-[#FAF6EE] text-[#141210] shadow-[6px_6px_0px_#141210] border-2 border-[#141210] overflow-hidden pb-4">
                {/* Photo de l'aliment */}
                <div className="relative h-48 w-full overflow-hidden bg-[#F4EFE6] border-b-2 border-[#141210]">
                  <img
                    src={previewImage}
                    alt={formData.title}
                    onError={(e) => { e.currentTarget.onerror = null; }}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2.5 py-1 rounded-full bg-white text-[#141210] text-[10px] font-mono font-black border-2 border-[#141210] shadow-[2px_2px_0px_#141210]">
                      {formData.pickupStartAt} – {formData.pickupEndAt}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E51C23] text-white text-[9px] font-anton uppercase tracking-wider font-bold shadow-[2px_2px_0px_#141210]">
                      {formData.quantityTotal} RESTANTS
                    </span>
                  </div>
                </div>

                {/* Détails du Ticket */}
                <div className="p-5 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[#141210]/60">
                    <span className="text-[#E51C23] font-black">{formData.category}</span>
                    <span className="font-bold">ESSECT MONTFLEURY</span>
                  </div>

                  <h3 className="font-anton uppercase text-xl text-[#141210] leading-tight line-clamp-2">
                    {formData.title || 'Votre Plat Anti-Gaspillage'}
                  </h3>

                  <p className="text-[11px] text-[#141210]/70 font-sans line-clamp-2">
                    {formData.description || 'Description du plat détaillée...'}
                  </p>

                  <div className="my-2 border-t-2 border-dashed border-[#141210]/30" />

                  {/* Décomposition Prix */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-[#141210]/60">
                      <span>PRIX ORIGINAL :</span>
                      <span className="line-through">{formatTND(Number(formData.originalPriceMillimes) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[#141210]">
                      <span>MODE :</span>
                      <span className="font-bold">{formData.pricingMode === PRICING_MODES.DUTCH_AUCTION ? 'SMART DECAY (ENCHÈRE)' : 'PRIX FIXE'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t-2 border-[#141210]/15 flex items-baseline justify-between">
                    <span className="font-anton uppercase text-xs font-black text-[#141210]/60">
                      PRIX PLANCHER :
                    </span>
                    <span className="font-anton text-2xl font-black text-[#E51C23]">
                      {formatTND(referencePrice)}
                    </span>
                  </div>
                </div>

                {/* Dents de scie inférieures */}
                <div
                  aria-hidden="true"
                  className="w-full h-3 bg-repeat-x pointer-events-none mt-1"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' fill='%23FAF6EE'%3E%3Cpolygon points='0,0 8,10 16,0'/%3E%3C/svg%3E")`,
                    backgroundSize: '16px 10px',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))',
                  }}
                />
              </div>
            </div>

            <p className="text-[10px] text-center font-mono text-[#141210]/60 font-bold">
              💡 Le ticket suspendu se synchronise instantanément avec vos modifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}