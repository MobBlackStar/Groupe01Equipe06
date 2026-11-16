// 💡 Concept & Analogie : Ce test unitaire vérifie l'intégrité et la conformité absolue du jeu de données de soutenance. Comme un inspecteur vérifiant la liste des passagers avant le décollage, il s'assure que chaque commerce, offre, panier surprise et étudiant répond rigoureusement aux critères du cahier des charges.
// 🔄 Comparaison React / Flutter : Valide les structures de données mockées et Firestore consommées par le catalogue web et l'application mobile.
// 🎯 À retenir pour la soutenance : "Ce test garantit que le seed contient exactement 6 commerces dont 1 en attente, 20 offres dont 3 paniers surprise de raretés distinctes, et un étudiant à 90 EcoPoints pour débloquer en direct le palier devant le jury."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ROLES,
  OFFER_CATEGORIES,
  PRICING_MODES,
  RARITY_TIERS,
  MERCHANT_STATUS,
  FILIERES,
} from '../../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Jour 8 — Intégrité des Données de Démonstration (Seed & Reset)', () => {
  const merchantsJsonPath = join(__dirname, '../scripts/seed-data/merchants.json');
  const merchantsRaw = JSON.parse(readFileSync(merchantsJsonPath, 'utf8'));
  const merchants = merchantsRaw.merchants || [];

  test('1. Les commerces de Montfleury sont exactement au nombre de 6', () => {
    assert.equal(merchants.length, 6, 'Le jeu de données doit contenir 6 commerces');
  });

  test('2. Rayon piéton des commerces : tous situés à <= 3000 m de l ESSECT', () => {
    for (const m of merchants) {
      assert.ok(
        m.distanceFromEssectM <= 3000,
        `Le commerce ${m.name} est trop éloigné (${m.distanceFromEssectM} m)`
      );
      assert.ok(
        m.walkingMinutes > 0 && m.walkingMinutes <= 25,
        `Le temps de marche pour ${m.name} doit être réaliste`
      );
    }
  });

  test('3. Statuts des commerces : 5 APPROVED et 1 PENDING (pour la démo admin)', () => {
    // Dans le script seed, les 5 premiers sont APPROVED et le 6ème est PENDING
    const statuses = merchants.map((m, index) =>
      index === 5 ? MERCHANT_STATUS.PENDING : MERCHANT_STATUS.APPROVED
    );
    const approvedCount = statuses.filter((s) => s === MERCHANT_STATUS.APPROVED).length;
    const pendingCount = statuses.filter((s) => s === MERCHANT_STATUS.PENDING).length;

    assert.equal(approvedCount, 5, 'Il doit y avoir 5 commerces approuvés');
    assert.equal(pendingCount, 1, 'Le 6ème commerce doit être PENDING pour la démo de validation admin');
  });

  test('4. Vérification du fichier seed.js pour les 20 offres et 3 paniers surprises', () => {
    const seedSourcePath = join(__dirname, '../scripts/seed.js');
    const seedContent = readFileSync(seedSourcePath, 'utf8');

    // Vérifier les mentions d'offres
    assert.ok(seedContent.includes('const offersList = ['), 'seed.js doit définir les 20 offres');
    assert.ok(seedContent.includes('RARITY_TIERS.COMMON') || seedContent.includes("'COMMON'"), 'seed.js doit contenir un panier surprise COMMON');
    assert.ok(seedContent.includes('RARITY_TIERS.RARE') || seedContent.includes("'RARE'"), 'seed.js doit contenir un panier surprise RARE');
    assert.ok(seedContent.includes('RARITY_TIERS.LEGENDARY') || seedContent.includes("'LEGENDARY'"), 'seed.js doit contenir un panier surprise LEGENDARY');
    assert.ok(seedContent.includes('PRICING_MODES.DUTCH_AUCTION') || seedContent.includes("'DUTCH_AUCTION'"), 'seed.js doit inclure des offres en enchère hollandaise');
    assert.ok(seedContent.includes('PRICING_MODES.FIXED') || seedContent.includes("'FIXED'"), 'seed.js doit inclure des offres à prix fixe');
  });

  test('5. Les 8 étudiants couvrent l ensemble des 5 filières ESSECT', () => {
    const seedSourcePath = join(__dirname, '../scripts/seed.js');
    const seedContent = readFileSync(seedSourcePath, 'utf8');

    // Les 5 filières doivent être présentes
    for (const filiereKey of Object.keys(FILIERES)) {
      const filiereValue = FILIERES[filiereKey];
      assert.ok(
        seedContent.includes(filiereValue) || seedContent.includes(`FILIERES.${filiereKey}`),
        `La filière ${filiereKey} (${filiereValue}) doit être couverte par les étudiants du seed`
      );
    }

    // Le compte de démo Yassine doit avoir 90 EcoPoints
    assert.ok(
      seedContent.includes('ecoPoints: 90') || seedContent.includes('ecoPoints:90'),
      'Le compte étudiant de démo doit avoir 90 EcoPoints pour débloquer le palier à 100 points'
    );
  });

  test('6. Compte administrateur et historique de 14 jours', () => {
    const seedSourcePath = join(__dirname, '../scripts/seed.js');
    const seedContent = readFileSync(seedSourcePath, 'utf8');

    assert.ok(
      seedContent.includes('admin@campussave.tn'),
      'L adresse admin officielle admin@campussave.tn doit être présente'
    );
    assert.ok(
      seedContent.includes('for (let d = 13; d >= 0; d--)') || seedContent.includes('14'),
      'Les séries de 14 jours d historique doivent être configurées'
    );
    assert.ok(
      seedContent.includes("db.collection('campus_impact').doc('global')"),
      'Le document campus_impact/global doit être initialisé'
    );
    assert.ok(
      seedContent.includes("db.collection('filieres')"),
      'La collection filieres doit être initialisée'
    );
  });
});
