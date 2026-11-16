// 💡 Concept & Analogie : Comme l'ouverture d'un paquet de cartes rares ou d'un coffre de jeu vidéo avec flashs lumineux et confettis sonores, cette animation gamifie le moment magique où l'étudiant découvre le contenu réel de son panier mystère.
// 🔄 Comparaison React / Flutter : En React, Framer Motion orchestre la séquence en 5 étapes avec `AnimatePresence` ; en Flutter, `UnboxingOverlay` utilise un `AnimationController` avec `HapticFeedback.heavyImpact()`.
// 🎯 À retenir pour la soutenance : "L'effet d'unboxing transforme un simple acte d'achat anti-gaspillage en une expérience émotionnelle marquante, dopant le bouche-à-oreille et l'engagement étudiant."

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SURPRISE_RARITY } from '@shared/constants.js';

// Données démo si non fournies
const DEFAULT_REVEAL = {
  rarity: SURPRISE_RARITY.RARE,
  items: [
    { name: 'Croissants pur beurre dorés', qty: 2, icon: '🥐' },
    { name: 'Pain au chocolat feuilleté', qty: 1, icon: '🍫' },
    { name: 'Fricassé tunisien au thon & harissa', qty: 2, icon: '🥟' },
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

  // Couleurs de rareté
  let rarityColor = '#94A3B8';
  let rarityLabel = 'COMMUN';
  let rarityGlow = 'rgba(148, 163, 184, 0.4)';

  if (rarity === SURPRISE_RARITY.LEGENDARY || rarity === 'LEGENDARY') {
    rarityColor = '#FFD700';
    rarityLabel = 'LÉGENDAIRE ✨';
    rarityGlow = 'rgba(255, 215, 0, 0.6)';
  } else if (rarity === SURPRISE_RARITY.RARE || rarity === 'RARE') {
    rarityColor = '#00E5FF';
    rarityLabel = 'RARE 💎';
    rarityGlow = 'rgba(0, 229, 255, 0.6)';
  }

  // Séquence automatique au déclenchement
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

    // Étape 1 : secousse (0.8s) -> Étape 2 : explosion (0.6s)
    const t1 = setTimeout(() => setStep(2), 800);
    // Étape 2 -> Étape 3 : Révélation des articles
    const t2 = setTimeout(() => setStep(3), 1500);
    // Étape 3 -> Étape 4 : Attribution EcoPoints
    const t3 = setTimeout(() => setStep(4), 2800);
    // Étape 4 -> Étape 5 : Clôture avec bouton
    const t4 = setTimeout(() => setStep(5), 3800);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors z-50 text-sm"
          title="Fermer"
        >
          ✕
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative max-w-lg w-full bg-[#161920] border rounded-3xl p-6 sm:p-8 text-center overflow-hidden shadow-2xl"
          style={{ borderColor: `${rarityColor}66` }}
        >
          {/* Lueur d'arrière-plan aux couleurs de la rareté */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
            style={{ backgroundColor: rarityGlow }}
          />

          {/* Étape 1 & 2 : Boîte en train de trembler ou d'exploser */}
          {step <= 2 && (
            <div className="py-12 flex flex-col items-center justify-center">
              <motion.div
                animate={
                  step === 1
                    ? {
                        rotate: [-6, 6, -6, 6, -3, 3, 0],
                        scale: [1, 1.08, 1, 1.1, 1],
                      }
                    : {
                        scale: [1, 1.4, 0.8],
                        opacity: [1, 1, 0],
                      }
                }
                transition={{ duration: 0.8 }}
                className="relative text-8xl filter drop-shadow-2xl select-none"
              >
                🎁
              </motion.div>

              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-lg font-bold text-white tracking-wide"
              >
                {step === 1 ? 'Déballage du Panier Surprise...' : '✨ RÉVÉLATION ! ✨'}
              </motion.h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Suspense gastronomique à Montfleury...
              </p>
            </div>
          )}

          {/* Étape 3, 4 & 5 : Articles découverts */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Badge de rareté révélée */}
              <div className="flex flex-col items-center">
                <span
                  style={{ color: rarityColor, borderColor: `${rarityColor}55` }}
                  className="px-4 py-1 rounded-full text-xs font-black tracking-widest border uppercase bg-white/5 shadow-inner"
                >
                  RARETÉ DU LOT : {rarityLabel}
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Voici ce que contenait votre boîte !
                </h2>
              </div>

              {/* Liste cascade des articles */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {revealData.items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D0F12] border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon || '🥪'}</span>
                      <span className="font-bold text-white text-xs sm:text-sm text-left">
                        {item.name}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white font-mono text-xs font-bold">
                      x {item.qty}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Mot du commerçant */}
              {revealData.note && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300 italic">
                  💬 « {revealData.note} »
                </div>
              )}

              {/* Étape 4 & 5 : Gain EcoPoints */}
              {step >= 4 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-bounce">🌱</span>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">
                        Félicitations pour ce sauvetage !
                      </span>
                      <span className="text-[11px] text-[#CCFF00]">
                        {revealData.milestoneReached
                          ? '🎉 Nouveau palier franchi sur votre carte de fidélité !'
                          : 'Vos points ont été ajoutés à votre carte.'}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-xl font-black text-[#CCFF00]">
                    +{pointsAwarded} pts
                  </div>
                </motion.div>
              )}

              {/* Étape 5 : Bouton d'action final */}
              {step >= 5 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-2 flex flex-col sm:flex-row gap-3"
                >
                  <Link
                    to="/app/loyalty"
                    onClick={onClose}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-[#CCFF00] text-black font-black text-xs hover:bg-[#b8e600] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#CCFF00]/20"
                  >
                    <span>🌱 Voir ma Carte de Fidélité Éco-Digitale</span>
                  </Link>

                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3.5 px-5 rounded-2xl bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                  >
                    Fermer
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
