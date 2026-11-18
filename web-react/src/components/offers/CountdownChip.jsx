// 💡 Concept & Analogie : Comme le feu tricolore d'un carrefour ou l'alarme d'un compte à rebours, cette puce alerte l'étudiant sur l'imminence de la clôture du retrait selon trois paliers psychologiques de couleur.
// 🔄 Comparaison React / Flutter : En React, Tailwind conditionne les classes d'animation `animate-pulse` selon le temps restant ; en Flutter, `CountdownChip` modifie l'animation du conteneur avec un `AnimatedContainer`.
// 🎯 À retenir pour la soutenance : "Trois seuils stricts : >60 min (vert lime serein), 20-60 min (orange attention), <20 min (rouge clignotant urgence absolue) pour stimuler l'achat anti-gaspillage rapide."

import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';
import { computeUrgencyColor, computeMinutesLeft } from '@shared/pricing.js';

function CountdownChipComponent({ pickupEndAt, className = '' }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!pickupEndAt) return;
    // Mise à jour toutes les 10 secondes (suffisant et optimal pour un affichage en minutes)
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, [pickupEndAt]);

  if (!pickupEndAt) return null;

  const minutesLeft = computeMinutesLeft(pickupEndAt, now);
  const colorHex = computeUrgencyColor(pickupEndAt, now);
  const isCritical = minutesLeft < 20 && minutesLeft > 0;
  const isExpired = minutesLeft <= 0;

  // Formatage texte
  let timeText = '';
  if (isExpired) {
    timeText = 'Clôturé';
  } else if (minutesLeft >= 60) {
    const h = Math.floor(minutesLeft / 60);
    const m = minutesLeft % 60;
    timeText = `${h}h${m > 0 ? String(m).padStart(2, '0') : ''} restant`;
  } else {
    timeText = `${minutesLeft} min restantes`;
  }

  // Styles Griddle selon urgence (élimination stricte de l'ancien #CCFF00 vert néon)
  let griddleColor = '#2E6F40'; // Matcha Emerald
  let griddleBg = '#F0FDF4';
  let griddleBorder = '#86EFAC';
  if (isCritical || isExpired) {
    griddleColor = '#E51C23'; // Griddle Crimson
    griddleBg = '#FEF2F2';
    griddleBorder = '#FCA5A5';
  } else if (minutesLeft < 60) {
    griddleColor = '#B45309'; // Mustard Amber
    griddleBg = '#FFFBEB';
    griddleBorder = '#FDE68A';
  }

  return (
    <div
      style={{
        color: griddleColor,
        borderColor: griddleBorder,
        backgroundColor: griddleBg,
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border-2 shadow-[2px_2px_0px_#141210] transition-all duration-300 ${
        isCritical ? 'animate-pulse' : ''
      } ${className}`}
    >
      <span
        style={{ backgroundColor: griddleColor }}
        className={`w-2 h-2 rounded-full ${isCritical ? 'animate-ping' : ''}`}
      />
      <span>{timeText}</span>
    </div>
  );
}

export default memo(CountdownChipComponent);
