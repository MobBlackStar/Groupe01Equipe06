// 💡 Concept & Analogie : Comme le tableau de bord d'une visite guidée (pause, vitesse, jauge de progression, sortie), il pilote la marche sans jamais cacher la rue.
// 🔄 Comparaison React / Flutter : Composant sans état propre : l'état vient du contrôleur de marche (équivalent d'un `StatelessWidget` alimenté par un `ValueListenable`).
// 🎯 À retenir pour la soutenance : "Le mode Marcher est annoncé « vue stylisée » : les hauteurs d'immeubles sont estimées, les rues et l'itinéraire sont réels."

import React from 'react';
import { Pause, Play, X } from 'lucide-react';
import { WALK_SPEEDS } from './walkMode.js';

/**
 * @param {object} props
 * @param {{progress:number, metersLeft:number, paused:boolean, arrived:boolean, speed:string}} props.state
 * @param {string} props.merchantName
 * @param {(key:string)=>void} props.onSpeed
 * @param {()=>void} props.onTogglePause
 * @param {(fraction:number)=>void} props.onScrub
 * @param {()=>void} props.onExit
 */
export default function WalkHud({ state, merchantName, onSpeed, onTogglePause, onScrub, onExit }) {
  const pct = Math.round(state.progress * 100);
  return (
    <>
    <span className="cs-walk-badge">Vue stylisée · hauteurs estimées</span>
    <section className="cs-walk-hud" aria-label={`Marche vers ${merchantName}`}>
      <div className="cs-walk-hud__row">
        <span className="cs-eyebrow">
          {state.arrived ? 'Arrivé à la porte' : `Encore ${state.metersLeft} m jusqu'à ${merchantName}`}
        </span>
        <button type="button" onClick={onExit} className="cs-btn cs-btn-cream cs-btn-sm" aria-label="Quitter le mode Marcher">
          <X className="w-4 h-4" aria-hidden="true" /> Quitter
        </button>
      </div>

      {!state.arrived && (
      <>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        onChange={(e) => onScrub(Number(e.target.value) / 100)}
        className="cs-range"
        aria-label="Avancement sur le trajet"
        aria-valuetext={`${pct} pour cent du trajet`}
      />

      <div className="cs-walk-hud__row">
        <button
          type="button"
          onClick={onTogglePause}
          disabled={state.arrived}
          className="cs-btn cs-btn-ink cs-btn-sm"
          aria-label={state.paused ? 'Reprendre la marche' : 'Mettre en pause'}
        >
          {state.paused ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
          {state.paused ? 'Marcher' : 'Pause'}
        </button>
        <div className="cs-walk-hud__speeds" role="group" aria-label="Vitesse de marche">
          {Object.entries(WALK_SPEEDS).map(([key, v]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSpeed(key)}
              aria-pressed={state.speed === key}
              className={`cs-btn cs-btn-sm ${state.speed === key ? 'cs-btn-mustard' : 'cs-btn-cream'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      </>
      )}
      <p className="cs-walk-hud__stylised">Glissez sur la scène pour regarder autour de vous.</p>
    </section>
    </>
  );
}
