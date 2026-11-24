// 💡 Concept & Analogie : Le commis qui, chaque matin, remet l'étalage en place si les invendus de la veille sont périmés : le catalogue de démonstration n'est jamais vide, même si personne n'a relancé le seed.
// 🔄 Comparaison React / Flutter : Tâche d'arrière-plan du backend (aucune Cloud Function, aucun plan Blaze) : un `setInterval` non bloquant, comme les autres sweepers.
// 🎯 À retenir pour la soutenance : "Toutes les 6 h (et 5 s après le démarrage), si plus aucune offre n'est active ou si le dernier reset date de 24 h, la démo est réinitialisée ; actif seulement hors production ou avec ALLOW_DEMO_TOKENS=true."
// Module : Logique Métier Backend

import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { OFFER_STATUS } from '../../../shared/constants.js';
import { clearReadCache } from '../middleware/readCache.js';
import { resetDemo } from '../../scripts/resetDemo.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const BOOT_DELAY_MS = 5000;

let isDemoAutoResetRunning = false;

/** Actif hors production, ou en production uniquement si les jetons de démo sont explicitement autorisés. Jamais en test. */
export function isDemoAutoResetEnabled(envVars = process.env) {
  if (envVars.NODE_ENV === 'test') return false;
  return envVars.ALLOW_DEMO_TOKENS === 'true' || envVars.NODE_ENV !== 'production';
}

function toMs(value) {
  if (!value) return NaN;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

/** Nombre d'offres ACTIVE dont le retrait n'est pas encore terminé. */
export async function countLiveOffers(nowMs = Date.now()) {
  const snap = await db.collection('offers').where('status', '==', OFFER_STATUS.ACTIVE).get();
  return snap.docs.filter((d) => toMs(d.data().pickupEndAt) > nowMs).length;
}

/**
 * Vérifie l'état de la démo et la réinitialise si nécessaire.
 * @returns {Promise<{ action: 'skipped'|'initialized'|'reset', reason?: string, liveOffers?: number }>}
 */
export async function runDemoAutoReset({ nowMs = Date.now() } = {}) {
  if (isDemoAutoResetRunning) return { action: 'skipped', reason: 'already-running' };
  isDemoAutoResetRunning = true;

  try {
    const stateRef = db.collection('platform_meta').doc('demo_state');
    const stateSnap = await stateRef.get();
    const lastResetMs = stateSnap.exists ? toMs(stateSnap.data().lastResetAt) : NaN;
    const liveOffers = await countLiveOffers(nowMs);

    const noLiveOffers = liveOffers === 0;
    const tooOld = Number.isFinite(lastResetMs) && nowMs - lastResetMs >= DAY_MS;

    if (!noLiveOffers && !tooOld) {
      // Données encore fraîches : on mémorise simplement le point de départ s'il n'existait pas
      if (!Number.isFinite(lastResetMs)) {
        await stateRef.set({ lastResetAt: new Date(nowMs), reason: 'initialized', liveOffers }, { merge: true });
        return { action: 'initialized', liveOffers };
      }
      return { action: 'skipped', reason: 'fresh', liveOffers };
    }

    const reason = noLiveOffers ? 'no-live-offers' : 'older-than-24h';
    logger.info({ reason, liveOffers }, 'Réinitialisation automatique de la démo');
    await resetDemo();
    await stateRef.set({ lastResetAt: new Date(), reason, liveOffersBefore: liveOffers }, { merge: true });
    clearReadCache();
    return { action: 'reset', reason, liveOffers };
  } catch (error) {
    logger.error({ err: error.message }, 'Erreur dans le demoAutoResetSweeper');
    return { action: 'skipped', reason: 'error' };
  } finally {
    isDemoAutoResetRunning = false;
  }
}

/**
 * Démarre la vérification : une fois, 5 s après le démarrage (sans bloquer), puis toutes les 6 h.
 * Les minuteurs sont `unref()` : ils n'empêchent jamais l'arrêt du processus.
 */
export function startDemoAutoResetSweeper(envVars = process.env) {
  if (!isDemoAutoResetEnabled(envVars)) return null;

  const boot = setTimeout(() => {
    runDemoAutoReset().catch(() => {});
  }, BOOT_DELAY_MS);
  const timer = setInterval(() => {
    runDemoAutoReset().catch(() => {});
  }, SIX_HOURS_MS);

  if (typeof boot.unref === 'function') boot.unref();
  if (typeof timer.unref === 'function') timer.unref();
  return timer;
}
