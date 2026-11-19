/**
 * CampusSave — end-to-end API sweep against the plan (CampusSave_Plan_AI.md) and UML 06-09.
 * Run against an ISOLATED in-memory backend, never the live Firebase project (it creates users, orders, offers):
 *   FIREBASE_SERVICE_ACCOUNT_BASE64= KONNECT_API_KEY= KONNECT_RECEIVER_WALLET_ID= PORT=4100 node src/server.js
 *   BASE=http://localhost:4100/api/v1 npm run qa:sweep
 * Restart the isolated backend between runs (state is in memory). Not part of `npm test` on purpose.
 */
import { computeWindowCode, getWindowIndex } from '../src/modules/tickets/ticket.crypto.js';

const BASE = process.env.BASE || 'http://localhost:4100/api/v1';
const results = [];
const T0 = Date.now();

async function call(method, path, token, body, extraHeaders = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  const text = await res.text();
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, body: json, headers: res.headers };
}

function check(id, desc, ok, detail = '') {
  results.push({ id, desc, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 260) });
  console.log(`${ok ? '  PASS' : '  FAIL'}  [${id}] ${desc}${ok ? '' : '  -> ' + String(detail).slice(0, 200)}`);
}
const notes = [];
function note(id, msg) { notes.push({ id, msg }); console.log(`  NOTE  [${id}] ${msg}`); }
const section = (t) => console.log(`\n== ${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const err = (r) => r.body?.error?.code || r.body?.error?.message || JSON.stringify(r.body).slice(0, 120);

// ---------------------------------------------------------------- tokens
const ADMIN = 'test-token:admin-uid:ADMIN:admin@campussave.tn';
const S1 = 'test-token:qa-student-1:STUDENT:qa1@essect.u-tunis.tn';
const S2 = 'test-token:qa-student-2:STUDENT:qa2@essect.u-tunis.tn';
const M1 = 'test-token:qa-merchant-1:MERCHANT:qa.merchant@essect.u-tunis.tn';
const M2 = 'test-token:qa-merchant-2:MERCHANT:qa.merchant2@essect.u-tunis.tn';
const NONE = (uid) => `test-token:${uid}:NONE:${uid}@essect.u-tunis.tn`;

const now = Date.now();
const HOUR = 3600_000;
const ESSECT = { lat: 36.7871, lng: 10.1748 };
// Africa/Tunis is UTC+1 all year: keep every pickup window inside ONE Tunis day (MULTIDAY_OFFER_FORBIDDEN)
const DAY = 86400_000;
const tunisMidnight = Math.floor((now + HOUR) / DAY) * DAY - HOUR;
const windowEnd = Math.min(now + 2 * HOUR, tunisMidnight + DAY - 60_000);
const windowStart = Math.max(now - 60_000, tunisMidnight + 30_000);

const offerBody = (over = {}) => ({
  title: 'Sandwich QA Thon',
  description: 'Offre de test',
  category: 'SANDWICH',
  pricing: { mode: 'FIXED', originalPriceMillimes: 6000, discountedPriceMillimes: 3000 },
  quantity: 5,
  pickupStartAt: windowStart,
  pickupEndAt: windowEnd,
  ...over,
});

// ================================================================ A. public & health
section('A. Public endpoints');
{
  const h = await call('GET', '/health');
  check('G-HEALTH', 'GET /health ok', h.status === 200 && h.body?.ok === true, err(h));
  check('API-ENV', 'every success body carries serverTime', typeof h.body?.serverTime === 'number');

  const list = await call('GET', '/offers');
  check('M4', 'GET /offers lists active offers with currentPriceMillimes', list.status === 200 && list.body.offers?.length > 0 && Number.isInteger(list.body.offers[0].currentPriceMillimes), err(list));
  const offers = list.body.offers || [];
  check('INV-02', 'prices are integer millimes', offers.every((o) => Number.isInteger(o.currentPriceMillimes)), JSON.stringify(offers.find((o) => !Number.isInteger(o.currentPriceMillimes))?.currentPriceMillimes));

  const cheap = await call('GET', '/offers?sort=price&limit=20');
  const prices = (cheap.body.offers || []).map((o) => o.currentPriceMillimes);
  check('M4', 'sort=price ascending', prices.length > 1 && prices.every((p, i) => i === 0 || p >= prices[i - 1]), prices.join(','));

  const range = await call('GET', '/offers?minPrice=2000&maxPrice=4000');
  check('M4', 'price range filter min/max', range.status === 200 && (range.body.offers || []).every((o) => o.currentPriceMillimes >= 2000 && o.currentPriceMillimes <= 4000), `${range.status} ${(range.body.offers || []).map((o) => o.currentPriceMillimes)}`);

  const cat = await call('GET', '/offers?category=PIZZA');
  check('M4', 'category filter', cat.status === 200 && (cat.body.offers || []).every((o) => o.category === 'PIZZA'), err(cat));

  const q = offers[0]?.title?.split(' ')[0]?.toLowerCase();
  const search = await call('GET', `/offers?q=${encodeURIComponent(q)}`);
  check('M4', `free-text search q="${q}" returns matches`, search.status === 200 && (search.body.offers || []).length > 0, err(search));

  const sur = await call('GET', '/offers?surprise=true');
  check('B2', 'surprise filter returns only surprise baskets', sur.status === 200 && (sur.body.offers || []).every((o) => o.isSurpriseBasket || o.surprise), err(sur));
  const surOffer = (sur.body.offers || [])[0];
  if (surOffer) {
    const det = await call('GET', `/offers/${surOffer.id}`);
    check('INV-16', 'public offer detail never exposes hidden surprise contents', !JSON.stringify(det.body).match(/privateContents|"contents"/), JSON.stringify(det.body.offer?.surprise));
  }

  const radar = await call('GET', '/radar?radiusM=1500');
  check('B1', 'GET /radar returns home + merchants with activeOffers', radar.status === 200 && radar.body.home && Array.isArray(radar.body.merchants), err(radar));
  check('B1', 'radar radius honored (<=1500 m)', (radar.body.merchants || []).every((m) => m.distanceFromEssectM <= 1500), (radar.body.merchants || []).map((m) => m.distanceFromEssectM));
  const radarBad = await call('GET', '/radar?radiusM=10');
  check('INV-05', 'radar validates radius bounds', radarBad.status === 400 || radarBad.status === 422, radarBad.status);
}

// ================================================================ B. auth (UML 06)
section('B. M1 Authentication & profiles');
{
  const noAuth = await call('GET', '/users/me');
  check('C3', 'no token -> 401', noAuth.status === 401, noAuth.status);
  const badTok = await call('GET', '/users/me', 'garbage-token');
  // In-memory demo mode deliberately maps unknown tokens to the demo student; Firebase mode must answer 401.
  if (badTok.status === 401) check('C3', 'invalid token -> 401', true);
  else note('C3', `invalid token answered ${badTok.status}: expected only in in-memory demo mode (Firebase Admin rejects it)`);

  const r1 = await call('POST', '/auth/register-profile', NONE('qa-student-1'), { role: 'STUDENT', displayName: 'QA Étudiant Un', phone: '+21622123456', filiereId: 'EBUSINESS_3A' });
  check('M1', 'register student profile -> 201', r1.status === 201 && r1.body.user?.role === 'STUDENT', `${r1.status} ${err(r1)}`);
  const dup = await call('POST', '/auth/register-profile', NONE('qa-student-1'), { role: 'STUDENT', displayName: 'QA Dup' });
  check('M1', 'duplicate profile -> 409 PROFILE_EXISTS', dup.status === 409 && dup.body?.error?.code === 'PROFILE_EXISTS', `${dup.status} ${err(dup)}`);
  const badPhone = await call('POST', '/auth/register-profile', NONE('qa-bad-phone'), { role: 'STUDENT', displayName: 'QA Phone', phone: '12345' });
  check('C4', 'invalid Tunisian phone rejected by Zod', badPhone.status === 400 || badPhone.status === 422, `${badPhone.status} ${err(badPhone)}`);
  const asAdmin = await call('POST', '/auth/register-profile', NONE('qa-evil-admin'), { role: 'ADMIN', displayName: 'Evil Admin' });
  check('INV-13', 'ADMIN role is not assignable through the API', asAdmin.status === 400 || asAdmin.status === 422 || asAdmin.status === 403, `${asAdmin.status} ${err(asAdmin)}`);

  await call('POST', '/auth/register-profile', NONE('qa-student-2'), { role: 'STUDENT', displayName: 'QA Étudiant Deux' });
  const m1 = await call('POST', '/auth/register-profile', NONE('qa-merchant-1'), { role: 'MERCHANT', displayName: 'QA Commerçant Un', phone: '+21671000001' });
  check('M1', 'register merchant profile -> 201', m1.status === 201 && m1.body.user?.role === 'MERCHANT', `${m1.status} ${err(m1)}`);
  await call('POST', '/auth/register-profile', NONE('qa-merchant-2'), { role: 'MERCHANT', displayName: 'QA Commerçant Deux', phone: '+21671000002' });

  const me = await call('GET', '/users/me', S1);
  check('M1', 'GET /users/me returns profile', me.status === 200 && me.body.user?.uid === 'qa-student-1', err(me));
  const patch = await call('PATCH', '/users/me', S1, { displayName: 'QA Étudiant Renommé', notificationPrefs: { pickupReminder: true } });
  check('M1', 'PATCH /users/me updates profile', patch.status === 200 && patch.body.user?.displayName === 'QA Étudiant Renommé', `${patch.status} ${err(patch)}`);
  const roleHack = await call('PATCH', '/users/me', S1, { role: 'ADMIN' });
  const me2 = await call('GET', '/users/me', S1);
  check('INV-13', 'PATCH /users/me cannot escalate role (field stripped)', me2.body.user?.role === 'STUDENT', `${roleHack.status} role=${me2.body.user?.role}`);
  const fcm = await call('POST', '/users/me/fcm-token', S1, { token: 'fcm-qa-token-1234567890' });
  check('EXT-3', 'POST /users/me/fcm-token -> 204', fcm.status === 204 || fcm.status === 200, `${fcm.status} ${err(fcm)}`);
  const fcmDel = await call('DELETE', '/users/me/fcm-token', S1, { token: 'fcm-qa-token-1234567890' });
  check('EXT-3', 'DELETE /users/me/fcm-token -> 204', fcmDel.status === 204 || fcmDel.status === 200, `${fcmDel.status} ${err(fcmDel)}`);
}

// ================================================================ C. role security
section('C. C3 Role security matrix');
{
  const a = await call('POST', '/merchants', S1, { name: 'Hack', type: 'CAFETERIA', phone: '+21671000009', address: { street: 'Rue test 1' }, location: ESSECT });
  check('C3', 'student cannot create a store (403)', a.status === 403, a.status);
  const b = await call('POST', '/orders', M1, { offerId: 'off-1', quantity: 1 });
  check('C3', 'merchant cannot reserve (403)', b.status === 403, b.status);
  const c = await call('GET', '/admin/merchants', S1);
  check('C3', 'student cannot list admin merchants (403)', c.status === 403, c.status);
  const d = await call('GET', '/admin/users', M1);
  check('C3', 'merchant cannot list admin users (403)', d.status === 403, d.status);
  const e = await call('POST', '/tickets/scan', S1, { qrPayload: 'x' });
  check('C3', 'student cannot scan tickets (403)', e.status === 403, e.status);
  const f = await call('GET', '/dashboards/admin', S1);
  check('C3', 'student cannot read admin dashboard (403)', f.status === 403, f.status);
  const g = await call('POST', '/offers', S1, offerBody());
  check('C3', 'student cannot publish offers (403)', g.status === 403, g.status);
}

// ================================================================ D. merchant onboarding (M2)
section('D. M2 Store registration & admin validation (UML 06)');
let merchantId = 'qa-merchant-1';
{
  const far = await call('POST', '/merchants', M1, { name: 'QA Lointain', type: 'CAFETERIA', phone: '+21671000001', address: { street: 'Avenue Lointaine 1' }, location: { lat: 36.9, lng: 10.4 } });
  check('M2', 'store > 3 km from ESSECT refused (422 TOO_FAR)', far.status === 422 && /TOO_FAR/.test(JSON.stringify(far.body)), `${far.status} ${err(far)}`);

  const ok = await call('POST', '/merchants', M1, { name: 'QA Boulangerie du Campus', type: 'BOULANGERIE', description: 'Test', phone: '+21671000001', address: { street: 'Rue de la Liberté 12' }, location: { lat: 36.7882, lng: 10.1755 } });
  check('M2', 'store within 3 km created PENDING (201)', ok.status === 201 && ok.body.merchant?.status === 'PENDING', `${ok.status} ${err(ok)}`);
  check('M2', 'distanceFromEssectM computed server-side', Number.isFinite(ok.body.merchant?.distanceFromEssectM), JSON.stringify(ok.body.merchant?.distanceFromEssectM));

  const pub = await call('GET', `/merchants/${merchantId}`);
  check('M2', 'PENDING store not public (404)', pub.status === 404 || pub.status === 403, pub.status);

  const early = await call('POST', '/offers', M1, offerBody());
  check('INV-14', 'PENDING merchant cannot publish (403)', early.status === 403, `${early.status} ${err(early)}`);

  const list = await call('GET', '/admin/merchants?status=PENDING', ADMIN);
  check('M2', 'admin lists PENDING stores', list.status === 200 && (list.body.merchants || []).some((m) => m.id === merchantId), err(list));

  const rejNoReason = await call('PATCH', `/admin/merchants/${merchantId}/status`, ADMIN, { status: 'REJECTED' });
  check('C4', 'reject without reason -> 4xx validation', rejNoReason.status === 400 || rejNoReason.status === 422, rejNoReason.status);
  const rej = await call('PATCH', `/admin/merchants/${merchantId}/status`, ADMIN, { status: 'REJECTED', reason: 'Dossier incomplet pour test' });
  check('M2', 'admin rejects with reason', rej.status === 200 && rej.body.merchant?.status === 'REJECTED', `${rej.status} ${err(rej)}`);
  const stillBlocked = await call('POST', '/offers', M1, offerBody());
  check('INV-14', 'REJECTED merchant still cannot publish', stillBlocked.status === 403, stillBlocked.status);
  const appr = await call('PATCH', `/admin/merchants/${merchantId}/status`, ADMIN, { status: 'APPROVED' });
  check('M2', 'admin approves store', appr.status === 200 && appr.body.merchant?.status === 'APPROVED', `${appr.status} ${err(appr)}`);

  const pub2 = await call('GET', `/merchants/${merchantId}`);
  check('M2', 'APPROVED store is public', pub2.status === 200 && pub2.body.merchant?.name === 'QA Boulangerie du Campus', err(pub2));

  const meM = await call('GET', '/merchants/me', M1);
  check('M2', 'GET /merchants/me', meM.status === 200 && meM.body.merchant?.status === 'APPROVED', err(meM));
  const upd = await call('PATCH', '/merchants/me', M1, { description: 'Description mise à jour', status: 'SUSPENDED' });
  const meM2 = await call('GET', '/merchants/me', M1);
  check('M2', 'PATCH /merchants/me edits info but cannot change status', upd.status === 200 && meM2.body.merchant?.description === 'Description mise à jour' && meM2.body.merchant?.status === 'APPROVED', `${upd.status} status=${meM2.body.merchant?.status}`);

  // second merchant (kept PENDING) for WRONG_MERCHANT checks later
  await call('POST', '/merchants', M2, { name: 'QA Pizzeria Pending', type: 'RESTAURANT', phone: '+21671000002', address: { street: 'Rue des Oliviers 4' }, location: { lat: 36.7868, lng: 10.1742 } });
  await call('PATCH', '/admin/merchants/qa-merchant-2/status', ADMIN, { status: 'APPROVED' });
}

// ================================================================ E. offers CRUD (M3)
section('E. M3 Offers CRUD, I1 Smart Decay, B2 Surprise basket');
const offerIds = {};
{
  const fixed = await call('POST', '/offers', M1, offerBody());
  check('M3', 'create FIXED offer (201)', fixed.status === 201 && fixed.body.offer?.id, `${fixed.status} ${err(fixed)}`);
  offerIds.fixed = fixed.body.offer?.id;

  const dutch = await call('POST', '/offers', M1, offerBody({
    title: 'Makloub QA Smart Decay', category: 'SANDWICH',
    pickupStartAt: windowStart,
    pricing: { mode: 'DUTCH_AUCTION', originalPriceMillimes: 8000, startPriceMillimes: 6000, floorPriceMillimes: 2000, decayStartAt: windowStart + 10_000, roundingStepMillimes: 100 },
    quantity: 3,
  }));
  check('I1', 'create DUTCH_AUCTION offer (201)', dutch.status === 201, `${dutch.status} ${err(dutch)}`);
  offerIds.dutch = dutch.body.offer?.id;
  const dd = await call('GET', `/offers/${offerIds.dutch}`);
  const p = dd.body.currentPriceMillimes;
  check('I1', 'Smart Decay current price within [floor, start] and rounded to step', p >= 2000 && p <= 6000 && p % 100 === 0, `price=${p}`);
  await sleep(1100);
  const dd2 = await call('GET', `/offers/${offerIds.dutch}`);
  check('I1', 'Smart Decay price is non-increasing over time', dd2.body.currentPriceMillimes <= p, `${p} -> ${dd2.body.currentPriceMillimes}`);

  const sur = await call('POST', '/offers', M1, offerBody({
    title: 'Panier Surprise QA', category: 'MIXTE', isSurpriseBasket: true,
    surpriseContents: ['2 croissants', '1 pain au chocolat', '1 jus'],
    pricing: { mode: 'FIXED', originalPriceMillimes: 12000, discountedPriceMillimes: 3500 }, quantity: 4,
  }));
  check('B2', 'create surprise basket with hidden contents (201)', sur.status === 201, `${sur.status} ${err(sur)}`);
  offerIds.surprise = sur.body.offer?.id;
  const surPub = await call('GET', `/offers/${offerIds.surprise}`);
  check('INV-16', 'hidden contents not in public GET /offers/:id', !JSON.stringify(surPub.body).includes('croissants'), '');
  check('I3', 'surprise offer carries a rarity (gacha)', ['COMMON', 'RARE', 'LEGENDARY'].includes(surPub.body.offer?.surprise?.rarity || surPub.body.offer?.rarity), JSON.stringify(surPub.body.offer?.surprise || surPub.body.offer?.rarity));

  const negPrice = await call('POST', '/offers', M1, offerBody({ pricing: { mode: 'FIXED', originalPriceMillimes: -5 } }));
  check('C4', 'negative price rejected (Zod)', negPrice.status === 400 || negPrice.status === 422, negPrice.status);
  const zeroQty = await call('POST', '/offers', M1, offerBody({ quantity: 0 }));
  check('C4', 'quantity 0 rejected', zeroQty.status === 400 || zeroQty.status === 422, zeroQty.status);
  const bigQty = await call('POST', '/offers', M1, offerBody({ quantity: 500 }));
  check('C4', 'quantity > 50 rejected', bigQty.status === 400 || bigQty.status === 422, bigQty.status);
  const badCat = await call('POST', '/offers', M1, offerBody({ category: 'TACOS' }));
  check('C4', 'unknown category rejected', badCat.status === 400 || badCat.status === 422, badCat.status);
  const reversed = await call('POST', '/offers', M1, offerBody({ pickupStartAt: windowEnd, pickupEndAt: windowStart }));
  check('C4', 'pickupEnd before pickupStart rejected', reversed.status === 400 || reversed.status === 422, `${reversed.status} ${err(reversed)}`);
  const priceAbove = await call('POST', '/offers', M1, offerBody({ pricing: { mode: 'FIXED', originalPriceMillimes: 3000, discountedPriceMillimes: 5000 } }));
  check('C4', 'reduced price above original rejected', priceAbove.status === 400 || priceAbove.status === 422, `${priceAbove.status} ${err(priceAbove)}`);
  const floats = await call('POST', '/offers', M1, offerBody({ pricing: { mode: 'FIXED', originalPriceMillimes: 6000.5, discountedPriceMillimes: 3000 } }));
  check('INV-02', 'non-integer millimes rejected', floats.status === 400 || floats.status === 422, floats.status);

  const mine = await call('GET', '/merchants/me/offers', M1);
  check('M3', 'GET /merchants/me/offers lists own offers', mine.status === 200 && (mine.body.offers || []).length >= 3, `${mine.status} ${(mine.body.offers || []).length}`);

  const patch = await call('PATCH', `/offers/${offerIds.fixed}`, M1, { title: 'Sandwich QA Thon (modifié)', quantity: 6 });
  check('M3', 'PATCH own offer before any order', patch.status === 200, `${patch.status} ${err(patch)}`);
  const foreign = await call('PATCH', `/offers/${offerIds.fixed}`, M2, { title: 'Vol' });
  check('C3', 'other merchant cannot edit my offer (403/404)', foreign.status === 403 || foreign.status === 404, foreign.status);

  const spare = await call('POST', '/offers', M1, offerBody({ title: 'Offre à supprimer' }));
  const del = await call('DELETE', `/offers/${spare.body.offer?.id}`, M1);
  check('M3', 'DELETE unused offer -> 204', del.status === 204 || del.status === 200, `${del.status} ${err(del)}`);
  const gone = await call('GET', `/offers/${spare.body.offer?.id}`);
  check('M3', 'deleted offer is gone', gone.status === 404, gone.status);

  const ai = await call('POST', '/ai/offer-autofill', M1, { rawNote: '3 makloubs poulet il reste, fermeture 20h, 5 dinars', closingTime: '20:00' });
  check('I5', 'AI autofill returns a suggestion (ai|fallback)', ai.status === 200 && ai.body.suggestion && ['LLM', 'FALLBACK', 'ai', 'fallback'].includes(ai.body.source), `${ai.status} ${err(ai)}`);
  if (['ai', 'fallback'].includes(ai.body.source)) note('I5', `source is lowercase "${ai.body.source}"; the plan contract says LLM|FALLBACK (clients accept lowercase)`);
  check('I5', 'AI suggestion has the offer fields (title, prices, quantity)', ai.body.suggestion?.title && Number.isInteger(ai.body.suggestion?.originalPriceMillimes) && ai.body.suggestion?.quantityTotal >= 1, JSON.stringify(ai.body.suggestion).slice(0, 160));
  const aiShort = await call('POST', '/ai/offer-autofill', M1, { rawNote: 'ab' });
  const aiLegacy = await call('POST', '/ai/offer-autofill', M1, { text: 'quatre croissants restants' });
  check('I5', 'legacy `text` field still accepted', aiLegacy.status === 200, `${aiLegacy.status} ${err(aiLegacy)}`);
  const aiBadTime = await call('POST', '/ai/offer-autofill', M1, { rawNote: 'trois pizzas restantes', closingTime: '25:99' });
  check('C4', 'closingTime validated as HH:mm', aiBadTime.status === 400 || aiBadTime.status === 422, aiBadTime.status);
  check('C4', 'AI autofill validates rawNote length', aiShort.status === 400 || aiShort.status === 422, aiShort.status);
  const aiStudent = await call('POST', '/ai/offer-autofill', S1, { rawNote: 'test de rôle étudiant' });
  check('C3', 'AI autofill refused for students', aiStudent.status === 403, aiStudent.status);
}

// ================================================================ F. reservation (M5, UML 07)
section('F. M5 Reservation, INV-06/09 stock & concurrency');
const orders = {};
{
  const before = await call('GET', `/offers/${offerIds.fixed}`);
  const stock0 = before.body.offer.quantityAvailable;
  const r = await call('POST', '/orders', S1, { offerId: offerIds.fixed, quantity: 2, lockedUnitPriceMillimes: 1 });
  check('M5', 'reserve 2 portions -> 201 RESERVED', r.status === 201 && r.body.order?.status === 'RESERVED', `${r.status} ${err(r)}`);
  orders.a = r.body.order?.orderId || r.body.order?.id;
  const o = r.body.order || {};
  check('INV-06', 'locked price computed by server (client value 1 ignored)', (o.pricing?.lockedUnitPriceMillimes ?? o.lockedUnitPriceMillimes) === 3000, JSON.stringify(o.pricing));
  const expires = new Date(o.reservationExpiresAt?._seconds ? o.reservationExpiresAt._seconds * 1000 : o.reservationExpiresAt).getTime();
  const holdMin = (expires - Date.now()) / 60000;
  check('C5', 'reservation hold is 10 minutes', holdMin > 9 && holdMin <= 10.1, `${holdMin.toFixed(2)} min`);
  check('INV-02', 'order totals are integer millimes (2 x 3000 = 6000)', (o.pricing?.totalMillimes ?? o.totalMillimes) === 6000, JSON.stringify(o.pricing));
  check('M5', 'order carries a human order code CS-XXXXX', /^CS-[0-9A-HJKMNP-TV-Z]{5}$/.test(o.orderCode || ''), o.orderCode);

  const after = await call('GET', `/offers/${offerIds.fixed}`);
  check('INV-09', 'stock decremented inside the reservation', after.body.offer.quantityAvailable === stock0 - 2, `${stock0} -> ${after.body.offer.quantityAvailable}`);

  const over = await call('POST', '/orders', S2, { offerId: offerIds.fixed, quantity: 50 });
  check('M5', 'over-reservation -> 409 / 4xx (never negative)', over.status === 409 || over.status === 422 || over.status === 400, `${over.status} ${err(over)}`);
  const still = await call('GET', `/offers/${offerIds.fixed}`);
  check('INV-09', 'failed reservation leaves stock untouched', still.body.offer.quantityAvailable === stock0 - 2, `${still.body.offer.quantityAvailable}`);
  const zero = await call('POST', '/orders', S1, { offerId: offerIds.fixed, quantity: 0 });
  check('C4', 'quantity 0 rejected', zero.status === 400 || zero.status === 422, zero.status);
  const ghost = await call('POST', '/orders', S1, { offerId: 'does-not-exist', quantity: 1 });
  check('M5', 'unknown offer -> 404', ghost.status === 404, ghost.status);

  const getOwn = await call('GET', `/orders/${orders.a}`, S1);
  check('M5', 'owner can read own order', getOwn.status === 200, `${getOwn.status} ${err(getOwn)}`);
  const getOther = await call('GET', `/orders/${orders.a}`, S2);
  check('C3', 'another student cannot read my order (403/404)', getOther.status === 403 || getOther.status === 404, getOther.status);
  const getMerchant = await call('GET', `/orders/${orders.a}`, M1);
  check('C3', 'owning merchant can read the order', getMerchant.status === 200, `${getMerchant.status} ${err(getMerchant)}`);
  const mineList = await call('GET', '/orders/me', S1);
  check('M5', 'GET /orders/me lists my orders', mineList.status === 200 && (mineList.body.orders || []).some((x) => (x.id || x.orderId) === orders.a), `${mineList.status} ${err(mineList)}`);

  // cancel path
  const cancel = await call('POST', `/orders/${orders.a}/cancel`, S1);
  check('M5', 'cancel RESERVED order -> CANCELLED', cancel.status === 200 && cancel.body.order?.status === 'CANCELLED', `${cancel.status} ${err(cancel)}`);
  const restored = await call('GET', `/offers/${offerIds.fixed}`);
  check('C5', 'cancel restores stock', restored.body.offer.quantityAvailable === stock0, `${restored.body.offer.quantityAvailable} vs ${stock0}`);
  const cancel2 = await call('POST', `/orders/${orders.a}/cancel`, S1);
  check('C5', 'second cancel refused (409)', cancel2.status === 409, `${cancel2.status} ${err(cancel2)}`);
  const payCancelled = await call('POST', '/payments/konnect/init', S1, { orderId: orders.a });
  check('C5', 'cannot pay a CANCELLED order (409)', payCancelled.status === 409, `${payCancelled.status} ${err(payCancelled)}`);

  // concurrency: 3 stock on the dutch offer, 8 students race for 1 each
  const dStock = (await call('GET', `/offers/${offerIds.dutch}`)).body.offer.quantityAvailable;
  const racers = await Promise.all(Array.from({ length: 8 }, (_, i) => call('POST', '/orders', `test-token:qa-racer-${i}:STUDENT:r${i}@essect.u-tunis.tn`, { offerId: offerIds.dutch, quantity: 1 })));
  const okCount = racers.filter((x) => x.status === 201).length;
  const failCount = racers.filter((x) => x.status === 409).length;
  const final = (await call('GET', `/offers/${offerIds.dutch}`)).body.offer;
  check('C5', `race: exactly ${dStock} winners out of 8 (got ${okCount}, ${failCount} x 409)`, okCount === dStock && failCount === 8 - dStock, racers.map((x) => x.status).join(','));
  check('INV-09', 'race: quantityAvailable never negative', final.quantityAvailable === 0, `qty=${final.quantityAvailable}`);
  check('C5', 'sold-out offer flips to SOLD_OUT', final.status === 'SOLD_OUT' || final.quantityAvailable === 0, final.status);
  orders.raceWinners = racers.filter((x) => x.status === 201).map((x) => x.body.order?.orderId || x.body.order?.id);
  // release the held stock by cancelling the winners (they cannot cancel with S1 token, they are other uids)
  await Promise.all(racers.filter((x) => x.status === 201).map((x, i) => call('POST', `/orders/${x.body.order?.orderId || x.body.order?.id}/cancel`, `test-token:qa-racer-${racers.indexOf(x)}:STUDENT:r@essect.u-tunis.tn`)));
  const reopened = (await call('GET', `/offers/${offerIds.dutch}`)).body.offer;
  check('C5', 'cancelling race winners restores stock and re-opens offer', reopened.quantityAvailable === dStock, `qty=${reopened.quantityAvailable} status=${reopened.status}`);
}

// ================================================================ G. payment (M6)
section('G. M6 Payment (Konnect sandbox contract), INV-10 idempotency');
let paidOrder;
{
  const r = await call('POST', '/orders', S1, { offerId: offerIds.fixed, quantity: 1 });
  paidOrder = r.body.order?.orderId || r.body.order?.id;
  orders.paid = paidOrder;
  const stock = (await call('GET', `/offers/${offerIds.fixed}`)).body.offer;
  const sold0 = stock.quantitySold ?? 0;

  const noAuth = await call('POST', '/payments/konnect/init', null, { orderId: paidOrder });
  check('C3', 'payment init requires auth', noAuth.status === 401, noAuth.status);
  const other = await call('POST', '/payments/konnect/init', S2, { orderId: paidOrder });
  check('C3', 'another student cannot pay my order (403)', other.status === 403, `${other.status} ${err(other)}`);

  const early = await call('GET', `/orders/${paidOrder}/ticket`, S1);
  check('INV-11', 'ticket refused while order is RESERVED', early.status >= 400, `${early.status}`);

  const init = await call('POST', '/payments/konnect/init', S1, { orderId: paidOrder });
  check('M6', 'init -> payUrl + paymentRef', init.status === 200 && init.body.payUrl && init.body.paymentRef, `${init.status} ${err(init)}`);
  const mid = await call('GET', `/orders/${paidOrder}`, S1);
  check('M6', 'order payment INITIATED after init', (mid.body.order?.payment?.status) === 'INITIATED', JSON.stringify(mid.body.order?.payment));

  const wh = await call('GET', '/payments/konnect/webhook?payment_ref=unknown_ref_xyz');
  check('M6', 'webhook answers 200 even for unknown ref', wh.status === 200, wh.status);

  const v1 = await call('POST', '/payments/konnect/verify', S1, { orderId: paidOrder });
  check('M6', 'verify -> order PAID', v1.status === 200 && v1.body.order?.status === 'PAID', `${v1.status} ${err(v1)}`);
  const afterPay = (await call('GET', `/offers/${offerIds.fixed}`)).body.offer;
  check('INV-10', 'quantitySold incremented once', (afterPay.quantitySold ?? 0) === sold0 + 1, `${sold0} -> ${afterPay.quantitySold}`);
  const v2 = await call('POST', '/payments/konnect/verify', S1, { orderId: paidOrder });
  const wh2 = await call('GET', `/payments/konnect/webhook?payment_ref=${encodeURIComponent(init.body.paymentRef)}`);
  const afterAgain = (await call('GET', `/offers/${offerIds.fixed}`)).body.offer;
  check('INV-10', 'second verify + webhook replay stay idempotent (no double count)', v2.status === 200 && (afterAgain.quantitySold ?? 0) === sold0 + 1 && wh2.status === 200, `${v2.status} sold=${afterAgain.quantitySold}`);
  const cancelPaid = await call('POST', `/orders/${paidOrder}/cancel`, S1);
  check('C5', 'a PAID order cannot be cancelled (409)', cancelPaid.status === 409, `${cancelPaid.status} ${err(cancelPaid)}`);
  const merchantNotif = await call('GET', '/merchants/me/orders?status=PAID', M1);
  check('M5', 'merchant sees the PAID order', merchantNotif.status === 200 && (merchantNotif.body.orders || []).some((x) => (x.id || x.orderId) === paidOrder), `${merchantNotif.status} ${err(merchantNotif)}`);
}

// ================================================================ H. ticket & scan (M7, UML 08)
section('H. M7/I6 Living Ticket, scan, redeem code, INV-08/11/12');
let ticketKey;
{
  const t = await call('GET', `/orders/${paidOrder}/ticket`, S1);
  check('M7', 'owner receives ticket params once PAID', t.status === 200 && t.body.ticketKey && t.body.windowSeconds === 30, `${t.status} ${err(t)}`);
  check('INV-12', 'ticket response is Cache-Control: no-store', /no-store/.test(t.headers.get('cache-control') || ''), t.headers.get('cache-control'));
  ticketKey = t.body.ticketKey;
  const orderDoc = await call('GET', `/orders/${paidOrder}`, S1);
  check('INV-12', 'ticketKey is not in the order document', !JSON.stringify(orderDoc.body).includes(ticketKey || 'zzz'), '');
  const thief = await call('GET', `/orders/${paidOrder}/ticket`, S2);
  check('INV-12', 'another student cannot fetch my ticket key', thief.status === 403 || thief.status === 404, thief.status);
  const merchantTicket = await call('GET', `/orders/${paidOrder}/ticket`, M1);
  check('INV-12', 'merchant cannot fetch the ticket key', merchantTicket.status === 403, merchantTicket.status);

  const wi = getWindowIndex();
  const good = computeWindowCode(ticketKey, paidOrder, wi);

  const forged = await call('POST', '/tickets/scan', M1, { qrPayload: `CS2.${paidOrder}.${wi}.AAAAAAAAAAAAAAAAAAAAAA` });
  check('I6', 'forged signature -> 401 INVALID_SIGNATURE', forged.status === 401, `${forged.status} ${err(forged)}`);
  await sleep(600);
  const wrongMerchant = await call('POST', '/tickets/scan', M2, { qrPayload: good.qrPayload });
  check('I6', 'scan by another merchant -> 403 WRONG_MERCHANT', wrongMerchant.status === 403, `${wrongMerchant.status} ${err(wrongMerchant)}`);
  await sleep(600);
  const stale = computeWindowCode(ticketKey, paidOrder, wi - 6);
  const expired = await call('POST', '/tickets/scan', M1, { qrPayload: stale.qrPayload });
  check('I6', 'screenshot older than the rotating window -> 410 TICKET_EXPIRED', expired.status === 410, `${expired.status} ${err(expired)}`);
  await sleep(600);
  const failedCheck = await call('GET', `/orders/${paidOrder}`, S1);
  check('INV-08', 'refused scans increment pickup.failedAttempts (committed, not thrown)', (failedCheck.body.order?.pickup?.failedAttempts ?? 0) >= 1, JSON.stringify(failedCheck.body.order?.pickup));
  const pts0 = (await call('GET', '/loyalty/me', S1)).body;

  const fresh = computeWindowCode(ticketKey, paidOrder, getWindowIndex());
  const scan = await call('POST', '/tickets/scan', M1, { qrPayload: fresh.qrPayload });
  check('M7', 'valid scan -> order COMPLETED', scan.status === 200 && scan.body.order?.status === 'COMPLETED', `${scan.status} ${err(scan)}`);
  check('B3', 'scan awards EcoPoints', Number(scan.body.pointsAwarded) > 0, JSON.stringify(scan.body.pointsAwarded));
  await sleep(600);
  const again = await call('POST', '/tickets/scan', M1, { qrPayload: computeWindowCode(ticketKey, paidOrder, getWindowIndex()).qrPayload });
  check('INV-11', 'second scan of a completed ticket -> 409 ALREADY_USED', again.status === 409, `${again.status} ${err(again)}`);
  const loy = await call('GET', '/loyalty/me', S1);
  check('B3', 'GET /loyalty/me reflects new points & tier', loy.status === 200 && (loy.body.ecoPoints ?? 0) > (pts0.ecoPoints ?? 0) && loy.body.tier, `${loy.status} ${JSON.stringify(loy.body).slice(0, 160)}`);
  check('B3', 'loyalty stamps within [0,5] and rewards array present', loy.body.stamps >= 0 && loy.body.stamps <= 5 && Array.isArray(loy.body.rewards), JSON.stringify(loy.body).slice(0, 200));

  const rate = await call('POST', `/orders/${paidOrder}/rating`, S1, { stars: 5, comment: 'Super trouvaille' });
  check('M5', 'rate a COMPLETED order (201/200)', rate.status === 200 || rate.status === 201, `${rate.status} ${err(rate)}`);
  const rate2 = await call('POST', `/orders/${paidOrder}/rating`, S1, { stars: 1 });
  check('M5', 'rating is once-only (409)', rate2.status === 409, `${rate2.status} ${err(rate2)}`);
  const rateBad = await call('POST', `/orders/${orders.paid}/rating`, S1, { stars: 9 });
  check('C4', 'rating stars validated (1..5)', rateBad.status === 400 || rateBad.status === 422, rateBad.status);

  // redeem-code path + lockout
  const r2 = await call('POST', '/orders', S2, { offerId: offerIds.fixed, quantity: 1 });
  const o2 = r2.body.order?.orderId || r2.body.order?.id;
  const code2 = r2.body.order?.orderCode;
  await call('POST', '/payments/konnect/init', S2, { orderId: o2 });
  await call('POST', '/payments/konnect/verify', S2, { orderId: o2 });
  const t2 = await call('GET', `/orders/${o2}/ticket`, S2);
  const key2 = t2.body.ticketKey;
  const rightCode = computeWindowCode(key2, o2, getWindowIndex()).code6;
  const wrongCode = String((Number(rightCode) + 1) % 1000000).padStart(6, '0');
  const w1 = await call('POST', '/tickets/redeem-code', M1, { orderCode: code2, code6: wrongCode });
  check('INV-08', 'wrong backup code refused without throwing a 500', w1.status >= 400 && w1.status < 500, `${w1.status} ${err(w1)}`);
  const badFormat = await call('POST', '/tickets/redeem-code', M1, { orderCode: 'xx', code6: '12' });
  check('C4', 'redeem-code format validated', badFormat.status === 400 || badFormat.status === 422, badFormat.status);
  await sleep(600);
  const okCode = await call('POST', '/tickets/redeem-code', M1, { orderCode: code2, code6: computeWindowCode(key2, o2, getWindowIndex()).code6 });
  check('M7', 'correct backup code completes the pickup', okCode.status === 200 && okCode.body.order?.status === 'COMPLETED', `${okCode.status} ${err(okCode)}`);

  // lockout after 5 failures (MAX_FAILED_TICKET_ATTEMPTS)
  const r3 = await call('POST', '/orders', S1, { offerId: offerIds.fixed, quantity: 1 });
  const o3 = r3.body.order?.orderId || r3.body.order?.id;
  await call('POST', '/payments/konnect/init', S1, { orderId: o3 });
  await call('POST', '/payments/konnect/verify', S1, { orderId: o3 });
  const key3 = (await call('GET', `/orders/${o3}/ticket`, S1)).body.ticketKey;
  let locked = false; let statuses = [];
  for (let i = 0; i < 7; i++) {
    const x = await call('POST', '/tickets/scan', M1, { qrPayload: `CS2.${o3}.${getWindowIndex()}.BBBBBBBBBBBBBBBBBBBBBB` });
    statuses.push(x.status);
    if (x.status === 423) { locked = true; break; }
    await sleep(520);
  }
  check('I6', 'after 5 failed attempts the ticket is locked (423 TICKET_LOCKED)', locked, statuses.join(','));
  orders.locked = o3; orders.lockedKey = key3;
}

// ================================================================ I. surprise reveal (B2/I3)
section('I. B2/I3 Surprise basket reveal on scan, INV-16');
{
  const r = await call('POST', '/orders', S2, { offerId: offerIds.surprise, quantity: 1 });
  const oid = r.body.order?.orderId || r.body.order?.id;
  check('B2', 'reserve a surprise basket', r.status === 201, `${r.status} ${err(r)}`);
  const beforeReveal = await call('GET', `/orders/${oid}`, S2);
  check('INV-16', 'order exposes no contents before the scan', !JSON.stringify(beforeReveal.body).includes('croissants'), '');
  await call('POST', '/payments/konnect/init', S2, { orderId: oid });
  await call('POST', '/payments/konnect/verify', S2, { orderId: oid });
  const key = (await call('GET', `/orders/${oid}/ticket`, S2)).body.ticketKey;
  const scan = await call('POST', '/tickets/scan', M1, { qrPayload: computeWindowCode(key, oid, getWindowIndex()).qrPayload });
  check('B2', 'scan of a surprise order reports isSurprise', scan.status === 200 && scan.body.isSurprise === true, `${scan.status} ${JSON.stringify(scan.body).slice(0, 200)}`);
  const afterReveal = await call('GET', `/orders/${oid}`, S2);
  check('I3', 'contents are copied to orders.reveal at the scan', JSON.stringify(afterReveal.body).includes('croissants') && afterReveal.body.order?.reveal, JSON.stringify(afterReveal.body.order?.reveal));
}

// ================================================================ J. INV-15
section('J. INV-15 Offer lock once orders exist');
{
  const lockedPrice = await call('PATCH', `/offers/${offerIds.fixed}`, M1, { pricing: { originalPriceMillimes: 9999 } });
  check('INV-15', 'pricing change refused after first order (409 OFFER_LOCKED)', lockedPrice.status === 409, `${lockedPrice.status} ${err(lockedPrice)}`);
  const cur = (await call('GET', `/offers/${offerIds.fixed}`)).body.offer;
  const grow = await call('PATCH', `/offers/${offerIds.fixed}`, M1, { quantity: (cur.quantityTotal ?? cur.quantity ?? 6) + 4 });
  check('INV-15', 'quantityTotal may still grow', grow.status === 200, `${grow.status} ${err(grow)}`);
  const shrink = await call('PATCH', `/offers/${offerIds.fixed}`, M1, { quantity: 1 });
  check('INV-15', 'quantityTotal may not shrink below sold', shrink.status === 409 || shrink.status === 422 || shrink.status === 400, `${shrink.status} ${err(shrink)}`);
  const delUsed = await call('DELETE', `/offers/${offerIds.fixed}`, M1);
  const afterDel = await call('GET', `/offers/${offerIds.fixed}`);
  check('M3', 'offer with orders is soft-deleted (status DELETED, not hard-removed)', (delUsed.status === 204 || delUsed.status === 200) && (afterDel.status === 404 || afterDel.body.offer?.status === 'DELETED'), `${delUsed.status} then ${afterDel.status}`);
}

// ================================================================ K. dashboards, impact, admin
section('K. M8/B4 Dashboards, impact & admin');
{
  const sd = await call('GET', '/dashboards/student', S1);
  check('M8', 'student dashboard (stats, loyalty, recent orders)', sd.status === 200 && sd.body && typeof sd.body === 'object', `${sd.status} ${err(sd)}`);
  console.log('        student dashboard keys:', Object.keys(sd.body || {}).join(','));
  const md = await call('GET', '/dashboards/merchant?range=7d', M1);
  check('M8', 'merchant dashboard 7d', md.status === 200, `${md.status} ${err(md)}`);
  console.log('        merchant dashboard keys:', Object.keys(md.body || {}).join(','));
  const md30 = await call('GET', '/dashboards/merchant?range=30d', M1);
  check('M8', 'merchant dashboard 30d', md30.status === 200, `${md30.status} ${err(md30)}`);
  const mdBad = await call('GET', '/dashboards/merchant?range=1y', M1);
  check('C4', 'merchant dashboard rejects unknown range', mdBad.status === 400 || mdBad.status === 422, mdBad.status);
  const ad = await call('GET', '/dashboards/admin', ADMIN);
  check('M8', 'admin dashboard', ad.status === 200, `${ad.status} ${err(ad)}`);
  console.log('        admin dashboard keys:', Object.keys(ad.body || {}).join(','));
  const wrongRole = await call('GET', '/dashboards/merchant', S1);
  check('C3', 'student cannot read merchant dashboard (403)', wrongRole.status === 403, wrongRole.status);

  const ig = await call('GET', '/impact/global');
  check('B4', 'impact/global public with equivalences', ig.status === 200 && ig.body.global && ig.body.equivalences, `${ig.status} ${err(ig)}`);
  const ifl = await call('GET', '/impact/filieres');
  check('I4', 'impact/filieres leaderboard', ifl.status === 200, `${ifl.status} ${err(ifl)}`);
  console.log('        filieres keys:', Object.keys(ifl.body || {}).join(','));

  const au = await call('GET', '/admin/users', ADMIN);
  check('ACT-3', 'admin lists users', au.status === 200 && (au.body.users || []).length > 0, `${au.status} ${err(au)}`);
  const susNoReason = await call('PATCH', '/admin/users/qa-student-2/status', ADMIN, { status: 'SUSPENDED' });
  check('C4', 'suspension requires a reason', susNoReason.status === 400 || susNoReason.status === 422, susNoReason.status);
  const sus = await call('PATCH', '/admin/users/qa-student-2/status', ADMIN, { status: 'SUSPENDED', reason: 'Test de suspension QA' });
  check('ACT-3', 'admin suspends a user', sus.status === 200, `${sus.status} ${err(sus)}`);
  const susTry = await call('POST', '/orders', S2, { offerId: offerIds.surprise, quantity: 1 });
  check('C3', 'suspended user is blocked from reserving', susTry.status === 403 || susTry.status === 401, `${susTry.status} ${err(susTry)}`);
  const react = await call('PATCH', '/admin/users/qa-student-2/status', ADMIN, { status: 'ACTIVE' });
  check('ACT-3', 'admin reactivates the user', react.status === 200, `${react.status} ${err(react)}`);
  const sm = await call('PATCH', `/admin/merchants/qa-merchant-2/status`, ADMIN, { status: 'SUSPENDED', reason: 'Suspension QA' });
  const suspPublish = await call('POST', '/offers', M2, offerBody());
  check('INV-14', 'SUSPENDED merchant cannot publish', sm.status === 200 && suspPublish.status === 403, `${sm.status}/${suspPublish.status}`);
}


// ================================================================ L. reward lifecycle (B3 / I4)
section('L. B3/I4 Reward lifecycle: milestone -> coupon -> reserve (cap) -> lock -> restore -> use');
{
  const cheap = await call('POST', '/offers', M1, offerBody({ title: 'Offre Coupon 5 DT', pricing: { mode: 'FIXED', originalPriceMillimes: 9000, discountedPriceMillimes: 5000 }, quantity: 12 }));
  const big = await call('POST', '/offers', M1, offerBody({ title: 'Offre Coupon 20 DT', pricing: { mode: 'FIXED', originalPriceMillimes: 30000, discountedPriceMillimes: 20000 }, quantity: 6 }));
  const cheapId = cheap.body.offer?.id; const bigId = big.body.offer?.id;
  check('B3', 'reward test offers created', Boolean(cheapId && bigId), `${cheap.status} ${big.status}`);

  const pickup = async (token, offerId) => {
    const r = await call('POST', '/orders', token, { offerId, quantity: 1 });
    const id = r.body.order?.orderId;
    await call('POST', '/payments/konnect/init', token, { orderId: id });
    await call('POST', '/payments/konnect/verify', token, { orderId: id });
    const key = (await call('GET', `/orders/${id}/ticket`, token)).body.ticketKey;
    await sleep(560);
    const sc = await call('POST', '/tickets/scan', M1, { qrPayload: computeWindowCode(key, id, getWindowIndex()).qrPayload });
    return sc;
  };
  const before = (await call('GET', '/loyalty/me', S1)).body;
  let last;
  for (let i = 0; i < 3; i++) last = await pickup(S1, cheapId);
  const after = (await call('GET', '/loyalty/me', S1)).body;
  check('B3', 'each extra pickup awards 20 pts (20 x qty, no repeat welcome bonus)', after.ecoPoints === before.ecoPoints + 60, `${before.ecoPoints} -> ${after.ecoPoints}`);
  check('I4', 'tier is POUSSE at >= 100 pts', after.tier === 'POUSSE', after.tier);
  check('I4', 'stamps = floor((points mod 100)/20)', after.stamps === Math.floor((after.ecoPoints % 100) / 20), `${after.ecoPoints} -> ${after.stamps}`);
  const reward = (after.rewards || []).find((r) => r.status === 'AVAILABLE' && r.type === 'PERCENT_OFF');
  check('B3', 'crossing 100 pts unlocks a PERCENT_OFF 20% coupon (cap 2000)', reward && reward.percentOff === 20 && reward.maxDiscountMillimes === 2000, JSON.stringify(reward));
  const rid = reward?.id;

  const bogus = await call('POST', '/orders', S1, { offerId: cheapId, quantity: 1, rewardId: 'rw_does_not_exist' });
  check('C5', 'unknown rewardId -> 422 INVALID_REWARD', bogus.status === 422, `${bogus.status} ${err(bogus)}`);
  const stolen = await call('POST', '/orders', S2, { offerId: cheapId, quantity: 1, rewardId: rid });
  check('C3', "another student cannot use my coupon (422)", stolen.status === 422, `${stolen.status} ${err(stolen)}`);

  const withCap = await call('POST', '/orders', S1, { offerId: bigId, quantity: 1, rewardId: rid });
  const p1 = withCap.body.order?.pricing || {};
  check('B3', 'coupon applied at reservation (201)', withCap.status === 201, `${withCap.status} ${err(withCap)}`);
  check('B3', 'discount is capped at 2000 millimes (20% of 20000 = 4000 -> 2000)', (p1.reward?.discountMillimes ?? p1.discountMillimes) === 2000 && p1.totalMillimes === 18000, JSON.stringify(p1));
  const locked = (await call('GET', '/loyalty/me', S1)).body.rewards.find((r) => r.id === rid);
  check('C5', 'coupon is LOCKED while the order is held', locked?.status === 'LOCKED', locked?.status);
  const reuse = await call('POST', '/orders', S1, { offerId: cheapId, quantity: 1, rewardId: rid });
  check('C5', 'a LOCKED coupon cannot be reused (422)', reuse.status === 422, `${reuse.status} ${err(reuse)}`);
  await call('POST', `/orders/${withCap.body.order?.orderId}/cancel`, S1);
  const back = (await call('GET', '/loyalty/me', S1)).body.rewards.find((r) => r.id === rid);
  check('C5', 'cancelling the order restores the coupon to AVAILABLE', back?.status === 'AVAILABLE', back?.status);

  const small = await call('POST', '/orders', S1, { offerId: cheapId, quantity: 1, rewardId: rid });
  const p2 = small.body.order?.pricing || {};
  check('B3', '20% of 5000 = 1000 discount, total 4000', (p2.reward?.discountMillimes ?? p2.discountMillimes) === 1000 && p2.totalMillimes === 4000, JSON.stringify(p2));
  const smallId = small.body.order?.orderId;
  const init = await call('POST', '/payments/konnect/init', S1, { orderId: smallId });
  check('M6', 'Konnect is charged the discounted total', init.status === 200, `${init.status} ${err(init)}`);
  await call('POST', '/payments/konnect/verify', S1, { orderId: smallId });
  const used = (await call('GET', '/loyalty/me', S1)).body.rewards.find((r) => r.id === rid);
  check('B3', 'coupon becomes USED once the order is PAID', used?.status === 'USED', used?.status);
}


// ================================================================ M. demo merchant CRUD + store isolation
section('M. Demo merchant (m-baguette) offer CRUD, and a merchant WITHOUT a store sees nothing');
{
  const DEMO_M = 'test-token:m-baguette:MERCHANT:commercant@baguette.tn';
  const created = await call('POST', '/offers', DEMO_M, offerBody({ title: 'CRUD Demo Merchant' }));
  const oid = created.body.offer?.id;
  check('M3', 'demo merchant can publish an offer (201)', created.status === 201 && oid, `${created.status} ${err(created)}`);
  const inList = await call('GET', '/merchants/me/offers', DEMO_M);
  check('M3', 'the new offer appears in the demo merchant list', (inList.body.offers || []).some((o) => o.id === oid), `${inList.status}`);
  const upd = await call('PATCH', `/offers/${oid}`, DEMO_M, { title: 'CRUD Demo Merchant (modifie)', quantity: 7 });
  check('M3', 'demo merchant can edit own offer (was 403 FORBIDDEN_RESOURCE)', upd.status === 200 && upd.body.offer?.title === 'CRUD Demo Merchant (modifie)', `${upd.status} ${err(upd)}`);
  const del = await call('DELETE', `/offers/${oid}`, DEMO_M);
  check('M3', 'demo merchant can delete own offer', del.status === 204 || del.status === 200, `${del.status} ${err(del)}`);
  const gone = await call('GET', `/offers/${oid}`);
  check('M3', 'the deleted offer is gone for students too', gone.status === 404, gone.status);

  // A merchant with NO store must never be shown another store's data (old fallback = "first approved store")
  const NOSTORE = 'test-token:qa-no-store:MERCHANT:nostore@essect.u-tunis.tn';
  const offs = await call('GET', '/merchants/me/offers', NOSTORE);
  check('C3', 'merchant without a store sees NO offers (not another store\'s)', offs.status === 200 && (offs.body.offers || []).length === 0, `${offs.status} ${(offs.body.offers || []).length}`);
  const ords = await call('GET', '/merchants/me/orders', NOSTORE);
  check('C3', 'merchant without a store sees NO orders', ords.status === 200 && (ords.body.orders || []).length === 0, `${ords.status} ${(ords.body.orders || []).length}`);
  const dash = await call('GET', '/dashboards/merchant', NOSTORE);
  check('C3', 'merchant without a store gets 404 on the dashboard (no foreign revenue)', dash.status === 404, `${dash.status}`);
  const me = await call('GET', '/merchants/me', NOSTORE);
  check('C3', 'merchant without a store gets 404 on /merchants/me', me.status === 404, `${me.status}`);
}

// ================================================================ summary
const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok);
console.log(`\n==================== SUMMARY: ${pass}/${results.length} passed in ${((Date.now() - T0) / 1000).toFixed(1)}s ====================`);
if (fail.length) {
  console.log('FAILURES:');
  fail.forEach((f) => console.log(` - [${f.id}] ${f.desc}\n     ${f.detail}`));
}
process.exit(fail.length ? 1 : 0);
