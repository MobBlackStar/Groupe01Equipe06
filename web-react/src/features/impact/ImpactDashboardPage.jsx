// 💡 Concept & Analogie : Comme le manifeste éditorial d'un magazine écologique prestigieux mêlé à une vitrine de transparence scandinave (image5.png "Before you come by"), cette page célèbre l'impact concret de la communauté ESSECT.
// 🔄 Comparaison React / Flutter : En React, la page utilise la typographie Anton, des surlignages feutre jaune (#FFD000) et un accordéon FAQ Fika avec boutons circulaires +/- ; en Flutter, `impact_screen.dart` adapte la vue pour mobile.
// 🎯 À retenir pour la soutenance : "Ce tableau de bord public et ouvert permet au jury de mesurer l'impact écologique consolidé : repas sauvés, CO2 épargné, argent économisé et classement inter-filières."
// Module : Impact Campus & FAQ (B4, I4)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  ArrowRight,
  Plus,
  Minus,
  HelpCircle,
} from 'lucide-react';
import EquivalenceTiles from './EquivalenceTiles.jsx';
import FiliereLeaderboard from './FiliereLeaderboard.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { useAuth } from '../../context/AuthContext.jsx';

const DEMO_GLOBAL_IMPACT = {
  stats: {
    ordersCompleted: 1420,
    mealsRescued: 1680,
    foodSavedGrams: 580000, // 580 kg
    co2SavedGrams: 1450000, // 1.45 t
    moneySavedMillimes: 5240000, // 5,240.000 DT
    studentsParticipating: 620,
    merchantsParticipating: 18,
  },
};

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne l'enchère inversée Smart Decay ?",
    category: "PRIX",
    answer: "À l'approche de la fermeture du commerce, le prix de l'offre baisse automatiquement chaque minute selon un algorithme dégressif strict. L'étudiant qui réserve verrouille son prix à la seconde exacte du clic pendant 10 minutes pour procéder au règlement.",
  },
  {
    question: "Comment le commerçant valide-t-il mon retrait au comptoir ?",
    category: "TICKETS",
    answer: "Chaque commande payée génère un Living Ticket avec QR code HMAC rotatif toutes les 30 secondes. Le commerçant scanne le QR code avec la caméra de son téléphone ou saisit le code PIN à 6 chiffres de secours.",
  },
  {
    question: "Qu'est-ce qui se cache dans les Paniers Mystères ?",
    category: "SURPRISE",
    answer: "Les paniers surprises réunissent un assortiment frais cuisiné le jour même (viennoiseries, plats chauds, salades) dont la valeur réelle dépasse largement le prix payé. Le contenu secret est dévoilé lors de l'animation tactile d'Unboxing !",
  },
  {
    question: "Comment sont calculés les EcoPoints et le classement par filière ?",
    category: "FIDÉLITÉ",
    answer: "Chaque repas sauvé rapporte 20 EcoPoints au compte étudiant et alimente simultanément le score écologique global de sa promotion (3A E-Business, Finance, Marketing, Gestion, Comptabilité). Tous les 100 points, un coupon de -20% est débloqué.",
  },
  {
    question: "Que se passe-t-il si j'annule ou si je ne récupère pas mon repas ?",
    category: "RÈGLES",
    answer: "Une réservation non payée dans les 10 minutes est immédiatement remise en vente dans le catalogue public pour d'autres étudiants. Aucun débit bancaire n'est effectué avant la validation Konnect.",
  },
];

