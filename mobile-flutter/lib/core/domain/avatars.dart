// 💡 Concept & Analogie : Les pastilles de couleur d'une équipe, les mêmes que sur le site : chacun choisit la sienne.
// 🔄 Comparaison React / Flutter : Miroir de `shared/avatars.js` : `avatarUrl` vaut `preset:<nom>` ou une adresse https.
// 🎯 À retenir pour la soutenance : "Six avatars prédéfinis identiques sur le web et le mobile, stockés comme un simple identifiant."

import 'package:flutter/material.dart';

class AvatarPreset {
  final String emoji;
  final Color bg;
  final String label;
  const AvatarPreset(this.emoji, this.bg, this.label);
}

const Map<String, AvatarPreset> kAvatarPresets = {
  'croissant': AvatarPreset('🥐', Color(0xFFFFD000), 'Croissant'),
  'tomate': AvatarPreset('🍅', Color(0xFFDA0711), 'Tomate'),
  'feuille': AvatarPreset('🌿', Color(0xFF1F7A3A), 'Feuille'),
  'pizza': AvatarPreset('🍕', Color(0xFFF28C28), 'Pizza'),
  'gateau': AvatarPreset('🧁', Color(0xFFEDE6D7), 'Gâteau'),
  'soleil': AvatarPreset('☀️', Color(0xFFFFE27A), 'Soleil'),
};

const String kAvatarPrefix = 'preset:';

/// `preset:croissant` -> pastille, ou `null` si la valeur n'est pas un avatar prédéfini connu.
AvatarPreset? resolveAvatarPreset(String? avatarUrl) {
  if (avatarUrl == null || !avatarUrl.startsWith(kAvatarPrefix)) return null;
  return kAvatarPresets[avatarUrl.substring(kAvatarPrefix.length)];
}
