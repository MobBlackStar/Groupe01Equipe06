// Module : Tests & Validation Notifications E-mail
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';
const {
  resolveReceiptRecipient,
  resolvePublicOrigin,
  buildOrderReceiptHtml,
  sendOrderReceiptEmail,
} = await import('../src/modules/notifications/email.service.js');

describe('Service Reçu E-mail Griddle (SMTP Gmail & Résolution Dynamique)', () => {
  const sampleOrder = {
    orderId: 'ord-email-01',
    orderCode: 'CS-991AB',
    studentId: 'stu-01',
    merchantId: 'merch-01',
    studentSnapshot: { displayName: 'Yassine Trabelsi', email: 'snapshot@essect.u-tunis.tn' },
    merchantSnapshot: { name: 'Munchies & Baguette Ali Trad' },
    items: [
      { offerId: 'off-1', title: 'Baguette Farcie Escalope', quantity: 1, unitPriceMillimes: 4200, lineSubtotalMillimes: 4200 },
      { offerId: 'off-2', title: 'Makloub Chawarma', quantity: 2, unitPriceMillimes: 3500, lineSubtotalMillimes: 7000 },
    ],
    pricing: {
      subtotalMillimes: 11200,
      discountMillimes: 1000,
      totalMillimes: 10200,
      savedMillimes: 5800,
    },
    impact: { foodSavedGrams: 1100, co2SavedGrams: 2750 },
    payment: { paymentRef: 'demo-ksb-m4ab9', confirmedAt: new Date('2026-11-25T16:30:00Z') },
  };

  test('resolveReceiptRecipient privilégie overrideEmail puis order.receiptEmail puis student.email', () => {
    const r1 = resolveReceiptRecipient({
      order: { ...sampleOrder, receiptEmail: 'order@essect.tn' },
      student: { displayName: 'Amira', email: 'student@essect.tn' },
      overrideEmail: 'jury@essect.u-tunis.tn',
    });
    assert.equal(r1.toEmail, 'jury@essect.u-tunis.tn');
    assert.equal(r1.studentName, 'Amira');

    const r2 = resolveReceiptRecipient({
      order: sampleOrder,
      student: { displayName: 'Yassine', email: 'yassine@essect.u-tunis.tn' },
    });
    assert.equal(r2.toEmail, 'yassine@essect.u-tunis.tn');

    const r3 = resolveReceiptRecipient({ order: sampleOrder });
    assert.equal(r3.toEmail, 'snapshot@essect.u-tunis.tn');
  });

  test('resolvePublicOrigin bascule vers Vercel HTTPS si WEB_APP_URL est localhost', () => {
    assert.equal(resolvePublicOrigin('http://localhost:5173'), 'https://campussave-rouge.vercel.app');
    assert.equal(resolvePublicOrigin('https://campussave-rouge.vercel.app/'), 'https://campussave-rouge.vercel.app');
  });

  test('buildOrderReceiptHtml embarque le logo Vercel HTTPS, la palette Griddle, les montants TND et le lien ticket', () => {
    const html = buildOrderReceiptHtml({
      order: sampleOrder,
      student: { displayName: 'Yassine Trabelsi', email: 'yassine@essect.u-tunis.tn' },
      merchant: { name: 'Munchies & Baguette Ali Trad' },
      publicOrigin: resolvePublicOrigin('http://localhost:5175'),
    });

    assert.ok(html.includes('https://campussave-rouge.vercel.app/assets/brand/mascot-sticker-256.png'));
    assert.ok(html.includes('#FAF3E6'));
    assert.ok(html.includes('#FAF6EE'));
    assert.ok(html.includes('#111111'));
    assert.ok(html.includes('#FFD000'));
    assert.ok(html.includes('#DA0711'));
    assert.ok(html.includes('[PAYÉ • KONNECT MODE TEST]'));
    assert.ok(html.includes('#CS-991AB'));
    assert.ok(html.includes('1x Baguette Farcie Escalope'));
    assert.ok(html.includes('2x Makloub Chawarma'));
    assert.ok(html.includes('10,200 DT'));
    assert.ok(html.includes('5,800 DT'));
    assert.ok(html.includes('+1100g de nourriture sauvée'));
    assert.ok(html.includes('https://campussave-rouge.vercel.app/app/orders/ord-email-01/ticket'));
  });

  test('sendOrderReceiptEmail simule en mode test sans erreur et expédie avec transport injecté hors mode test', async () => {
    const simResult = await sendOrderReceiptEmail({
      order: sampleOrder,
      student: { email: 'yassine@essect.u-tunis.tn' },
    });
    assert.equal(simResult.sent, false);
    assert.equal(simResult.simulated, true);
    assert.equal(simResult.toEmail, 'yassine@essect.u-tunis.tn');

    const sentPayloads = [];
    const liveResult = await sendOrderReceiptEmail({
      order: sampleOrder,
      student: { displayName: 'Yassine', email: 'yassine@essect.u-tunis.tn' },
      merchant: { name: 'Munchies & Baguette Ali Trad' },
      overrideEmail: 'examiner@essect.u-tunis.tn',
      config: {
        NODE_ENV: 'production',
        MAIL_USER: 'campussave.essect@gmail.com',
        MAIL_PASS: 'abcd efgh ijkl mnop',
        MAIL_FROM_NAME: 'CampusSave ESSECT',
        WEB_APP_URL: 'http://localhost:5173',
      },
      transportFactory: () => ({
        async sendMail(mail) {
          sentPayloads.push(mail);
          return { messageId: 'msg-test-001' };
        },
      }),
    });

    assert.equal(liveResult.sent, true);
    assert.equal(liveResult.simulated, false);
    assert.equal(liveResult.toEmail, 'examiner@essect.u-tunis.tn');
    assert.equal(sentPayloads.length, 1);
    assert.equal(sentPayloads[0].to, 'examiner@essect.u-tunis.tn');
    assert.ok(sentPayloads[0].subject.includes('#CS-991AB'));
    assert.ok(sentPayloads[0].html.includes('https://campussave-rouge.vercel.app/assets/brand/mascot-sticker-256.png'));
  });
});
