// 💡 Concept & Analogie : Les pastilles de couleur d'une équipe : chacun choisit la sienne, et le web comme le mobile la dessinent de la même façon.
// 🔄 Comparaison React / Flutter : `avatarUrl` vaut soit une adresse https, soit `preset:<nom>` ; le site et l'application mobile traduisent le nom en pastille (emoji sur fond de couleur Griddle).
// 🎯 À retenir pour la soutenance : "Pas de téléversement obligatoire : six avatars prédéfinis stockés comme un simple identifiant, identiques sur le web et le mobile."

export const AVATAR_PRESETS = Object.freeze({
  croissant: { emoji: '🥐', bg: '#FFD000', label: 'Croissant' },
  tomate: { emoji: '🍅', bg: '#DA0711', label: 'Tomate' },
  feuille: { emoji: '🌿', bg: '#1F7A3A', label: 'Feuille' },
  pizza: { emoji: '🍕', bg: '#F28C28', label: 'Pizza' },
  gateau: { emoji: '🧁', bg: '#EDE6D7', label: 'Gâteau' },
  soleil: { emoji: '☀️', bg: '#FFE27A', label: 'Soleil' },
});

export const AVATAR_PRESET_PREFIX = 'preset:';

/** `preset:croissant` -> `{ emoji, bg, label }`, ou `null` si ce n'est pas un avatar prédéfini connu. */
export function resolveAvatarPreset(avatarUrl) {
  if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith(AVATAR_PRESET_PREFIX)) return null;
  return AVATAR_PRESETS[avatarUrl.slice(AVATAR_PRESET_PREFIX.length)] || null;
}

/** Valide la valeur stockée : adresse http(s) ou avatar prédéfini connu. */
export function isValidAvatarValue(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith(AVATAR_PRESET_PREFIX)) return Boolean(resolveAvatarPreset(value));
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
