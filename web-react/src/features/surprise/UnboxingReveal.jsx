// 💡 Concept & Analogie : Comme l'ouverture d'une élégante boîte à pâtisseries rayée artisanale (image4.png "Pack a box for the morning"), avec son couvercle rabattable en carton et son tapissage intérieur rayé révélant les mets cachés.
// 🔄 Comparaison React / Flutter : En React, l'animation combine Framer Motion et des cutouts transparents Framer (@harvester) ; en Flutter, `unboxing_overlay.dart` gère la révélation avec retour haptique.
// 🎯 À retenir pour la soutenance : "L'unboxing tactile gamifie la récupération du panier surprise en matérialisant l'ouverture de la boîte de boulangerie et l'attribution des EcoPoints bonus."
// Module : Surprise Basket (B2, I3)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SURPRISE_RARITY } from '@shared/constants.js';
import { DepthCard, DepthLayer } from '../../components/common/DepthCard.jsx';
import { FRAMER_ASSETS, getFramerFoodImage } from '../../lib/framerAssets.js';
import { Sparkles, Gift, Check, Flame, Award } from 'lucide-react';

const DEFAULT_REVEAL = {
  rarity: SURPRISE_RARITY.RARE,
  items: [
    { name: 'Croissants pur beurre dorés', qty: 2, image: '/assets/framer/pastries/croissant-beurre.png' },
    { name: 'Brioche cannelle suédoise (Kanelbulle)', qty: 1, image: '/assets/framer/pastries/cinnamon-bun.png' },
    { name: 'Cheesecake basque caramélisé', qty: 1, image: '/assets/framer/pastries/burnt-cheesecake.png' },
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
  const [step, setStep] = useState(1); // 1: SHAKING, 2: BURST, 3: ITEMS, 4: POINTS, 5: DONE

  const revealData = order?.reveal || DEFAULT_REVEAL;
  const rarity = revealData.rarity || order?.surprise?.rarity || SURPRISE_RARITY.RARE;
  const pointsAwarded = order?.rewards?.pointsAwarded || revealData.pointsAwarded || 45;

  let rarityColor = '#F5C400';
  let rarityLabel = 'COMMUN';
  let rarityGlow = 'rgba(245, 196, 0, 0.4)';

  if (rarity === SURPRISE_RARITY.LEGENDARY || rarity === 'LEGENDARY') {
    rarityColor = '#FFD700';
    rarityLabel = 'LÉGENDAIRE ✨';
    rarityGlow = 'rgba(255, 215, 0, 0.6)';
  } else if (rarity === SURPRISE_RARITY.RARE || rarity === 'RARE') {
    rarityColor = '#00E5FF';
    rarityLabel = 'RARE 💎';
    rarityGlow = 'rgba(0, 229, 255, 0.6)';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors z-50 text-sm font-bold"
        >
          ✕
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative max-w-xl w-full bg-[#161412] border border-white/20 rounded-3xl p-6 sm:p-8 text-center overflow-hidden shadow-2xl"
          style={{ borderColor: `${rarityColor}88` }}
        >
          {/* Lueur d'ambiance */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
            style={{ backgroundColor: rarityGlow }}
          />

          {/* =========================================================================
              ÉTAPE 1 & 2 : BOÎTE À PÂTISSERIES FERMÉE / QUI TREMBLE (image4.png)
              ========================================================================= */}
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
                  src="/assets/framer/pastries/box-assortiment-fika.png"
                  alt="Boîte à pâtisserie"
                  className="w-48 h-48 object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F5C400] text-[#0E0D0C] font-mono text-xs font-bold whitespace-nowrap shadow-lg">
                  {step === 1 ? '✨ DÉBALLAGE DU PANIER...' : '💥 OUVERTURE !'}
                </span>
              </motion.div>
            </div>
          )}

          {/* =========================================================================
              ÉTAPE 3, 4, 5 : BOÎTE RAYÉE OUVERTE AVEC LES LOTS DÉVOILÉS (image4.png)
              ========================================================================= */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Badge Rareté & Titre */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white font-mono text-xs font-bold border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-[#F5C400]" />
                  <span>RARETÉ DU LOT : <strong style={{ color: rarityColor }}>{rarityLabel}</strong></span>
                </div>
                <h2 className="font-oswald uppercase text-2xl sm:text-3xl font-black text-white">
                  CONTENU DE VOTRE BOÎTE SURPRISE
                </h2>
              </div>

              {/* Boîte rayée ouverte Fika (image4.png) */}
              <div
                className="p-5 rounded-2xl border-2 border-dashed border-[#F5C400]/40 relative overflow-hidden"
                style={{
                  background: 'repeating-linear-gradient(45deg, #F6F1E7, #F6F1E7 12px, #EBE3D3 12px, #EBE3D3 24px)',
                }}
              >
                {/* Couvercle rabattu en haut */}
                <div className="text-[10px] font-mono uppercase tracking-widest text-stone-600 font-bold mb-3">
                  TAPISSERIE RAYÉE ARTISANALE · FOURNÉE DU JOUR
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {revealData.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.15 }}
                      className="p-3 rounded-xl bg-white shadow-md border border-stone-200 flex flex-col items-center text-center"
                    >
                      <div className="w-16 h-16 mb-2 flex items-center justify-center">
                        <img
                          src={item.image || getFramerFoodImage(item.name)}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/framer/pastries/croissant-beurre.png';
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-black text-[#161412] leading-tight line-clamp-2">
                        {item.name}
                      </span>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-[#EE3124] text-white text-[9px] font-oswald font-black">
                        QTÉ : x{item.qty || 1}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Note artisan */}
              <p className="text-xs text-stone-300 italic font-sans max-w-md mx-auto">
                "{revealData.note}"
              </p>

              {/* Attribution EcoPoints (Étape 4+) */}
              {step >= 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-2xl bg-[#F5C400]/15 border border-[#F5C400]/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Award className="w-6 h-6 text-[#F5C400]" />
                    <div>
                      <p className="text-xs font-bold text-white">EcoPoints Bonus Débloqués</p>
                      <p className="text-[10px] text-stone-400">Ajoutés à votre carte StreetWok BOWL CLUB</p>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black text-[#F5C400]">
                    +{pointsAwarded} pts
                  </span>
                </motion.div>
              )}

              {/* Bouton Fermer / Continuer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#EE3124] to-[#F5C400] text-black font-oswald uppercase text-base font-black tracking-wider shadow-xl hover:opacity-95 transition-all"
                >
                  Savourez votre panier sauvé ! →
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
