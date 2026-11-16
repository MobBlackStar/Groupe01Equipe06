// 💡 Concept & Analogie : Comme un simulateur de vol qui permet aux pilotes de s'entraîner sans consommer de kérosène, ce magasin Firestore en mémoire permet de tester et faire tourner toute l'application sans clé Cloud externe.
// 🔄 Comparaison React / Flutter : Fournit la même interface de collections et documents Firestore que le SDK officiel, permettant un fonctionnement 100% autonome.
// 🎯 À retenir pour la soutenance : "Ce module offre un mode de démonstration déconnecté pré-peuplé avec les 6 commerces de Montfleury, 20 offres et 8 étudiants pour garantir zéro plantage devant le jury."

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ROLES,
  OFFER_CATEGORIES,
  PRICING_MODES,
  SURPRISE_RARITY,
  MERCHANT_STATUS,
  FILIERES,
} from '../../../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepClone);
  const copy = {};
  for (const key of Object.keys(obj)) {
    copy[key] = deepClone(obj[key]);
  }
  return copy;
}

function getNestedValue(obj, path) {
  if (!obj) return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[p];
  }
  return curr;
}

function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!curr[p] || typeof curr[p] !== 'object') {
      curr[p] = {};
    }
    curr = curr[p];
  }
  const last = parts[parts.length - 1];
  curr[last] = value;
}

function applyTransform(currentVal, updateVal) {
  if (updateVal && typeof updateVal === 'object') {
    // NumericIncrementTransform
    if (updateVal.constructor?.name === 'NumericIncrementTransform' || ('operand' in updateVal && typeof updateVal.operand === 'number')) {
      return (Number(currentVal) || 0) + updateVal.operand;
    }
    // ServerTimestampTransform
    if (updateVal.constructor?.name === 'ServerTimestampTransform') {
      return new Date().toISOString();
    }
    // ArrayUnionTransform
    if (updateVal.constructor?.name === 'ArrayUnionTransform' || ('elements' in updateVal && Array.isArray(updateVal.elements))) {
      const arr = Array.isArray(currentVal) ? [...currentVal] : [];
      for (const el of updateVal.elements || []) {
        if (!arr.includes(el)) arr.push(el);
      }
      return arr;
    }
    // ArrayRemoveTransform
    if (updateVal.constructor?.name === 'ArrayRemoveTransform' || ('elements' in updateVal && Array.isArray(updateVal.elements))) {
      const arr = Array.isArray(currentVal) ? [...currentVal] : [];
      const toRemove = updateVal.elements || [];
      return arr.filter((x) => !toRemove.includes(x));
    }
  }
  return updateVal;
}

class InMemoryDocumentSnapshot {
  constructor(ref, data) {
    this._ref = ref;
    this.id = ref.id;
    this.exists = data !== null && data !== undefined;
    this._data = data ? deepClone(data) : null;
  }

  get ref() {
    return this._ref;
  }

  data() {
    return this._data ? deepClone(this._data) : undefined;
  }

  get(field) {
    return this._data ? getNestedValue(this._data, field) : undefined;
  }
}

class InMemoryDocumentReference {
  constructor(db, path) {
    this._db = db;
    this.path = path.replace(/^\/+|\/+$/g, '');
    const parts = this.path.split('/');
    this.id = parts[parts.length - 1];
  }

  collection(subColName) {
    return new InMemoryCollectionReference(this._db, `${this.path}/${subColName}`);
  }

  async get() {
    const raw = this._db._store.get(this.path);
    return new InMemoryDocumentSnapshot(this, raw);
  }

  async set(data, options = {}) {
    const existing = this._db._store.get(this.path) || {};
    let finalData;
    if (options.merge) {
      finalData = deepClone(existing);
      for (const key of Object.keys(data)) {
        if (key.includes('.')) {
          setNestedValue(finalData, key, data[key]);
        } else {
          finalData[key] = data[key];
        }
      }
    } else {
      finalData = deepClone(data);
    }
    this._db._store.set(this.path, finalData);
    return { writeTime: new Date() };
  }

  async update(fields) {
    const existing = this._db._store.get(this.path);
    if (!existing) {
      const err = new Error(`NOT_FOUND: No document to update: ${this.path}`);
      err.code = 5;
      throw err;
    }
    const finalData = deepClone(existing);
    for (const [key, val] of Object.entries(fields)) {
      const currentVal = getNestedValue(finalData, key);
      const transformed = applyTransform(currentVal, val);
      if (key.includes('.')) {
        setNestedValue(finalData, key, transformed);
      } else {
        finalData[key] = transformed;
      }
    }
    this._db._store.set(this.path, finalData);
    return { writeTime: new Date() };
  }

