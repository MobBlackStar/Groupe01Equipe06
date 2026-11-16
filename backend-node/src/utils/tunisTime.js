// 💡 Concept & Analogie : Comme un fuseau horaire légal appliqué à tous les contrats administratifs d'une ville, tous les calculs de jour, de fermeture et d'expiration sont ancrés sur le fuseau officiel de Tunis (UTC+1).
// 🔄 Comparaison React / Flutter : Côté client, l'heure locale de l'étudiant peut varier, mais la segmentation des journées de vente se fait strictement sur l'heure officielle tunisienne.
// 🎯 À retenir pour la soutenance : "Nous fixons explicitement le fuseau `Africa/Tunis` (UTC+1) pour la génération des clés journalières de statistiques et le respect des créneaux de retrait."
// Module : Architecture & Infrastructure

/**
 * Retourne la date courante au format YYYY-MM-DD selon le fuseau horaire de Tunis.
 * @param {Date|number} [dateInput=new Date()]
 * @returns {string} Exemple : "2026-11-16"
 */
export function getTunisDayKey(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Tunis' });
}

/**
 * Retourne l'heure courante au format HH:mm selon le fuseau de Tunis.
 * @param {Date|number} [dateInput=new Date()]
 * @returns {string} Exemple : "17:30"
 */
export function getTunisTimeHHMM(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toLocaleTimeString('fr-TN', {
    timeZone: 'Africa/Tunis',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
