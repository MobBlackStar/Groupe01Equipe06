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

// Catégorie d'offre → visuel Griddle représentatif (l'aperçu s'adapte à la catégorie et aux mots-clés du plat)
const CATEGORY_IMAGE_BY_TYPE = {
  SANDWICH: '/assets/griddle/food/sandwich-hot-chicken.png',
  PLAT_CHAUD: '/assets/griddle/food/teriyaki-poulet-bowl.webp',
  PIZZA: '/assets/griddle/food/pain-campagne-levain.png',
  PATISSERIE: '/assets/griddle/food/tarte-citron-meringuee.png',
  VIENNOISERIE: '/assets/griddle/food/croissant-beurre.png',
  SALADE: '/assets/griddle/food/burger-veggie-stack.png',
  BOISSON: '/assets/griddle/food/drink-classic-lemonade.png',
  SNACK: '/assets/griddle/food/sides-cheese-fries.png',
  MIXTE: '/assets/griddle/food/box-assortiment-fika.png',
};

function categoryImage(category, title) {
  const t = String(title || '').toLowerCase();
  if (/croissant/.test(t)) return '/assets/griddle/food/croissant-beurre.png';
  if (/pain au chocolat|brioche|cinnamon|viennoiserie/.test(t)) return '/assets/griddle/food/cinnamon-bun.png';
  if (/makloub|chapati|baguette|sandwich|kaskrout|mlewi/.test(t)) return '/assets/griddle/food/sandwich-hot-chicken.png';
  if (/burger|tacos|chawarma|crispy/.test(t)) return '/assets/griddle/food/burger-double-smash.png';
  if (/œuf|oeuf|egg|adham/.test(t)) return '/assets/griddle/food/morning-bun.png';
  if (/salade|salad/.test(t)) return '/assets/griddle/food/burger-veggie-stack.png';
  if (/boisson|jus|soda|caf[eé]|th[eé]|limonade/.test(t)) return '/assets/griddle/food/drink-mango-yuzu.png';
  if (/ojja|lablabi|kafteji|couscous|p[aâ]tes|pasta/.test(t)) return '/assets/griddle/food/riz-saute-crevettes.webp';
  if (category === 'MIXTE' && /brik|sandwich|frite|pizza/.test(t)) {
    return '/assets/griddle/food/hero-double-smash-tray.png';
  }
  return CATEGORY_IMAGE_BY_TYPE[category] || getDistinctGriddleFoodImage('fast-food', title || category || 0);
}
import { Sparkles, Clock, ArrowRight, Gift, Leaf, AlertTriangle } from 'lucide-react';

// Affichage sûr : jamais de NaN / 0,000 DT à l'écran
function money(millimes) {
  const n = Number(millimes);
  return millimes != null && Number.isFinite(n) && n > 0 ? formatTND(n) : '—';
}


// ---------------------------------------------------------------------------------------------
// Fuseau et formats : le créneau de retrait est saisi en heure de Tunis (UTC+1 toute l'année)
// ---------------------------------------------------------------------------------------------
const TUNIS_TZ = 'Africa/Tunis';
const toMs = (v) => (v?._seconds ? v._seconds * 1000 : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() : NaN);
const hhmm = (v) => {
  const ms = toMs(v);
  if (!Number.isFinite(ms)) return '';
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TUNIS_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms);
};
const tunisDay = (ms = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: TUNIS_TZ }).format(ms); // AAAA-MM-JJ
const tunisIso = (day, time) => new Date(`${day}T${time}:00+01:00`).toISOString();

/** Calcule des horaires de retrait par défaut valides (now + 30 min à now + 3h, cadré dans la journée de Tunis) */
function computeDefaultPickupHours() {
  const nowMs = Date.now();
  const startMs = nowMs + 30 * 60 * 1000;
  const endMs = nowMs + 3 * 3600 * 1000;

  let startStr = hhmm(startMs) || '18:30';
  let endStr = hhmm(endMs) || '21:00';

  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);

  // Si on est en fin de soirée après 22h, cadrer proprement
  if (sh >= 23 || eh < sh || (sh === eh && em <= sm)) {
    startStr = '19:00';
    endStr = '21:30';
  } else if (eh >= 23 && em > 55) {
    endStr = '23:55';
  }

  return { pickupStartAt: startStr, pickupEndAt: endStr };
}