  async delete() {
    this._db._store.delete(this.path);
    return { writeTime: new Date() };
  }
}

class InMemoryQuery {
  constructor(db, collectionPath, filters = [], orderBys = [], limitCount = null) {
    this._db = db;
    this._collectionPath = collectionPath.replace(/^\/+|\/+$/g, '');
    this._filters = filters;
    this._orderBys = orderBys;
    this._limitCount = limitCount;
  }

  where(field, op, val) {
    return new InMemoryQuery(
      this._db,
      this._collectionPath,
      [...this._filters, { field, op, val }],
      this._orderBys,
      this._limitCount
    );
  }

  orderBy(field, dir = 'asc') {
    return new InMemoryQuery(
      this._db,
      this._collectionPath,
      this._filters,
      [...this._orderBys, { field, dir }],
      this._limitCount
    );
  }

  limit(n) {
    return new InMemoryQuery(
      this._db,
      this._collectionPath,
      this._filters,
      this._orderBys,
      n
    );
  }

  count() {
    return {
      get: async () => {
        const snap = await this.get();
        return {
          data: () => ({ count: snap.size }),
        };
      },
    };
  }

  async get() {
    const prefix = `${this._collectionPath}/`;
    const docs = [];

    for (const [docPath, rawData] of this._db._store.entries()) {
      // Vérifier que le document appartient directement à cette collection (pas à une sous-collection)
      if (!docPath.startsWith(prefix)) continue;
      const subPath = docPath.slice(prefix.length);
      if (subPath.includes('/')) continue; // Appartient à une sous-collection

      const docSnap = new InMemoryDocumentSnapshot(
        new InMemoryDocumentReference(this._db, docPath),
        rawData
      );

      // Application des filtres
      let matches = true;
      for (const f of this._filters) {
        const docVal = docSnap.get(f.field);
        matches = this._matchesFilter(docVal, f.op, f.val);
        if (!matches) break;
      }

      if (matches) {
        docs.push(docSnap);
      }
    }

    // Tri (orderBy)
    if (this._orderBys.length > 0) {
      docs.sort((a, b) => {
        for (const ob of this._orderBys) {
          const valA = a.get(ob.field);
          const valB = b.get(ob.field);
          const dirMultiplier = ob.dir === 'desc' ? -1 : 1;
          if (valA < valB) return -1 * dirMultiplier;
          if (valA > valB) return 1 * dirMultiplier;
        }
        return 0;
      });
    }

    // Limite
    const finalDocs = this._limitCount !== null ? docs.slice(0, this._limitCount) : docs;

    return {
      empty: finalDocs.length === 0,
      size: finalDocs.length,
      docs: finalDocs,
      forEach: (fn) => finalDocs.forEach(fn),
    };
  }

  _matchesFilter(docVal, op, targetVal) {
    // Normalisation des dates pour comparaison temporelle
    let a = docVal;
    let b = targetVal;

    if (a instanceof Date) a = a.getTime();
    else if (typeof a === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(a)) a = new Date(a).getTime();
    else if (a && typeof a.toDate === 'function') a = a.toDate().getTime();

    if (b instanceof Date) b = b.getTime();
    else if (typeof b === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(b)) b = new Date(b).getTime();
    else if (b && typeof b.toDate === 'function') b = b.toDate().getTime();

    switch (op) {
      case '==':
        return a === b;
      case '!=':
        return a !== b;
      case '<':
        return a < b;
      case '<=':
        return a <= b;
      case '>':
        return a > b;
      case '>=':
        return a >= b;
      case 'in':
        return Array.isArray(targetVal) && targetVal.includes(docVal);
      case 'not-in':
        return Array.isArray(targetVal) && !targetVal.includes(docVal);
      case 'array-contains':
        return Array.isArray(docVal) && docVal.includes(targetVal);
      case 'array-contains-any':
        return Array.isArray(docVal) && Array.isArray(targetVal) && docVal.some((x) => targetVal.includes(x));
      default:
        return a === b;
    }
  }
}

