// 💡 Concept & Analogie : Comme l'ouverture d'une élégante boîte à pâtisseries rayée artisanale avec son couvercle rabattable en carton et son tapissage intérieur rayé révélant les mets cachés.
// 🔄 Comparaison React / Flutter : En React, l'animation combine Framer Motion et des cutouts transparents Griddle ; en Flutter, `unboxing_overlay.dart` gère la révélation avec retour haptique.
// 🎯 À retenir pour la soutenance : "L'unboxing tactile gamifie la récupération du panier surprise en matérialisant l'ouverture de la boîte et l'attribution des EcoPoints bonus."
// Module : Surprise Basket (B2, I3)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SURPRISE_RARITY } from '@shared/constants.js';
import { Sparkles, Award } from 'lucide-react';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';

const DEFAULT_REVEAL = {
  rarity: SURPRISE_RARITY.RARE,
  items: [
    { name: 'Croissants pur beurre dorés', qty: 2, image: '/assets/griddle/food/croissant-amande.png' },
    { name: 'Brioche cannelle suédoise (Kanelbulle)', qty: 1, image: '/assets/griddle/food/cinnamon-bun.png' },
    { name: 'Cheesecake basque caramélisé', qty: 1, image: '/assets/griddle/food/burnt-cheesecake.png' },
  ],
  note: "Merci d'avoir sauvé ces délices cuisinés ce midi ! Bon appétit à l'ESSECT 🎓",
  pointsAwarded: 45,
  milestoneReached: true,
};

export default function UnboxingReveal({
  isOpen = false,
  onClose,
  order = null,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);

  // Contenu réel de la commande (révélé par le serveur au scan) ; le jeu d'exemple ne sert que sans commande
  const revealData = order ? order.reveal || { items: [], note: '' } : DEFAULT_REVEAL;
  const rarity = revealData.rarity || order?.offerSnapshot?.rarity || order?.surprise?.rarity || SURPRISE_RARITY.RARE;
  const pointsAwarded = order?.rewards?.pointsAwarded ?? revealData.pointsAwarded ?? 0;

  let rarityLabel = 'COMMUN';

  if (rarity === SURPRISE_RARITY.LEGENDARY || rarity === 'LEGENDARY') {
    rarityLabel = 'LÉGENDAIRE ✨';
  } else if (rarity === SURPRISE_RARITY.RARE || rarity === 'RARE') {
    rarityLabel = 'RARE 💎';
  }

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }

    if (shouldReduceMotion) {
      setStep(5);
      return;
    }

    setStep(1);
    const t1 = setTimeout(() => setStep(2), 700);
    const t2 = setTimeout(() => setStep(3), 1400);
    const t3 = setTimeout(() => setStep(4), 2600);
    const t4 = setTimeout(() => setStep(5), 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, shouldReduceMotion]);

  if (!isOpen) return null;

  const items = (Array.isArray(revealData.items) ? revealData.items : []).map((it) =>
    typeof it === 'string' ? { name: it, qty: 1 } : { ...it, qty: it.qty ?? it.quantity ?? 1 },
  );
  const pointsLabel = Number.isFinite(Number(pointsAwarded)) ? Number(pointsAwarded) : 45;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#FAF3E6]/95"
        role="dialog"
        aria-modal="true"
        aria-label="Déballage du panier surprise"
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="cs-icon-btn fixed top-4 right-4 sm:top-6 sm:right-6 z-[60] !w-12 !h-12"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative max-w-2xl w-full my-12 sm:my-8 bg-[#FFFDF8] border-2 border-[#111111] rounded-[1.5rem] px-5 py-8 sm:p-10 text-center text-[#111111] shadow-[0_40px_80px_-30px_rgba(17,17,17,0.45)]"
        >
          {/* ÉTAPE 1 & 2 : BOÎTE FERMÉE */}
          {step <= 2 && (
            <div className="py-8 sm:py-12 flex flex-col items-center justify-center">
              <p className="cs-eyebrow mb-6">Panier surprise</p>
              <motion.div
                animate={
                  step === 1
                    ? {
                        rotate: [-5, 5, -5, 5, -2, 2, 0],
                        scale: [1, 1.05, 1, 1.08, 1],
                      }
                    : {
                        scale: [1, 1.3, 0.9],
                        opacity: [1, 1, 0],
                      }
                }
                transition={{ duration: 0.6, repeat: step === 1 ? Infinity : 0 }}
                className="relative cursor-pointer"
                onClick={() => setStep(3)}
              >
                <img
                  src="/assets/griddle/food/box-assortiment-fika.png"
                  alt="Boîte à pâtisserie"
                  className="block w-56 sm:w-72 h-auto drop-shadow-[0_18px_28px_rgba(17,17,17,0.25)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/griddle/food/croissant-amande.png';
                  }}
                />
              </motion.div>
              <span className={`cs-sticker ${step === 1 ? 'cs-sticker-mustard' : 'cs-sticker-red'} mt-8 !text-xl`}>
                {step === 1 ? 'Déballage…' : 'Ouverture !'}
              </span>
              <p className="cs-body text-[#5E5850] mt-6">Touchez la boîte pour l’ouvrir tout de suite.</p>
            </div>
          )}

          {/* ÉTAPE 3, 4, 5 : BOÎTE OUVERTE */}
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Badge Rareté & Titre */}
              <span className="cs-sticker cs-sticker-red !text-lg">
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                {rarityLabel}
              </span>
              <h2 className="cs-display !text-[clamp(2.75rem,8vw,4.5rem)] mt-6">Votre boîte surprise</h2>
              <p className="cs-label mt-3">Fournée du jour · Rareté du lot</p>

              {/* Contenu de la boîte */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-8 text-left">
                {items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.15 }}
                    className="cs-card p-3 sm:p-4 flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-3"
                  >
                    <div className="cs-photo aspect-square w-24 sm:w-full shrink-0 !bg-[#FAF3E6]">
                      <img
                        src={item.image || getDistinctGriddleFoodImage('patisserie', idx)}
                        alt={item.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/griddle/food/croissant-amande.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-bold uppercase leading-tight line-clamp-2">{item.name}</p>
                      <span className="cs-pill cs-pill-red mt-2">× {item.qty || 1}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Note artisan */}
              {revealData.note && (
                <p className="cs-marker text-xl sm:text-2xl text-[#111111] max-w-lg mx-auto mt-8 -rotate-1 leading-snug">
                  « {revealData.note} »
                </p>
              )}

              {/* Attribution EcoPoints */}
              {step >= 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-5 sm:p-6 rounded-[1.25rem] bg-[#FFD000] border-2 border-[#111111] flex items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-[#111111] shrink-0" aria-hidden="true" />
                    <div>
                      <p className="cs-h3 !text-lg">EcoPoints bonus</p>
                      <p className="text-[15px] font-medium">Ajoutés à votre carte CampusSave Club</p>
                    </div>
                  </div>
                  <span className="cs-figure text-[48px] sm:text-[56px] text-[#DA0711] shrink-0">+{pointsLabel}</span>
                </motion.div>
              )}

              {/* Bouton Fermer */}
              <button type="button" onClick={onClose} className="cs-btn cs-btn-red cs-btn-lg cs-btn-block mt-8">
                Savourez votre panier sauvé ! →
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