/** Message lisible à partir d'une erreur Axios : on affiche la VRAIE raison du serveur, jamais un faux succès. */
function apiErrorMessage(err, fallback) {
  const e = err?.response?.data?.error;
  if (Array.isArray(e?.details) && e.details.length > 0) {
    return `${e.message || 'Données invalides'} : ${e.details.map((d) => `${d.field} — ${d.message}`).join(' ; ')}`;
  }
  if (e?.message) return e.message;
  if (err?.response) return `${fallback} (erreur ${err.response.status})`;
  return "Serveur injoignable : l'offre n'a PAS été enregistrée. Vérifiez que l'API est démarrée.";
}

/** Offre renvoyée par l'API → valeurs du formulaire (mode modification). */
function offerToForm(o, defaults) {
  const pr = o.pricing || {};
  return {
    ...defaults,
    title: o.title ?? '',
    description: o.description ?? '',
    category: o.category || defaults.category,
    originalPriceMillimes: pr.originalPriceMillimes ?? o.originalPriceMillimes ?? 0,
    pricingMode: pr.mode || defaults.pricingMode,
    startPriceMillimes: pr.startPriceMillimes ?? '',
    floorPriceMillimes: pr.floorPriceMillimes ?? '',
    fixedDiscountedMillimes: pr.discountedPriceMillimes ?? o.discountedPriceMillimes ?? '',
    quantityTotal: o.quantityTotal ?? o.quantity ?? 1,
    maxPerOrder: o.maxPerOrder ?? defaults.maxPerOrder,
    weightGramsPerUnit: o.weightGramsPerUnit ?? o.weightGrams ?? defaults.weightGramsPerUnit,
    photoUrl: o.photoUrl || '',
    pickupStartAt: hhmm(o.pickupStartAt) || defaults.pickupStartAt,
    pickupEndAt: hhmm(o.pickupEndAt) || defaults.pickupEndAt,
    isSurpriseBasket: Boolean(o.isSurpriseBasket),
  };
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
  { id: OFFER_CATEGORIES.SALADE, label: 'Salade / Bowl', icon: '🥗' },
  { id: OFFER_CATEGORIES.BOISSON, label: 'Boisson / Café', icon: '🥤' },
  { id: OFFER_CATEGORIES.SNACK, label: 'Snack / Produit frais', icon: '🍟' },
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
    ...computeDefaultPickupHours(),
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
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingOffer, setLoadingOffer] = useState(isEditing);
  const [initialForm, setInitialForm] = useState(null); // valeurs chargées : sert à n'envoyer que ce qui change
  const [initialOffer, setInitialOffer] = useState(null);

  // Mode modification : on charge la VRAIE offre (sinon le formulaire affichait des valeurs de démonstration
  // qui auraient écrasé l'offre au moment d'enregistrer).
  useEffect(() => {
    if (!isEditing) return undefined;
    let alive = true;
    setLoadingOffer(true);
    apiClient
      .get(ENDPOINTS.OFFER_BY_ID(id))
      .then((res) => {
        if (!alive) return;
        const o = res.data?.offer || res.data;
        setFormData((prev) => {
          const next = offerToForm(o, prev);
          setInitialForm(next);
          return next;
        });
        setInitialOffer(o);
      })
      .catch((err) => {
        if (alive) setErrorMsg(apiErrorMessage(err, "Impossible de charger cette offre"));
      })
      .finally(() => {
        if (alive) setLoadingOffer(false);
      });
    return () => {
      alive = false;
    };
  }, [id, isEditing]);

  const impact = calculateImpact(
    (Number(formData.weightGramsPerUnit) || 350) * (Number(formData.quantityTotal) || 1)
  );

  const referencePrice =
    formData.pricingMode === PRICING_MODES.DUTCH_AUCTION
      ? Number(formData.floorPriceMillimes) || 3800
      : Number(formData.fixedDiscountedMillimes) || 4200;

  const originalPrice = Number(formData.originalPriceMillimes) || 7500;
  const rarityResult = computeRarity(originalPrice, referencePrice, 4.8);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Photo de l'offre : téléversement réel (POST /uploads/image, 5 Mo max, JPEG/PNG/WEBP) ; l'URL renvoyée est enregistrée avec l'offre
  async function handlePhotoPick(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Format non supporté : utilisez JPEG, PNG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image trop lourde (5 Mo maximum).');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await apiClient.post(ENDPOINTS.UPLOAD_IMAGE, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) handleChange('photoUrl', res.data.url);
    } catch (err) {
      setUploadError(err?.response?.data?.error?.message || 'Téléversement impossible : réessayez.');
    } finally {
      setUploading(false);
    }
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function parseAiTime(value, fallback) {
    if (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim())) {
      return value.trim();
    }
    const formatted = hhmm(value);
    return formatted || fallback;
  }

  function handleAiAutoFill(aiData) {
    setFormData((prev) => {
      const orig = Math.max(500, Math.round(Number(aiData.originalPriceMillimes) || prev.originalPriceMillimes || 7000));
      const rawDisc = Number(aiData.discountedPriceMillimes ?? aiData.fixedDiscountedMillimes);
      const disc = Number.isFinite(rawDisc) && rawDisc >= 100
        ? Math.min(orig - 100, Math.round(rawDisc))
        : Math.max(100, Math.round(orig * 0.6));

      const rawFloor = Number(aiData.floorPriceMillimes);
      const floorP = Number.isFinite(rawFloor) && rawFloor >= 100
        ? Math.min(orig - 100, Math.round(rawFloor))
        : disc;

      const rawStart = Number(aiData.startPriceMillimes);
      const startP = Number.isFinite(rawStart) && rawStart > floorP
        ? Math.min(orig, Math.round(rawStart))
        : Math.max(floorP + 100, Math.min(orig, Math.round((orig * 0.8) / 100) * 100));

      const endFromClock =
        aiData.closingHour != null
          ? `${String(Math.min(23, Math.max(0, Number(aiData.closingHour)))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, Number(aiData.closingMinute) || 0))).padStart(2, '0')}`
          : null;
      const nextEnd = parseAiTime(aiData.suggestedPickupEndAt, endFromClock || prev.pickupEndAt);
      const [eh, em] = nextEnd.split(':').map(Number);
      const defaultStartMins = Math.max(0, eh * 60 + em - 120);
      const computedStart = `${String(Math.floor(defaultStartMins / 60)).padStart(2, '0')}:${String(defaultStartMins % 60).padStart(2, '0')}`;
      const nextStart = parseAiTime(aiData.suggestedPickupStartAt, computedStart);

      const nextPrivateContents =
        aiData.surpriseContents ||
        (Array.isArray(aiData.surpriseItems) && aiData.surpriseItems.length > 0
          ? aiData.surpriseItems.map((it) => `${it.quantity}x ${it.name}`).join(' + ')
          : aiData.surprise?.teaser || prev.surprise.privateContents);

      return {
        ...prev,
        title: aiData.title || prev.title,
        description: aiData.description || prev.description,
        category: OFFER_CATEGORIES[aiData.category] ? aiData.category : (aiData.category || prev.category),
        pricingMode: PRICING_MODES[aiData.pricingMode] ? aiData.pricingMode : prev.pricingMode,
        originalPriceMillimes: orig,
        startPriceMillimes: startP,
        floorPriceMillimes: floorP,
        fixedDiscountedMillimes: disc,
        quantityTotal: Math.min(50, Math.max(1, Math.round(Number(aiData.quantityTotal) || prev.quantityTotal))),
        weightGramsPerUnit: Math.round(Number(aiData.weightGramsPerUnit) || prev.weightGramsPerUnit),
        pickupStartAt: nextStart,
        pickupEndAt: nextEnd,
        isSurpriseBasket: typeof aiData.isSurpriseBasket === 'boolean' ? aiData.isSurpriseBasket : prev.isSurpriseBasket,
        surprise: {
          ...prev.surprise,
          teaser: aiData.surprise?.teaser || prev.surprise.teaser,
          itemCountHint: aiData.surprise?.itemCountHint || aiData.quantityTotal || prev.surprise.itemCountHint,
          privateContents: nextPrivateContents,
        },
      };
    });

    setErrors({});
    setErrorMsg(null);
    setToastMsg('✨ L’assistant IA a rempli tous les champs, prix et horaires de votre offre !');
  }

  /** Contrôles côté client (le serveur re-valide tout) : on renvoie la liste des problèmes à corriger. */
  function validateForm(f) {
    const problems = [];
    const orig = Number(f.originalPriceMillimes);
    const qty = Number(f.quantityTotal);
    if (!f.title.trim() || f.title.trim().length < 2) problems.push("le titre est obligatoire (2 caractères minimum)");
    if (!Number.isInteger(orig) || orig <= 0) problems.push("le prix d'origine doit être un entier positif (en millimes)");
    if (f.pricingMode === PRICING_MODES.FIXED) {
      const disc = Number(f.fixedDiscountedMillimes);
      if (!Number.isInteger(disc) || disc < 0 || disc >= orig) problems.push("le prix réduit doit être strictement inférieur au prix d'origine");
    } else {
      const start = Number(f.startPriceMillimes);
      const floor = Number(f.floorPriceMillimes);
      if (!Number.isInteger(start) || start <= 0 || !Number.isInteger(floor) || floor < 0 || floor >= start) {
        problems.push("Smart Decay : le prix plancher doit être strictement inférieur au prix de départ");
      }
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) problems.push('la quantité doit être comprise entre 1 et 50');
    const [sh, sm] = String(f.pickupStartAt).split(':').map(Number);
    const [eh, em] = String(f.pickupEndAt).split(':').map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (!Number.isFinite(mins) || mins <= 0) problems.push("l'heure de fin de retrait doit être postérieure à l'heure de début");
    else if (mins > 360) problems.push('le créneau de retrait ne peut pas dépasser 6 heures');
    return problems;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setToastMsg(null);
    setErrorMsg(null);

    const problems = validateForm(formData);
    if (problems.length > 0) {
      if (!formData.title.trim()) setErrors((prev) => ({ ...prev, title: "Le titre de l'offre est obligatoire" }));
      setErrorMsg(`À corriger : ${problems.join(' · ')}.`);
      return;
    }

    setLoading(true);
    try {
      // En modification on garde le jour d'origine de l'offre ; à la création, c'est aujourd'hui (heure de Tunis)
      const day = tunisDay(isEditing && initialOffer ? toMs(initialOffer.pickupStartAt) : Date.now());
      const pickupStartIso = tunisIso(day, formData.pickupStartAt);
      const pickupEndIso = tunisIso(day, formData.pickupEndAt);
      const isDutchMode = formData.pricingMode === PRICING_MODES.DUTCH_AUCTION;

      // Contrat de l'API (createOfferSchema) : prix DANS `pricing`, `quantity`, `surpriseContents`
      const pricing = isDutchMode
        ? {
            mode: PRICING_MODES.DUTCH_AUCTION,
            originalPriceMillimes: Number(formData.originalPriceMillimes),
            startPriceMillimes: Number(formData.startPriceMillimes),
            floorPriceMillimes: Number(formData.floorPriceMillimes),
            decayStartAt: pickupStartIso,
            roundingStepMillimes: 100,
          }
        : {
            mode: PRICING_MODES.FIXED,
            originalPriceMillimes: Number(formData.originalPriceMillimes),
            discountedPriceMillimes: Number(formData.fixedDiscountedMillimes),
            roundingStepMillimes: 100,
          };

      if (isEditing) {
        // PATCH partiel : seulement ce qui a changé (le prix est verrouillé dès qu'une réservation existe, INV-15)
        const changed = (k) => String(formData[k]) !== String(initialForm?.[k]);
        const body = {};
        if (changed('title')) body.title = formData.title.trim();
        if (changed('description')) body.description = formData.description;
        if (changed('category')) body.category = formData.category;
        if (changed('photoUrl') && formData.photoUrl) body.photoUrl = formData.photoUrl;
        if (changed('quantityTotal')) body.quantity = Number(formData.quantityTotal);
        if (changed('pickupStartAt') || changed('pickupEndAt')) {
          body.pickupStartAt = pickupStartIso;
          body.pickupEndAt = pickupEndIso;
        }
        if (['originalPriceMillimes', 'pricingMode', 'startPriceMillimes', 'floorPriceMillimes', 'fixedDiscountedMillimes'].some(changed)) {
          body.pricing = pricing;
        }
        if (Object.keys(body).length === 0) {
          setToastMsg('Aucune modification à enregistrer.');
          return;
        }
        await apiClient.patch(ENDPOINTS.OFFER_BY_ID(id), body);
        setToastMsg("✅ Offre mise à jour. Les étudiants voient déjà la nouvelle version.");
      } else {
        const payload = {
          title: formData.title.trim(),
          description: formData.description,
          category: formData.category,
          pricing,
          quantity: Number(formData.quantityTotal),
          pickupStartAt: pickupStartIso,
          pickupEndAt: pickupEndIso,
          isSurpriseBasket: formData.isSurpriseBasket,
          ...(formData.isSurpriseBasket ? { surpriseContents: formData.surprise.privateContents } : {}),
          ...(formData.photoUrl ? { photoUrl: formData.photoUrl } : {}),
        };
        await apiClient.post(ENDPOINTS.OFFERS, payload);
        setToastMsg("✅ Offre publiée sur le catalogue de l'ESSECT !");
      }
      setTimeout(() => navigate('/merchant/offers'), 900);
    } catch (err) {
      // Jamais de faux succès : on affiche la vraie raison et on reste sur le formulaire
      console.warn("Enregistrement de l'offre refusé :", err?.response?.data || err.message);
      setErrorMsg(apiErrorMessage(err, "L'offre n'a pas pu être enregistrée"));
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
    <div className="cs-container pt-10 sm:pt-12 lg:pt-14 pb-16 sm:pb-24">
      {/* En-tête avec marge haute généreuse sous la Navbar sticky */}
      <header className="mb-10 lg:mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
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

      {errorMsg && (
        <div role="alert" className="mb-8 rounded-[1.25rem] bg-[#DA0711] text-white p-5 text-base font-semibold flex items-start gap-3 border-2 border-[#111111]">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

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
              <div className="flex flex-wrap items-center gap-4">
                <label className="cs-btn cs-btn-cream cs-btn-sm cursor-pointer">
                  <span aria-hidden="true">📷</span>
                  <span>{uploading ? 'Envoi en cours…' : formData.photoUrl ? 'Changer la photo' : 'Ajouter une photo'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoPick} disabled={uploading} />
                </label>
                {formData.photoUrl && (
                  <button type="button" onClick={() => handleChange('photoUrl', '')} className="cs-link text-base">Retirer la photo</button>
                )}
                {uploadError && <p role="alert" className="text-base text-[#DA0711]">{uploadError}</p>}
              </div>

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
                  if (type === 'original') handleChange('originalPriceMillimes', val);
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
            disabled={loading || loadingOffer}
            className="cs-btn cs-btn-red cs-btn-lg cs-btn-block"
          >
            <span>{loading ? 'Enregistrement en cours…' : loadingOffer ? "Chargement de l'offre…" : isEditing ? 'Enregistrer l\'offre' : 'Publier l\'offre'}</span>
            {!loading && <ArrowRight className="w-6 h-6" aria-hidden="true" />}
          </button>
        </form>

        {/* =========================================================================
            COLONNE DROITE : APERÇU EN DIRECT
            ========================================================================= */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28" aria-label="Aperçu de l'offre">
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