class InMemoryCollectionReference extends InMemoryQuery {
  constructor(db, path) {
    super(db, path);
    this.path = path.replace(/^\/+|\/+$/g, '');
    const parts = this.path.split('/');
    this.id = parts[parts.length - 1];
  }

  doc(id) {
    const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return new InMemoryDocumentReference(this._db, `${this.path}/${docId}`);
  }

  async add(data) {
    const docRef = this.doc();
    await docRef.set(data);
    return docRef;
  }
}

class InMemoryWriteBatch {
  constructor(db) {
    this._db = db;
    this._ops = [];
  }

  set(docRef, data, options = {}) {
    this._ops.push({ type: 'set', docRef, data, options });
    return this;
  }

  update(docRef, data) {
    this._ops.push({ type: 'update', docRef, data });
    return this;
  }

  delete(docRef) {
    this._ops.push({ type: 'delete', docRef });
    return this;
  }

  async commit() {
    for (const op of this._ops) {
      if (op.type === 'set') {
        await op.docRef.set(op.data, op.options);
      } else if (op.type === 'update') {
        await op.docRef.update(op.data);
      } else if (op.type === 'delete') {
        await op.docRef.delete();
      }
    }
    return [];
  }
}

export class InMemoryFirestore {
  constructor() {
    this._store = new Map();
  }

  collection(path) {
    return new InMemoryCollectionReference(this, path);
  }

  doc(path) {
    return new InMemoryDocumentReference(this, path);
  }

  batch() {
    return new InMemoryWriteBatch(this);
  }

  async runTransaction(updateFunction) {
    const stagedUpdates = [];
    const transaction = {
      get: async (docRef) => await docRef.get(),
      set: (docRef, data, options) => {
        stagedUpdates.push({ type: 'set', docRef, data, options });
      },
      update: (docRef, data) => {
        stagedUpdates.push({ type: 'update', docRef, data });
      },
      delete: (docRef) => {
        stagedUpdates.push({ type: 'delete', docRef });
      },
    };

    const result = await updateFunction(transaction);

    // Exécution atomique des écritures
    for (const op of stagedUpdates) {
      if (op.type === 'set') await op.docRef.set(op.data, op.options);
      if (op.type === 'update') await op.docRef.update(op.data);
      if (op.type === 'delete') await op.docRef.delete();
    }

    return result;
  }

