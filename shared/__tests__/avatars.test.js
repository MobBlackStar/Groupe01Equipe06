import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVATAR_PRESETS, resolveAvatarPreset, isValidAvatarValue } from '../avatars.js';

test('avatars : un identifiant prédéfini connu est résolu en emoji et couleur', () => {
  const preset = resolveAvatarPreset('preset:croissant');
  assert.equal(preset.emoji, '🥐');
  assert.match(preset.bg, /^#[0-9A-F]{6}$/i);
  assert.equal(resolveAvatarPreset('preset:inconnu'), null);
  assert.equal(resolveAvatarPreset('https://example.com/a.png'), null);
  assert.equal(resolveAvatarPreset(undefined), null);
});

test('avatars : valeur stockée valide = avatar prédéfini connu ou adresse http(s)', () => {
  for (const name of Object.keys(AVATAR_PRESETS)) assert.equal(isValidAvatarValue(`preset:${name}`), true);
  assert.equal(isValidAvatarValue('https://example.com/a.png'), true);
  assert.equal(isValidAvatarValue('preset:nope'), false);
  assert.equal(isValidAvatarValue('javascript:alert(1)'), false);
  assert.equal(isValidAvatarValue(42), false);
});