export default function ImpactDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(DEMO_GLOBAL_IMPACT);
  const [loading, setLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchImpact() {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINTS.IMPACT_GLOBAL);
        if (isMounted && res.data) {
          setData((prev) => ({
            ...prev,
            ...res.data,
            // L'API publique renvoie { global, equivalences, dailySeries } ; `stats` reste accepté par compatibilité
            stats: { ...prev.stats, ...(res.data.global || res.data.stats || {}) },
          }));
        }
      } catch (err) {
        console.warn('API Impact hors-ligne, données démo ESSECT actives :', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchImpact();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = data.stats || DEMO_GLOBAL_IMPACT.stats;

  // Gardes d'affichage : jamais de NaN / undefined à l'écran
  const num = (v) => {
    const n = Number(v);
    return v === null || v === undefined || v === '' || !Number.isFinite(n) ? null : n;
  };
  const fr = (n, digits = 0) =>
    n === null ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const foodG = num(stats.foodSavedGrams);
  const co2G = num(stats.co2SavedGrams);
  const meals = num(stats.mealsRescued ?? stats.ordersCompleted);
  const money = num(stats.moneySavedMillimes);
  const students = num(stats.studentsParticipating);
  const merchants = num(stats.merchantsParticipating);

  const foodKg = fr(foodG === null ? null : Math.round(foodG / 1000));
  const co2T = fr(co2G === null ? null : co2G / 1000000, 2);
  const mealsLabel = fr(meals);
  const moneyLabel = money === null ? '—' : formatTND(money);

  const tickerItems = [
    `${foodKg} kg de nourriture sauvés`,
    `${co2T} t de CO₂ évitées`,
    `${mealsLabel} repas sauvés`,
    `${moneyLabel} rendus aux étudiants`,
    `${fr(students)} étudiants engagés`,
    `${fr(merchants)} commerces partenaires`,
  ];

  const bigFigures = [
    { label: 'Nourriture sauvée', value: foodKg, unit: 'kg', color: 'text-[#DA0711]', note: 'Détournés de la poubelle à Montfleury' },
    { label: 'CO₂ évité', value: co2T, unit: 't', color: 'text-[#111111]', note: 'Ratio officiel FAO : 2,5 kg CO₂e / kg' },
    { label: 'Repas sauvés', value: mealsLabel, unit: '', color: 'text-[#111111]', note: 'Paniers et plats récupérés au comptoir' },
  ];

  return (
    <div className="bg-[#FAF3E6] text-[#111111] min-h-screen overflow-x-hidden">
      {/* =========================================================================
          SECTION 1 : HÉROS ÉDITORIAL
          ========================================================================= */}
      <div className="cs-container cs-page !pb-12">
        <header className="max-w-5xl">
          <p className="cs-eyebrow mb-4 inline-flex items-center gap-2">
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span>Bilan écologique &amp; solidaire · ESSECT Montfleury</span>
          </p>
          <h1 className="cs-display">
            Chaque repas sauvé est <span className="cs-highlight">une victoire</span> pour la planète.
          </h1>
          <p className="cs-lead mt-6 max-w-3xl">
            L'empreinte consolidée de notre communauté : aliments détournés du gaspillage, pouvoir d'achat
            préservé pour les étudiants et gaz à effet de serre épargnés.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link to="/app/explore" className="cs-btn cs-btn-red cs-btn-lg">
              <span>Sauver un repas</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            {!user && (
              <Link to="/register" className="cs-btn cs-btn-cream cs-btn-lg">
                Rejoindre le club
              </Link>
            )}
          </div>
        </header>

        {/* =========================================================================
            SECTION 2 : CHIFFRES MONUMENTAUX
            ========================================================================= */}
        <section className="mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8" aria-label="Chiffres clés">
          {bigFigures.map((fig, i) => (
            <div
              key={fig.label}
              className="cs-fade-up border-t-2 border-[#111111] pt-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="cs-label">{fig.label}</p>
              <p className={`cs-figure mt-3 text-[clamp(5.5rem,13vw,11rem)] leading-[0.82] ${fig.color}`}>
                {fig.value}
                {fig.unit && fig.value !== '—' && (
                  <span className="text-[0.38em] ml-2 text-[#5E5850]">{fig.unit}</span>
                )}
              </p>
              <p className="text-lg text-[#5E5850] mt-3">{fig.note}</p>
            </div>
          ))}
        </section>
      </div>

      {/* =========================================================================
          RUBAN TICKER ROUGE PLEINE LARGEUR
          ========================================================================= */}
      <div className="cs-ticker my-6">
        <div className="cs-ticker-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="cs-ticker-item" aria-hidden={copy === 1 ? 'true' : undefined}>
              {tickerItems.map((item) => (
                <React.Fragment key={item}>
                  <span>{item}</span>
                  <span className="cs-ticker-star">★</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="cs-container pb-[clamp(3rem,6vw,6rem)]">
        {/* Tuiles secondaires */}
        <section className="mt-16 mb-20 grid grid-cols-1 sm:grid-cols-3 gap-6" aria-label="Communauté">
          <div className="cs-stat">
            <span className="cs-label">Pouvoir d'achat préservé</span>
            <span className="cs-stat-value text-[#DA0711]">{moneyLabel}</span>
            <span className="text-base text-[#5E5850]">Économisés directement par les étudiants</span>
          </div>
          <div className="cs-stat">
            <span className="cs-label">Étudiants engagés</span>
            <span className="cs-stat-value">{fr(students)}</span>
            <span className="text-base text-[#5E5850]">Sur les promotions ESSECT Montfleury</span>
          </div>
          <div className="cs-stat">
            <span className="cs-label">Commerces partenaires</span>
            <span className="cs-stat-value">{fr(merchants)}</span>
            <span className="text-base text-[#5E5850]">Boulangeries, cafétérias et restaurants</span>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3 : ÉQUIVALENCES ÉCOLOGIQUES
            ========================================================================= */}
        <section className="mb-20 lg:mb-24">
          <div className="mb-8">
            <h2 className="cs-title">Concrètement, ça donne quoi ?</h2>
            <p className="cs-body mt-3 text-[#5E5850] max-w-2xl">
              Nos chiffres traduits en gestes du quotidien, sur la base des standards FAO et US EPA.
            </p>
          </div>
          <EquivalenceTiles co2SavedGrams={stats.co2SavedGrams} foodSavedGrams={stats.foodSavedGrams} />
        </section>

        {/* =========================================================================
            SECTION 4 : CLASSEMENT PAR FILIÈRE
            ========================================================================= */}
        <section className="mb-20 lg:mb-24">
          <FiliereLeaderboard />
        </section>

        {/* =========================================================================
            SECTION 5 : ACCORDÉON FAQ
            ========================================================================= */}
        <section className="cs-card-ink p-7 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Colonne gauche éditoriale */}
            <div className="lg:col-span-5">
              <span className="cs-pill cs-pill-mustard">
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                <span>Bon à savoir</span>
              </span>
              <h2 className="cs-display !text-[#FAF3E6] mt-5 !text-[clamp(3rem,5.5vw,5rem)]">
                Avant de passer au comptoir.
              </h2>
              <p className="text-lg text-[#FAF3E6]/80 mt-4 leading-relaxed">
                Les réponses courtes aux questions fréquentes. Pour tout partenariat, adressez-vous au bureau ESSECT.
              </p>
            </div>

            {/* Colonne droite accordéon FAQ */}
            <div className="lg:col-span-7">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;

                return (
                  <div key={idx} className="border-b-2 border-[#FAF3E6]/15 last:border-b-0">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                    >
                      <span className="min-w-0">
                        <span className="cs-label !text-[#FFD000] block mb-1">{item.category}</span>
                        <span className="block font-sans font-semibold uppercase text-lg sm:text-xl leading-snug text-[#FAF3E6]">
                          {item.question}
                        </span>
                      </span>
                      <span
                        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                          isOpen ? 'bg-[#DA0711] text-[#FAF3E6]' : 'bg-[#FFD000] text-[#111111]'
                        }`}
                        aria-hidden="true"
                      >
                        {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </span>
                    </button>

                    {isOpen && (
                      <p className="pb-6 pr-2 sm:pr-14 text-base sm:text-lg leading-relaxed text-[#FAF3E6]/85 animate-fadeIn">
                        {item.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
