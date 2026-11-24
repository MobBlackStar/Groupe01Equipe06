// 💡 Concept & Analogie : Comme un simulateur de vol qui permet aux pilotes de s'entraîner sans consommer de kérosène, ce magasin Firestore en mémoire permet de tester et faire tourner toute l'application sans clé Cloud externe.
// 🔄 Comparaison React / Flutter : Fournit la même interface de collections et documents Firestore que le SDK officiel, permettant un fonctionnement 100% autonome.
// 🎯 À retenir pour la soutenance : "Ce module offre un mode de démonstration déconnecté pré-peuplé avec les 6 commerces de Montfleury, 20 offres et 8 étudiants pour garantir zéro plantage devant le jury."

import { demoTokensAllowed } from '../utils/demoTokenPolicy.js';
import { buildDemoDataset } from '../../scripts/seed-data/demoDataset.js';
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
    // ArrayRemoveTransform d'abord : sa forme (`elements`) ressemble à celle d'ArrayUnion, il ne faut pas la confondre
    if (updateVal.constructor?.name === 'ArrayRemoveTransform') {
      const arr = Array.isArray(currentVal) ? [...currentVal] : [];
      const toRemove = updateVal.elements || [];
      return arr.filter((x) => !toRemove.includes(x));
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
    if (updateVal.constructor?.name === 'ArrayRemoveTransform') {
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
  seedDefaultData(nowMs = Date.now()) {
    // Même générateur que `scripts/seed.js` : le mode mémoire et Firestore contiennent exactement les mêmes chiffres.
    const { entries } = buildDemoDataset(nowMs);
    for (const { path, data } of entries) {
      this._store.set(path, data);
    }

  }
}

export function createInMemoryAuth(db) {
  return {
    async verifyIdToken(token, checkRevoked = false) {
      // Auth mémoire permissive = démo uniquement : jamais en production (sauf ALLOW_DEMO_TOKENS=true explicite)
      if (!demoTokensAllowed(process.env)) {
        const err = new Error('Jeton invalide : le mode démo est désactivé en production');
        err.code = 'auth/argument-error';
        throw err;
      }
      // Si jeton de test formalisé
      if (typeof token === 'string' && (token.startsWith('test-token:') || token.startsWith('mock-token:'))) {
        const parts = token.split(':');
        return {
          uid: parts[1] || 'student-yassine',
          role: parts[2] || 'STUDENT',
          email: parts[3] || 'etudiant@essect.u-tunis.tn',
        };
      }

      // Si token demo simplifié
      if (token === 'demo-student' || token?.includes('student')) {
        return {
          uid: 'student-yassine',
          role: 'STUDENT',
          email: 'etudiant@essect.u-tunis.tn',
          name: 'Yassine Trabelsi',
        };
      }
      if (token === 'demo-merchant' || token?.includes('merchant')) {
        return {
          uid: 'm-baguette',
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
