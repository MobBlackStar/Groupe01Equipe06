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

  const revealData = order?.reveal || DEFAULT_REVEAL;
  const rarity = revealData.rarity || order?.surprise?.rarity || SURPRISE_RARITY.RARE;
  const pointsAwarded = order?.rewards?.pointsAwarded || revealData.pointsAwarded || 45;

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white border border-[#111111]/15 text-[#111111] hover:bg-[#EDE6D7] transition-colors z-50 text-sm font-bold shadow-sm cursor-pointer"
        >
          ✕
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative max-w-xl w-full bg-[#FAF3E6] border border-[#111111]/10 rounded-3xl p-6 sm:p-8 text-center overflow-hidden shadow-[0_20px_50px_rgba(17,17,17,0.15)] text-[#111111]"
        >
          {/* ÉTAPE 1 & 2 : BOÎTE FERMÉE */}
          {step <= 2 && (
            <div className="py-10 flex flex-col items-center justify-center">
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
                  className="w-48 h-48 object-contain filter drop-shadow-[0_12px_24px_rgba(20,18,16,0.2)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/griddle/food/croissant-amande.png';
                  }}
                />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-[#FFD000] text-[#111111] border border-[#111111]/15 font-anton text-xs uppercase whitespace-nowrap shadow-sm">
                  {step === 1 ? '✨ DÉBALLAGE DU PANIER...' : '💥 OUVERTURE !'}
                </span>
              </motion.div>
            </div>
          )}

          {/* ÉTAPE 3, 4, 5 : BOÎTE OUVERTE */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Badge Rareté & Titre */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-[#111111] font-anton text-xs uppercase border border-[#111111]/10 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#DA0711]" />
                  <span>RARETÉ DU LOT : <strong className="text-[#DA0711]">{rarityLabel}</strong></span>
                </div>
                <h2 className="font-anton uppercase text-2xl sm:text-3xl font-black text-[#111111]">
                  CONTENU DE VOTRE BOÎTE SURPRISE
                </h2>
              </div>

              {/* Boîte rayée ouverte */}
              <div
                className="p-5 rounded-2xl border border-dashed border-[#111111]/25 relative overflow-hidden"
                style={{
                  background: 'repeating-linear-gradient(45deg, #FAF3E6, #FAF3E6 12px, #EDE6D7 12px, #EDE6D7 24px)',
                }}
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#555] font-bold mb-3">
                  TAPISSERIE RAYÉE ARTISANALE · FOURNÉE DU JOUR
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {revealData.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.15 }}
                      className="p-3.5 rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-sm flex flex-col items-center text-center"
                    >
                      <div className="w-16 h-16 mb-2 flex items-center justify-center">
                        <img
                          src={item.image || getDistinctGriddleFoodImage('patisserie', idx)}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_8px_rgba(20,18,16,0.15)]"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/griddle/food/croissant-amande.png';
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#111111] leading-tight line-clamp-2">
                        {item.name}
                      </span>
                      <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#DA0711] text-white text-[9px] font-anton">
                        QTÉ : x{item.qty || 1}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Note artisan */}
              <p className="text-xs text-[#666] italic font-sans max-w-md mx-auto font-medium">
                "{revealData.note}"
              </p>

              {/* Attribution EcoPoints */}
              {step >= 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-[#FEF08A] border border-[#A16207]/20 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Award className="w-6 h-6 text-[#854D0E]" />
                    <div>
                      <p className="text-xs font-black text-[#854D0E] uppercase">EcoPoints Bonus Débloqués</p>
                      <p className="text-[10px] text-[#666] font-bold">Ajoutés à votre carte CAMPUSSAVE CLUB</p>
                    </div>
                  </div>
                  <span className="font-anton text-2xl text-[#854D0E]">
                    +{pointsAwarded} pts
                  </span>
                </motion.div>
              )}

              {/* Bouton Fermer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full btn-griddle-primary py-3.5 cursor-pointer"
                >
                  <span>Savourez votre panier sauvé ! →</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