  /**
   * Pré-remplit le magasin avec le jeu de données officiel pour la démo
   */
  seedDefaultData() {
    const now = new Date();
    const nowMs = now.getTime();

    // 1. COMMERCES
    let rawMerchants = [];
    try {
      const merchantsPath = join(__dirname, '../../scripts/seed-data/merchants.json');
      const parsed = JSON.parse(readFileSync(merchantsPath, 'utf8'));
      rawMerchants = parsed.merchants || [];
    } catch {
      rawMerchants = [
        { id: 'm-baguette', name: 'Baguette & Baguette Montfleury', type: 'FAST_FOOD', address: { street: 'Avenue Habib Bourguiba' }, location: { lat: 36.7885, lng: 10.1762 }, distanceFromEssectM: 210, walkingMinutes: 3 },
        { id: 'm-chaker', name: 'Chez Chaker Montfleury', type: 'FAST_FOOD', address: { street: 'Rue Abou el Kacem Chebbi' }, location: { lat: 36.7879, lng: 10.1755 }, distanceFromEssectM: 180, walkingMinutes: 2 },
        { id: 'm-patisserie', name: 'Pâtisserie Masmoudi Bab Jedid', type: 'PATISSERIE', address: { street: 'Place Bab Jedid' }, location: { lat: 36.7901, lng: 10.1728 }, distanceFromEssectM: 450, walkingMinutes: 6 },
        { id: 'm-doyen', name: 'Restaurant Universitaire Le Doyen', type: 'RESTAURANT', address: { street: 'Boulevard du 9 Avril' }, location: { lat: 36.7865, lng: 10.1772 }, distanceFromEssectM: 290, walkingMinutes: 4 },
        { id: 'm-vert', name: 'Cafétéria Le Campus Vert', type: 'CAFETERIA', address: { street: 'Rue des Entrepreneurs' }, location: { lat: 36.7874, lng: 10.1741 }, distanceFromEssectM: 95, walkingMinutes: 1 },
        { id: 'm-le-phare', name: 'Fast-Food Le Phare (En Attente)', type: 'FAST_FOOD', address: { street: 'Rue de la Kasbah' }, location: { lat: 36.7925, lng: 10.169 }, distanceFromEssectM: 850, walkingMinutes: 11 },
      ];
    }

    for (let i = 0; i < rawMerchants.length; i++) {
      const m = rawMerchants[i];
      const status = i === 5 ? MERCHANT_STATUS.PENDING : MERCHANT_STATUS.APPROVED;
      this._store.set(`merchants/${m.id}`, {
        id: m.id,
        name: m.name,
        tradeName: m.name,
        type: m.type || 'FAST_FOOD',
        phone: m.phone || '+21671390111',
        address: m.address || { street: 'Rue Montfleury' },
        location: m.location || { lat: 36.7885, lng: 10.1762 },
        distanceFromEssectM: m.distanceFromEssectM || 250,
        walkingMinutes: m.walkingMinutes || 3,
        status,
        ratingAvg: status === MERCHANT_STATUS.APPROVED ? 4.8 : 0,
        ratingCount: status === MERCHANT_STATUS.APPROVED ? 42 : 0,
        ratingSum: status === MERCHANT_STATUS.APPROVED ? 201 : 0,
        stats: {
          offersPublished: 14 + i * 2,
          ordersPaid: 28 + i * 5,
          ordersCompleted: 26 + i * 5,
          noShows: i % 2 === 0 ? 1 : 0,
          revenueMillimes: (26 + i * 5) * 3500,
          foodSavedGrams: (26 + i * 5) * 400,
          co2SavedGrams: Math.round((26 + i * 5) * 400 * 2.5),
          mealsRescued: 26 + i * 5,
        },
        createdAt: new Date(nowMs - 20 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    // 2. OFFRES (20 offres réalistes)
    const offersConfig = [
      { id: 'off-1', merchantId: 'm-chaker', title: 'Makloub Escalope Panée & Double Fromage', category: 'SANDWICH', pricingType: 'DUTCH_AUCTION', originalPriceMillimes: 7500, targetPriceMillimes: 3800, quantityAvailable: 4, pickupStartAt: new Date(nowMs - 3600000).toISOString(), pickupEndAt: new Date(nowMs + 7200000).toISOString(), isSurpriseBasket: false },
      { id: 'off-2', merchantId: 'm-baguette', title: 'Baguette Farcie Poulet & Mozzarella', category: 'SANDWICH', pricingType: 'FIXED', originalPriceMillimes: 6500, targetPriceMillimes: 3200, quantityAvailable: 3, pickupStartAt: new Date(nowMs - 1800000).toISOString(), pickupEndAt: new Date(nowMs + 5400000).toISOString(), isSurpriseBasket: false },
      { id: 'off-3', merchantId: 'm-patisserie', title: 'Lot 4 Pâtisseries Orientales & Baklawa', category: 'PATISSERIE', pricingType: 'FIXED', originalPriceMillimes: 8000, targetPriceMillimes: 3900, quantityAvailable: 5, pickupStartAt: new Date(nowMs - 7200000).toISOString(), pickupEndAt: new Date(nowMs + 3600000).toISOString(), isSurpriseBasket: false },
      { id: 'off-4-mystery-rare', merchantId: 'm-chaker', title: 'Panier Surprise Chaud — Spécialités Chaker', category: 'MIXTE', pricingType: 'FIXED', originalPriceMillimes: 12000, targetPriceMillimes: 4500, quantityAvailable: 2, pickupStartAt: new Date(nowMs - 1800000).toISOString(), pickupEndAt: new Date(nowMs + 7200000).toISOString(), isSurpriseBasket: true, rarity: 'RARE' },
      { id: 'off-5', merchantId: 'm-doyen', title: 'Plat Chaud Ojja Merguez Tunisienne', category: 'PLAT_CHAUD', pricingType: 'DUTCH_AUCTION', originalPriceMillimes: 8500, targetPriceMillimes: 4200, quantityAvailable: 3, pickupStartAt: new Date(nowMs - 3600000).toISOString(), pickupEndAt: new Date(nowMs + 3600000).toISOString(), isSurpriseBasket: false },
      { id: 'off-6', merchantId: 'm-vert', title: 'Salade Fraîche César & Blanc de Poulet', category: 'SALADE', pricingType: 'FIXED', originalPriceMillimes: 5500, targetPriceMillimes: 2800, quantityAvailable: 4, pickupStartAt: new Date(nowMs - 1800000).toISOString(), pickupEndAt: new Date(nowMs + 5400000).toISOString(), isSurpriseBasket: false },
      { id: 'off-7-mystery-common', merchantId: 'm-vert', title: 'Panier Surprise Sandwich & Boisson Fraîche', category: 'MIXTE', pricingType: 'FIXED', originalPriceMillimes: 7000, targetPriceMillimes: 2900, quantityAvailable: 3, pickupStartAt: new Date(nowMs - 1800000).toISOString(), pickupEndAt: new Date(nowMs + 5400000).toISOString(), isSurpriseBasket: true, rarity: 'COMMON' },
      { id: 'off-8-mystery-legendary', merchantId: 'm-patisserie', title: 'Mystery Box Royale Pâtisserie & Gâteau', category: 'PATISSERIE', pricingType: 'FIXED', originalPriceMillimes: 16000, targetPriceMillimes: 5900, quantityAvailable: 1, pickupStartAt: new Date(nowMs - 1800000).toISOString(), pickupEndAt: new Date(nowMs + 7200000).toISOString(), isSurpriseBasket: true, rarity: 'LEGENDARY' },
    ];

    for (let i = 1; i <= 20; i++) {
      const cfg = offersConfig[(i - 1) % offersConfig.length];
      const offerId = `off-${i}`;
      this._store.set(`offers/${offerId}`, {
        ...cfg,
        id: offerId,
        status: 'ACTIVE',
        description: `Panier anti-gaspillage de qualité préparé avec soin par ${cfg.merchantId}.`,
        createdAt: new Date(nowMs - 3600000 * i).toISOString(),
        updatedAt: now.toISOString(),
      });

      if (cfg.isSurpriseBasket) {
        this._store.set(`offers/${offerId}/private/contents`, {
          summary: cfg.rarity === 'LEGENDARY' ? 'Festin Royal : Gâteau d anniversaire amandes & assortiment de 6 pâtisseries fines' : '2 Makloubs complets avec canettes et frites chaudes',
          rarity: cfg.rarity,
          bonusEcoPoints: cfg.rarity === 'LEGENDARY' ? 30 : (cfg.rarity === 'RARE' ? 10 : 0),
        });
      }
    }

    // 3. ÉTUDIANTS (avec Yassine à 90 EcoPoints)
    this._store.set('users/student-demo-uid', {
      uid: 'student-demo-uid',
      email: 'etudiant@essect.u-tunis.tn',
      displayName: 'Yassine Trabelsi',
      role: 'STUDENT',
      filiereId: 'EBUSINESS_3A',
      phone: '+21698123456',
      ecoPoints: 90,
      loyaltyTier: 'GRAINE',
      nextRewardAt: 100,
      totalMealsRescued: 4,
      status: 'ACTIVE',
      unlockedRewards: [
        {
          id: 'rew-welcome-20',
          type: 'PERCENT_OFF',
          discountPercent: 20,
          maxDiscountMillimes: 2000,
          description: 'Coupon Bienvenue Étudiant -20%',
          status: 'AVAILABLE',
          unlockedAt: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(),
        },
      ],
      stats: {
        ordersCompleted: 4,
        totalSpentMillimes: 14500,
        totalSavedMillimes: 18000,
        foodSavedGrams: 1600,
        co2SavedGrams: 4000,
        noShows: 0,
      },
    });

    // 4. ADMIN
    this._store.set('users/admin-uid', {
      uid: 'admin-uid',
      email: 'admin@campussave.tn',
      displayName: 'Administrateur ESSECT',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    // 5. CLASSEMENT DES FILIÈRES
    const filieres = [
      { filiereId: 'EBUSINESS_3A', label: '3ème E-Business (Promotion Pilote)', studentsCount: 38, ordersCompleted: 45, mealsRescued: 52, foodSavedGrams: 20800, co2SavedGrams: 52000, ecoPointsTotal: 1240 },
      { filiereId: 'FINANCE', label: 'Licence & Master Finance', studentsCount: 65, ordersCompleted: 34, mealsRescued: 39, foodSavedGrams: 15600, co2SavedGrams: 39000, ecoPointsTotal: 920 },
      { filiereId: 'MARKETING', label: 'Licence & Master Marketing', studentsCount: 52, ordersCompleted: 28, mealsRescued: 31, foodSavedGrams: 12400, co2SavedGrams: 31000, ecoPointsTotal: 760 },
      { filiereId: 'GESTION', label: 'Sciences de Gestion', studentsCount: 70, ordersCompleted: 22, mealsRescued: 25, foodSavedGrams: 10000, co2SavedGrams: 25000, ecoPointsTotal: 580 },
      { filiereId: 'COMPTABILITE', label: 'Comptabilité & CCA', studentsCount: 45, ordersCompleted: 18, mealsRescued: 20, foodSavedGrams: 8000, co2SavedGrams: 20000, ecoPointsTotal: 490 },
    ];
    for (const f of filieres) {
      this._store.set(`filieres/${f.filiereId}`, f);
    }

    // 6. IMPACT GLOBAL CAMPUS
    this._store.set('campus_impact/global', {
      ordersCompleted: 248,
      mealsRescued: 285,
      foodSavedGrams: 114000,
      co2SavedGrams: 285000,
      moneySavedMillimes: 890000,
      studentsParticipating: 8,
      merchantsParticipating: 5,
      updatedAt: now.toISOString(),
    });

    // 14 jours de séries historiques
    for (let d = 13; d >= 0; d--) {
      const dayDate = new Date(nowMs - d * 24 * 3600 * 1000);
      const isoDate = dayDate.toISOString().split('T')[0];
      const dayOrders = 10 + (d % 5) * 2;
      const dayMeals = dayOrders + 2;
      const dayFoodGrams = dayMeals * 400;
      this._store.set(`campus_impact/global/daily/${isoDate}`, {
        date: isoDate,
        ordersCompleted: dayOrders,
        mealsRescued: dayMeals,
        foodSavedGrams: dayFoodGrams,
        co2SavedGrams: Math.round(dayFoodGrams * 2.5),
        moneySavedMillimes: dayOrders * 3500,
      });
    }
  }
}

export function createInMemoryAuth(db) {
  return {
    async verifyIdToken(token, checkRevoked = false) {
      // Si jeton de test formalisé
      if (typeof token === 'string' && (token.startsWith('test-token:') || token.startsWith('mock-token:'))) {
        const parts = token.split(':');
        return {
          uid: parts[1] || 'student-demo-uid',
          role: parts[2] || 'STUDENT',
          email: parts[3] || 'etudiant@essect.u-tunis.tn',
        };
      }

      // Si token demo simplifié
      if (token === 'demo-student' || token?.includes('student')) {
        return {
          uid: 'student-demo-uid',
          role: 'STUDENT',
          email: 'etudiant@essect.u-tunis.tn',
          name: 'Yassine Trabelsi',
        };
      }
      if (token === 'demo-merchant' || token?.includes('merchant')) {
        return {
          uid: 'm-chaker',
          role: 'MERCHANT',
          email: 'chaker@montfleury.tn',
          name: 'Chez Chaker',
        };
      }
      if (token === 'demo-admin' || token?.includes('admin')) {
        return {
          uid: 'admin-uid',
          role: 'ADMIN',
          email: 'admin@campussave.tn',
          name: 'Administrateur ESSECT',
        };
      }

      // Par défaut pour le mode développement local
      return {
        uid: 'student-demo-uid',
        role: 'STUDENT',
        email: 'etudiant@essect.u-tunis.tn',
        name: 'Yassine Trabelsi',
      };
    },

    async getUser(uid) {
      const snap = await db.collection('users').doc(uid).get();
      if (snap.exists) {
        const u = snap.data();
        return {
          uid: u.uid || uid,
          email: u.email,
          displayName: u.displayName,
          customClaims: { role: u.role },
        };
      }
      return {
        uid,
        email: `${uid}@essect.tn`,
        displayName: 'Utilisateur CampusSave',
        customClaims: { role: 'STUDENT' },
      };
    },

    async setCustomUserClaims(uid, claims) {
      const userRef = db.collection('users').doc(uid);
      const snap = await userRef.get();
      if (snap.exists) {
        await userRef.update({ role: claims.role, customClaims: claims });
      }
    },
  };
}

export function createInMemoryMessaging() {
  return {
    async send(message) {
      return `mock-fcm-msg-${Date.now()}`;
    },
    async sendEachForMulticast(message) {
      const tokens = message.tokens || [];
      return {
        successCount: tokens.length,
        failureCount: 0,
        responses: tokens.map((t) => ({ success: true, messageId: `msg-${t}` })),
      };
    },
  };
}
