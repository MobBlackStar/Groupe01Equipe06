// 💡 Concept & Analogie : Comme le feu tricolore d'un carrefour ou l'alarme d'un compte à rebours, cette puce alerte l'étudiant sur l'imminence de la clôture du retrait selon trois paliers psychologiques de couleur.
// 🔄 Comparaison React / Flutter : En React, Tailwind conditionne les classes d'animation `animate-pulse` selon le temps restant ; en Flutter, `CountdownChip` modifie l'animation du conteneur avec un `AnimatedContainer`.
// 🎯 À retenir pour la soutenance : "Trois seuils stricts : >60 min (vert lime serein), 20-60 min (orange attention), <20 min (rouge clignotant urgence absolue) pour stimuler l'achat anti-gaspillage rapide."

import React, { useState, useEffect, memo } from 'react';
import { computeMinutesLeft } from '@shared/pricing.js';
import { formatTunisTime } from '../../lib/formatters.js';

/**
 * Pickup countdown pill.
 * > 3h left  → "Jusqu'à 17:52" (calm cream)
 * < 3h       → "2h05 restantes" (cream)
 * < 60 min   → mustard
 * < 20 min   → red, pulsing
 */
function CountdownChipComponent({ pickupEndAt, className = '' }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!pickupEndAt) return;
    // Mise à jour toutes les 10 secondes (suffisant pour un affichage en minutes)
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, [pickupEndAt]);

  if (!pickupEndAt) return null;

  const minutesLeft = computeMinutesLeft(pickupEndAt, now);
  if (!Number.isFinite(minutesLeft)) return null;

  const isExpired = minutesLeft <= 0;
  const isCritical = !isExpired && minutesLeft < 20;
  const isSoon = !isExpired && minutesLeft < 60;

  let text;
  if (isExpired) text = 'Retrait clôturé';
  else if (minutesLeft >= 180) text = `Jusqu'à ${formatTunisTime(pickupEndAt)}`;
  else if (minutesLeft >= 60) {
    const h = Math.floor(minutesLeft / 60);
    const m = minutesLeft % 60;
    text = `${h}h${String(m).padStart(2, '0')} restantes`;
  } else text = `${minutesLeft} min restantes`;

  let tone = 'bg-[#FAF3E6] text-[#111111]';
  if (isExpired) tone = 'bg-[#111111] text-[#FAF3E6]';
  else if (isCritical) tone = 'bg-[#DA0711] text-white';
  else if (isSoon) tone = 'bg-[#FFD000] text-[#111111]';

  return (
    <span
      className={`inline-flex items-center gap-2 h-8 px-3 rounded-full border-2 border-[#111111] text-[0.875rem] font-semibold uppercase tracking-wide whitespace-nowrap tabular-nums ${tone} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-white animate-ping' : isExpired ? 'bg-[#FAF3E6]' : 'bg-[#DA0711]'}`} />
      {text}
    </span>
  );
}

export default memo(CountdownChipComponent);
