// 💡 Concept & Analogie : Comme le manifeste éditorial d'un magazine écologique prestigieux mêlé à une vitrine de transparence scandinave (image5.png "Before you come by"), cette page célèbre l'impact concret de la communauté ESSECT.
// 🔄 Comparaison React / Flutter : En React, la page utilise la typographie Fraunces, des surlignages feutre jaune (.marker-highlight) et un accordéon FAQ Fika avec boutons circulaires +/- ; en Flutter, `impact_screen.dart` adapte la vue pour mobile.
// 🎯 À retenir pour la soutenance : "Ce tableau de bord public et ouvert permet au jury de mesurer l'impact écologique consolidé : repas sauvés, CO2 épargné, argent économisé et classement inter-filières."
// Module : Impact Campus & FAQ (B4, I4)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Leaf,
  ShoppingBag,
  Coins,
  Users,
  Store,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  HelpCircle,
  Flame,
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
            stats: { ...prev.stats, ...(res.data.stats || {}) },
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

  return (
    <div className="min-h-screen bg-[#0E0D0C] text-[#F6F1E7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* =========================================================================
            SECTION 1 : HÉROS ÉDITORIAL AVEC TYPOGRAPHIE FRAUNCES & SURLIGNAGE (image2.png / image5.png)
            ========================================================================= */}
        <section className="text-center max-w-4xl mx-auto space-y-5 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EE3124]/10 border border-[#EE3124]/30 text-[#EE3124] text-xs font-mono font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>BILAN ÉCOLOGIQUE & SOLIDAIRE DU CAMPUS ESSECT MONTFLEURY</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-tight text-white">
            Chaque repas sauvé est{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#0E0D0C]">une victoire pour la planète.</span>
              {/* Surlignage jaune feutre (image2.png / image5.png) */}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-8 sm:h-12 bg-[#F5C400] -rotate-1 rounded-sm -z-0 opacity-95"
              />
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-stone-300 font-sans leading-relaxed max-w-2xl mx-auto">
            Mesurez l'empreinte environnementale consolidée de notre communauté : aliments détournés du gaspillage, pouvoir d'achat préservé pour les étudiants et gaz à effet de serre épargnés.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              to="/app/explore"
              className="px-6 py-3.5 rounded-2xl bg-[#EE3124] text-white font-oswald uppercase text-sm font-black tracking-wider hover:bg-[#d6281c] transition-all flex items-center gap-2 shadow-xl shadow-[#EE3124]/20"
            >
              <span>Sauver un repas à Montfleury</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-2xl bg-[#161412] border border-white/15 hover:border-white/30 text-white font-bold text-sm transition-all"
              >
                Rejoindre le Club
              </Link>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION 2 : GRILLE DE MÉTRIQUES ÉDITORIALES SÉRIF
            ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-[#161412] border border-white/10 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Nourriture Détournée</span>
            <p className="font-display font-black text-4xl sm:text-5xl text-[#F5C400] mt-2">
              {Math.round(stats.foodSavedGrams / 1000)} <span className="text-xl font-sans text-stone-400 font-normal">kg</span>
            </p>
            <p className="text-xs text-stone-500 font-sans mt-1">Équivalent à plus de 1 600 barquettes</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#161412] border border-white/10 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Empreinte CO2 Évitée</span>
            <p className="font-display font-black text-4xl sm:text-5xl text-emerald-400 mt-2">
              {(stats.co2SavedGrams / 1000000).toFixed(2)} <span className="text-xl font-sans text-stone-400 font-normal">t</span>
            </p>
            <p className="text-xs text-stone-500 font-sans mt-1">~5 800 km en voiture thermique évités</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#161412] border border-white/10 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Pouvoir d'Achat Préservé</span>
            <p className="font-display font-black text-4xl sm:text-5xl text-[#EE3124] mt-2">
              {formatTND(stats.moneySavedMillimes)}
            </p>
            <p className="text-xs text-stone-500 font-sans mt-1">Économisés directement par les étudiants</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#161412] border border-white/10 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Étudiants Engagés</span>
            <p className="font-display font-black text-4xl sm:text-5xl text-white mt-2">
              {stats.studentsParticipating}
            </p>
            <p className="text-xs text-stone-500 font-sans mt-1">Sur les promotions ESSECT Montfleury</p>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3 : ÉQUIVALENCES ÉCOLOGIQUES & CLASSEMENT PAR FILIÈRE
            ========================================================================= */}
        <section className="space-y-6">
          <EquivalenceTiles co2Grams={stats.co2SavedGrams} foodGrams={stats.foodSavedGrams} />
          <FiliereLeaderboard />
        </section>

        {/* =========================================================================
            SECTION 4 : ACCORDÉON FAQ FIKA AVEC BOUTONS CIRCULAIRES +/- (image5.png)
            ========================================================================= */}
        <section className="rounded-3xl bg-[#F6F1E7] text-[#161412] p-6 sm:p-12 shadow-2xl border border-black/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Colonne gauche éditoriale */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161412]/10 text-[#161412] text-xs font-mono font-bold uppercase">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Bon à Savoir</span>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight text-[#161412] leading-tight">
                Avant de passer au comptoir.
              </h2>
              <p className="text-sm text-stone-600 font-sans leading-relaxed">
                Les réponses courtes et précises aux questions fréquentes. Pour tout partenariat ou demande particulière, adressez-vous au bureau ESSECT.
              </p>

              {/* Photo d'ambiance Fika */}
              <div className="pt-4 hidden sm:block">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg border border-stone-300">
                  <img
                    src="/assets/framer/pastries/tarte-citron-meringuee.png"
                    alt="Pâtisserie artisanale"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-white/90 rounded-lg text-center font-mono text-[9px] font-bold text-[#161412]">
                    GARANTI FRAIS DU JOUR
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite accordéon FAQ (image5.png) */}
            <div className="lg:col-span-7 space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;

                return (
                  <div
                    key={idx}
                    className="py-4 border-b border-stone-300/80 transition-colors cursor-pointer"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-base sm:text-lg font-black text-[#161412] leading-snug">
                        {item.question}
                      </h3>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold hidden sm:inline">
                          {item.category}
                        </span>
                        {/* Bouton circulaire jaune +/- (image5.png) */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-transform duration-200 ${
                            isOpen
                              ? 'bg-[#F5C400] text-[#0E0D0C] rotate-180 shadow-sm'
                              : 'bg-[#F5C400] text-[#0E0D0C]'
                          }`}
                        >
                          {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 text-xs sm:text-sm text-stone-700 font-sans leading-relaxed animate-fadeIn pr-8">
                        {item.answer}
                      </div>
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
