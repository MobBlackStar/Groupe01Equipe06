// 💡 Concept & Analogie : Comme le cadran d'une horloge de ville qui fait glisser le soleil dans le ciel, ce bouton ouvre un curseur d'heure : on le tire, et la rue passe de l'aube rose à la nuit bleue.
// 🔄 Comparaison React / Flutter : Composant contrôlé (valeur + callbacks), équivalent d'un `Slider` Flutter enveloppé dans un `PopupMenuButton`.
// 🎯 À retenir pour la soutenance : "L'interaction est ludique mais exacte : l'heure choisie est l'heure réelle de Tunis, le soleil est celui de ce jour."

import React, { useMemo, useState } from 'react';
import { Sun, Moon, Sunset, Play, Pause } from 'lucide-react';
import { formatClock, nowMinutes, daySchedule } from './world3d/timeOfDay.js';

/**
 * @param {object} props
 * @param {number|null} props.minutes - heure choisie (minutes depuis minuit) ou null = maintenant
 * @param {boolean} props.playing - le soleil défile tout seul
 * @param {(m:number)=>void} props.onChange
 * @param {()=>void} props.onTogglePlay
 * @param {()=>void} props.onLive - revenir à « maintenant »
 */
export default function TimeControl({ minutes, playing, onChange, onTogglePlay, onLive }) {
  const [open, setOpen] = useState(false);
  const schedule = useMemo(() => daySchedule(), []); // lever / coucher réels d'aujourd'hui à Tunis
  const shown = minutes ?? nowMinutes();
  const dark = shown < schedule.sunrise - 20 || shown > schedule.sunset + 25;
  const dusk = !dark && (shown > schedule.sunset - 70 || shown < schedule.sunrise + 70);
  const Icon = dark ? Moon : dusk ? Sunset : Sun;

  return (
    <div className="cs-ui-fade absolute top-[12.25rem] right-[6px] z-30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Choisir l'heure de la scène (actuellement ${minutes == null ? 'maintenant' : formatClock(minutes)})`}
        title="Heure de la scène"
        className={`cs-icon-btn bg-[#FAF3E6] ${minutes != null ? '!bg-[#FFD000]' : ''}`}
      >
        <Icon className="w-5 h-5" />
      </button>

      {open && (
        <div className="cs-time-pop" role="dialog" aria-label="Heure de la scène">
          <div className="cs-time-pop__row">
            <span className="cs-eyebrow">Heure à Montfleury</span>
            <span className="cs-time-pop__clock" aria-live="polite">
              {minutes == null ? 'Maintenant' : formatClock(minutes)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={1439}
            step={5}
            value={shown}
            onChange={(e) => onChange(Number(e.target.value))}
            className="cs-range"
            aria-label="Heure de la journée"
            aria-valuetext={formatClock(shown)}
          />

          <div className="cs-time-pop__chips" role="group" aria-label="Moments de la journée">
            {schedule.presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.minutes)}
                aria-pressed={minutes != null && Math.abs(minutes - p.minutes) < 30}
                className={`cs-btn cs-btn-sm ${minutes != null && Math.abs(minutes - p.minutes) < 30 ? 'cs-btn-mustard' : 'cs-btn-cream'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="cs-time-pop__row">
            <button type="button" onClick={onTogglePlay} className="cs-btn cs-btn-ink cs-btn-sm" aria-pressed={playing}>
              {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              {playing ? 'Pause' : 'Faire défiler le jour'}
            </button>
            <button type="button" onClick={onLive} className="cs-btn cs-btn-cream cs-btn-sm" disabled={minutes == null && !playing}>
              Maintenant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
