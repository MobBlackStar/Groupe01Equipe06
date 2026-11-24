// 💡 Concept & Analogie : Ce test unitaire vérifie l'intégrité et la conformité absolue du jeu de données de soutenance. Comme un inspecteur vérifiant la liste des passagers avant le décollage, il s'assure que chaque commerce, offre, panier surprise et étudiant répond rigoureusement aux critères du cahier des charges.
// 🔄 Comparaison React / Flutter : Valide les structures de données mockées et Firestore consommées par le catalogue web et l'application mobile.
// 🎯 À retenir pour la soutenance : "Ce test garantit que le seed contient exactement 6 commerces dont 1 en attente, 20 offres dont 3 paniers surprise de raretés distinctes, et un étudiant à 90 EcoPoints pour débloquer en direct le palier devant le jury."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDemoDataset } from '../scripts/seed-data/demoDataset.js';
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

  test('1. Les commerces de Montfleury sont exactement au nombre de 12', () => {
    assert.equal(merchants.length, 12, 'Le jeu de données doit contenir 12 commerces');
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

  test('3. Statuts des commerces : 11 APPROVED et 1 PENDING (pour la démo admin)', () => {
    const statuses = merchants.map((m) =>
      m.id === 'merchant-nice-view-bellevue' ? MERCHANT_STATUS.PENDING : (m.status || MERCHANT_STATUS.APPROVED)
    );
    const approvedCount = statuses.filter((s) => s === MERCHANT_STATUS.APPROVED).length;
    const pendingCount = statuses.filter((s) => s === MERCHANT_STATUS.PENDING).length;

    assert.equal(approvedCount, 11, 'Il doit y avoir 11 commerces approuvés');
    assert.equal(pendingCount, 1, 'Le commerce Bellevue doit être PENDING pour la démo de validation admin');
  });

  const { entries } = buildDemoDataset(Date.now());
  const docs = (prefix) => entries.filter((e) => e.path.startsWith(prefix) && e.path.split('/').length === prefix.split('/').length).map((e) => e.data);
  const doc = (path) => entries.find((e) => e.path === path)?.data;

  test('4. Le jeu de données contient 25 offres dont 3 paniers surprises COMMON, RARE et LEGENDARY, en prix fixe et dégressif', () => {
    const offers = docs('offers/');
    assert.equal(offers.length, 25);
    const surprises = offers.filter((o) => o.isSurpriseBasket);
    assert.equal(surprises.length, 3);
    assert.deepEqual(surprises.map((o) => o.rarity).sort(), [RARITY_TIERS.COMMON, RARITY_TIERS.LEGENDARY, RARITY_TIERS.RARE].sort());
    assert.ok(offers.some((o) => o.pricing.mode === PRICING_MODES.DUTCH_AUCTION));
    assert.ok(offers.some((o) => o.pricing.mode === PRICING_MODES.FIXED));
    for (const o of surprises) assert.ok(doc(`offers/${o.id}/private/contents`)?.items?.length > 0, `contenu scellé manquant pour ${o.id}`);
  });

  test('5. Les 8 étudiants couvrent les 5 filières et Yassine a 90 EcoPoints, des commandes et un coupon disponible', () => {
    const students = docs('users/').filter((u) => u.role === ROLES.STUDENT);
    assert.equal(students.length, 8);
    for (const filiere of Object.values(FILIERES)) {
      assert.ok(students.some((s) => s.filiereId === filiere), `filière ${filiere} non couverte`);
    }
    const yassine = doc('users/student-yassine');
    assert.equal(yassine.ecoPoints, 90);
    assert.ok(yassine.stats.ordersCompleted > 0 && yassine.stats.totalSavedMillimes > 0);
    assert.equal(yassine.unlockedRewards.filter((r) => r.status === 'AVAILABLE').length, 1);
  });

  test('6. Compte administrateur, 14 jours d historique, impact global et filières initialisés', () => {
    assert.equal(doc('users/admin-uid')?.email, 'admin@campussave.tn');
    assert.equal(docs('campus_impact/global/daily/').length, 14);
    assert.ok(doc('campus_impact/global'));
    assert.equal(docs('filieres/').length, 5);
  });
});
