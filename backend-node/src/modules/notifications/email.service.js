// 💡 Concept & Analogie : Comme l'imprimante thermique qui remet instantanément un ticket papier propre au client dès l'acceptation de la carte, ce service expédie par e-mail le reçu Griddle CampusSave après confirmation Konnect.
// 🔄 Comparaison React / Flutter : Le backend reste seul responsable de l'envoi d'e-mails (cascade HTTPS Port 443 pour Render + SMTP local avec timeouts stricts) sans exposer aucun secret côté React ou Flutter.
// 🎯 À retenir pour la soutenance : "Render bloquant les ports SMTP sortants, notre service utilise prioritairement HTTPS Port 443 (Google Apps Script / API Brevo) en asynchrone non bloquant avec repli SMTP local sécurisé."
// Module : Notifications & Reçus Électroniques

import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { formatTND } from '../../../../shared/money.js';
import { normalizeOrderItems } from '../../../../shared/orders.js';

const DEFAULT_PUBLIC_ORIGIN = 'https://campussave-rouge.vercel.app';
const HTTPS_TIMEOUT_MS = 8000;
const SMTP_TIMEOUT_MS = 5000;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getEmailProviderStatus(config = env) {
  const webhookUrl = (config?.MAIL_WEBHOOK_URL ?? env.MAIL_WEBHOOK_URL ?? '').trim();
  const brevoApiKey = (config?.BREVO_API_KEY ?? env.BREVO_API_KEY ?? '').trim();
  const mailUser = (config?.MAIL_USER ?? env.MAIL_USER ?? '').trim();
  const mailPass = (config?.MAIL_PASS ?? env.MAIL_PASS ?? '').replace(/\s+/g, '');

  const hasWebhook = Boolean(webhookUrl);
  const hasBrevo = Boolean(brevoApiKey);
  const hasSmtp = Boolean(mailUser && mailPass);

  const activeProvider = hasWebhook
    ? 'webhook'
    : hasBrevo
    ? 'brevo'
    : hasSmtp
    ? 'smtp'
    : 'none';

  return { activeProvider, hasWebhook, hasBrevo, hasSmtp };
}

export function resolvePublicOrigin(webAppUrl = env.WEB_APP_URL) {
  const candidate = typeof webAppUrl === 'string' ? webAppUrl.trim() : '';
  if (candidate && !candidate.includes('localhost') && !candidate.includes('127.0.0.1')) {
    return candidate.replace(/\/+$/, '');
  }
  return DEFAULT_PUBLIC_ORIGIN;
}

export function resolveReceiptRecipient({ order, student, overrideEmail }) {
  const rawEmail =
    overrideEmail ||
    order?.receiptEmail ||
    student?.email ||
    order?.studentSnapshot?.email ||
    '';
  const toEmail = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  const studentName =
    (student?.displayName || order?.studentSnapshot?.displayName || 'Étudiant ESSECT').trim() ||
    'Étudiant ESSECT';
  return { toEmail, studentName };
}

function formatTunisReceiptDate(value) {
  let ms = Date.now();
  if (value?.toDate) {
    ms = value.toDate().getTime();
  } else if (value) {
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) ms = parsed;
  }
  try {
    return new Intl.DateTimeFormat('fr-TN', {
      timeZone: 'Africa/Tunis',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}

export function buildOrderReceiptText({ order, student, merchant, overrideEmail, publicOrigin: explicitOrigin }) {
  const origin = explicitOrigin || resolvePublicOrigin();
  const { studentName } = resolveReceiptRecipient({ order, student, overrideEmail });

  const orderId = order?.orderId || order?.id || '';
  const orderCode = order?.orderCode || orderId || 'CS-CAMPUSSAVE';
  const paymentRef = order?.payment?.paymentRef || 'KONNECT-TEST';
  const merchantName =
    merchant?.name ||
    order?.merchantSnapshot?.name ||
    'Commerce Partenaire ESSECT';
  const dateLabel = formatTunisReceiptDate(order?.payment?.confirmedAt || order?.updatedAt || order?.createdAt);

  const items = normalizeOrderItems(order || {});
  const subtotalMillimes = Number.isFinite(order?.pricing?.subtotalMillimes)
    ? order.pricing.subtotalMillimes
    : items.reduce((sum, it) => sum + it.lineSubtotalMillimes, 0);
  const discountMillimes = Number(order?.pricing?.discountMillimes || 0);
  const totalMillimes = Number.isFinite(order?.pricing?.totalMillimes)
    ? order.pricing.totalMillimes
    : Math.max(0, subtotalMillimes - discountMillimes);
  const savedMillimes = Number(order?.pricing?.savedMillimes || 0);
  const ticketUrl = `${origin}/app/orders/${encodeURIComponent(orderId)}/ticket`;

  const itemLines = items.map(
    (item) => `- ${item.quantity}x ${item.title} : ${formatTND(item.lineSubtotalMillimes)}`
  );

  return [
    `Bonjour ${studentName},`,
    '',
    `Votre paiement pour la commande #${orderCode} chez ${merchantName} est confirmé (Konnect).`,
    `Date : ${dateLabel}`,
    `Référence paiement : ${paymentRef}`,
    '',
    'Détail des plats :',
    ...itemLines,
    '',
    `Total payé : ${formatTND(totalMillimes)}`,
    `Économie réalisée : ${formatTND(savedMillimes)}`,
    '',
    `Votre Living Ticket QR : ${ticketUrl}`,
    '',
    'CampusSave — ESSECT Montfleury, Tunis',
  ].join('\n');
}

export function buildOrderReceiptHtml({ order, student, merchant, overrideEmail, publicOrigin: explicitOrigin }) {
  const origin = explicitOrigin || resolvePublicOrigin();
  const mascotUrl = `${origin}/assets/brand/mascot-sticker-256.png`;
  const { studentName } = resolveReceiptRecipient({ order, student, overrideEmail });

  const orderId = order?.orderId || order?.id || '';
  const orderCode = order?.orderCode || orderId || 'CS-CAMPUSSAVE';
  const paymentRef = order?.payment?.paymentRef || 'KONNECT-TEST';
  const merchantName =
    merchant?.name ||
    order?.merchantSnapshot?.name ||
    'Commerce Partenaire ESSECT';
  const dateLabel = formatTunisReceiptDate(order?.payment?.confirmedAt || order?.updatedAt || order?.createdAt);

  const items = normalizeOrderItems(order || {});
  const subtotalMillimes = Number.isFinite(order?.pricing?.subtotalMillimes)
    ? order.pricing.subtotalMillimes
    : items.reduce((sum, it) => sum + it.lineSubtotalMillimes, 0);
  const discountMillimes = Number(order?.pricing?.discountMillimes || 0);
  const totalMillimes = Number.isFinite(order?.pricing?.totalMillimes)
    ? order.pricing.totalMillimes
    : Math.max(0, subtotalMillimes - discountMillimes);
  const savedMillimes = Number(order?.pricing?.savedMillimes || 0);

  const foodSavedGrams = Number(order?.impact?.foodSavedGrams || 350);
  const co2SavedGrams = Number(order?.impact?.co2SavedGrams || 875);
  const ticketUrl = `${origin}/app/orders/${encodeURIComponent(orderId)}/ticket`;

  const itemsRowsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px dashed #D6CEC0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111111;font-weight:700;">
            ${item.quantity}x ${escapeHtml(item.title)}
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px dashed #D6CEC0;font-family:'Courier New',Courier,monospace;font-size:14px;color:#111111;font-weight:700;white-space:nowrap;">
            ${escapeHtml(formatTND(item.lineSubtotalMillimes))}
          </td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Reçu CampusSave #${escapeHtml(orderCode)}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF3E6;color:#111111;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;font-size:1px;color:#FAF3E6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    Bonjour ${escapeHtml(studentName)}, merci d'avoir sauvé un panier anti-gaspi chez ${escapeHtml(merchantName)} sur CampusSave ESSECT !
  </span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#FAF3E6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#FAF6EE;border:2px solid #111111;border-radius:16px;overflow:hidden;">
          <!-- Header Espresso Ink -->
          <tr>
            <td style="background-color:#111111;padding:20px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="vertical-align:middle;">
                    <img src="${escapeHtml(mascotUrl)}" alt="CampusSave Mascotte" width="52" height="52" style="width:52px;height:52px;border-radius:12px;border:2px solid #FFD000;vertical-align:middle;margin-right:12px;display:inline-block;" />
                    <span style="display:inline-block;vertical-align:middle;">
                      <span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:900;letter-spacing:1.2px;color:#FFD000;text-transform:uppercase;">
                        CAMPUSSAVE • ESSECT MONTFLEURY
                      </span>
                      <span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#FAF3E6;margin-top:4px;">
                        Confirmation de commande · ${escapeHtml(studentName)}
                      </span>
                    </span>
                  </td>
                  <td align="right" valign="middle" style="vertical-align:middle;">
                    <span style="display:inline-block;background-color:#DA0711;color:#FFFFFF;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;padding:6px 10px;border-radius:999px;border:1px solid #FFD000;letter-spacing:0.6px;white-space:nowrap;">
                      Commande confirmée
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Warm Greeting -->
          <tr>
            <td style="padding:20px 24px 0 24px;font-size:14px;line-height:1.5;color:#111111;">
              Bonjour <strong>${escapeHtml(studentName)}</strong>, merci d'avoir sauvé un panier anti-gaspi chez <strong>${escapeHtml(merchantName)}</strong> sur CampusSave ESSECT !
            </td>
          </tr>

          <!-- Order Metadata -->
          <tr>
            <td style="padding:24px 24px 12px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#FFFFFF;border:2px solid #111111;border-radius:12px;padding:16px;">
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#5E5850;text-transform:uppercase;letter-spacing:0.8px;">Commande</td>
                  <td align="right" style="padding:4px 0;font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:900;color:#111111;">#${escapeHtml(orderCode)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#5E5850;text-transform:uppercase;letter-spacing:0.8px;">Référence Konnect</td>
                  <td align="right" style="padding:4px 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#111111;">${escapeHtml(paymentRef)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#5E5850;text-transform:uppercase;letter-spacing:0.8px;">Date (Tunis)</td>
                  <td align="right" style="padding:4px 0;font-size:13px;color:#111111;">${escapeHtml(dateLabel)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#5E5850;text-transform:uppercase;letter-spacing:0.8px;">Commerce</td>
                  <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;color:#111111;">${escapeHtml(merchantName)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Itemized Table -->
          <tr>
            <td style="padding:12px 24px;">
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#5E5850;text-transform:uppercase;letter-spacing:1px;">Détail du panier sauvé</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${itemsRowsHtml}
              </table>
            </td>
          </tr>

          <!-- Financial Summary -->
          <tr>
            <td style="padding:8px 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#5E5850;">Sous-total</td>
                  <td align="right" style="padding:4px 0;font-family:'Courier New',Courier,monospace;font-size:13px;color:#111111;">${escapeHtml(formatTND(subtotalMillimes))}</td>
                </tr>
                ${
                  discountMillimes > 0
                    ? `<tr>
                  <td style="padding:4px 0;font-size:13px;color:#1F7A3A;font-weight:700;">Remise Fidélité EcoPoints</td>
                  <td align="right" style="padding:4px 0;font-family:'Courier New',Courier,monospace;font-size:13px;color:#1F7A3A;font-weight:700;">-${escapeHtml(formatTND(discountMillimes))}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding:12px 0 4px 0;border-top:2px solid #111111;font-size:16px;font-weight:900;text-transform:uppercase;color:#111111;">Total Payé</td>
                  <td align="right" style="padding:12px 0 4px 0;border-top:2px solid #111111;font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:900;color:#DA0711;">${escapeHtml(formatTND(totalMillimes))}</td>
                </tr>
                ${
                  savedMillimes > 0
                    ? `<tr>
                  <td style="padding:4px 0;font-size:13px;color:#1F7A3A;font-weight:700;">Économie Réalisée</td>
                  <td align="right" style="padding:4px 0;font-family:'Courier New',Courier,monospace;font-size:13px;color:#1F7A3A;font-weight:700;">${escapeHtml(formatTND(savedMillimes))}</td>
                </tr>`
                    : ''
                }
              </table>
            </td>
          </tr>

          <!-- Ecological Impact Pill -->
          <tr>
            <td align="center" style="padding:4px 24px 20px 24px;">
              <div style="display:inline-block;background-color:#E7F5EC;border:2px solid #1F7A3A;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;color:#1F7A3A;">
                🌱 +${foodSavedGrams}g de nourriture sauvée • -${co2SavedGrams}g CO₂e évités
              </div>
            </td>
          </tr>

          <!-- Direct CTA Button -->
          <tr>
            <td align="center" style="padding:0 24px 28px 24px;">
              <a href="${escapeHtml(ticketUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#DA0711;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:900;text-decoration:none;padding:14px 28px;border-radius:999px;border:2px solid #111111;">
                Ouvrir mon Living Ticket QR →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#EDE6D7;padding:14px 20px;border-top:2px solid #111111;font-size:11px;color:#5E5850;">
              CampusSave · Plateforme anti-gaspillage alimentaire · ESSECT Montfleury, Tunis
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const emailService = {
  /**
   * Expédie le reçu thermique HTML CampusSave via cascade Port-443 (Apps Script / Brevo)
   * puis repli SMTP local avec timeouts stricts. Ne jette jamais en production si un relai échoue.
   */
  async sendOrderReceiptEmail({
    order,
    student,
    merchant,
    overrideEmail,
    config = env,
    transportFactory,
    fetchImpl = globalThis.fetch,
  } = {}) {
    const { toEmail, studentName } = resolveReceiptRecipient({ order, student, overrideEmail });
    const orderId = order?.orderId || order?.id || '';
    const orderCode = order?.orderCode || orderId;
    const nodeEnv = config?.NODE_ENV ?? env.NODE_ENV;

    const webhookUrl = (config?.MAIL_WEBHOOK_URL ?? env.MAIL_WEBHOOK_URL ?? '').trim();
    const webhookSecret = (config?.MAIL_WEBHOOK_SECRET ?? env.MAIL_WEBHOOK_SECRET ?? '').trim();
    const brevoApiKey = (config?.BREVO_API_KEY ?? env.BREVO_API_KEY ?? '').trim();
    const mailUser = (config?.MAIL_USER ?? env.MAIL_USER ?? '').trim();
    const mailPass = (config?.MAIL_PASS ?? env.MAIL_PASS ?? '').replace(/\s+/g, '');
    const fromName = (config?.MAIL_FROM_NAME ?? env.MAIL_FROM_NAME ?? 'CampusSave ESSECT').trim() || 'CampusSave ESSECT';
    const fromEmail = (config?.MAIL_FROM_EMAIL ?? env.MAIL_FROM_EMAIL ?? mailUser).trim();

    if (!toEmail) {
      logger.info({ orderId }, 'Receipt email skipped (no recipient email)');
      return { sent: false, simulated: true, provider: 'none', toEmail: '', error: 'MISSING_RECIPIENT_EMAIL' };
    }

    const hasExplicitInjector = Boolean(transportFactory) || webhookUrl || brevoApiKey;
    if (nodeEnv === 'test' && !hasExplicitInjector) {
      logger.info({ orderId, toEmail }, 'Receipt email simulated in test environment');
      return { sent: false, simulated: true, provider: 'test', toEmail };
    }

    const publicOrigin = resolvePublicOrigin(config?.WEB_APP_URL ?? env.WEB_APP_URL);
    const html = buildOrderReceiptHtml({
      order,
      student,
      merchant,
      overrideEmail,
      publicOrigin,
    });
    const text = buildOrderReceiptText({
      order,
      student,
      merchant,
      overrideEmail,
      publicOrigin,
    });
    const merchantName = merchant?.name || order?.merchantSnapshot?.name || 'Commerce ESSECT';
    const subject = `Confirmation de commande #${orderCode} — ${merchantName}`;
    const replyTo = fromEmail || mailUser || 'number2.fedi@gmail.com';

    let lastProvider = 'none';
    let lastError = null;

    // Tier 1: Google Apps Script HTTPS Gmail Bridge (Port 443)
    if (webhookUrl) {
      lastProvider = 'webhook';
      try {
        const res = await fetchImpl(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          signal: AbortSignal.timeout(HTTPS_TIMEOUT_MS),
          body: JSON.stringify({
            secret: webhookSecret,
            to: toEmail,
            toName: studentName,
            subject,
            text,
            html,
            fromName: fromName || 'CampusSave ESSECT',
            replyTo,
          }),
        });
        const bodyText = await res.text().catch(() => '');
        const isHtmlResponse =
          /<!doctype html|<html/i.test(bodyText) ||
          (typeof res.url === 'string' && res.url.includes('accounts.google.com'));

        if (isHtmlResponse) {
          throw new Error('APPS_SCRIPT_NOT_PUBLIC_OR_HTML_RESPONSE');
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${bodyText.slice(0, 120)}`);
        }
        if (bodyText.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(bodyText);
            if (parsed?.ok === false) {
              throw new Error(parsed.error || 'APPS_SCRIPT_REJECTED');
            }
          } catch (jsonErr) {
            if (jsonErr?.message && !jsonErr.message.includes('JSON')) {
              throw jsonErr;
            }
          }
        }
        logger.info({ orderId, toEmail, provider: 'webhook' }, 'Receipt email delivered via HTTPS webhook');
        return { sent: true, simulated: false, provider: 'webhook', toEmail };
      } catch (err) {
        lastError = err?.message || 'WEBHOOK_FAILED';
        logger.warn({ orderId, toEmail, err: lastError }, 'Tier 1 HTTPS mail webhook failed');
      }
    }

    // Tier 2: Brevo Transactional REST API (Port 443)
    if (brevoApiKey) {
      lastProvider = 'brevo';
      try {
        const senderEmail = fromEmail || 'no-reply@campussave.tn';
        const res = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': brevoApiKey,
          },
          signal: AbortSignal.timeout(HTTPS_TIMEOUT_MS),
          body: JSON.stringify({
            sender: { name: fromName, email: senderEmail },
            to: [{ email: toEmail, name: studentName }],
            replyTo: { email: replyTo, name: fromName },
            subject,
            textContent: text,
            htmlContent: html,
          }),
        });
        if (!res.ok) {
          const bodyPreview = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${bodyPreview.slice(0, 120)}`);
        }
        const json = await res.json().catch(() => ({}));
        logger.info({ orderId, toEmail, provider: 'brevo', messageId: json?.messageId }, 'Receipt email delivered via Brevo HTTPS');
        return { sent: true, simulated: false, provider: 'brevo', toEmail, messageId: json?.messageId };
      } catch (err) {
        lastError = err?.message || 'BREVO_FAILED';
        logger.warn({ orderId, toEmail, err: lastError }, 'Tier 2 Brevo HTTPS mail failed');
      }
    }

    // Tier 3: Local Dev SMTP Fallback (only when neither Tier 1 nor Tier 2 is set, with strict 5s timeouts)
    if (!webhookUrl && !brevoApiKey && ((mailUser && mailPass) || transportFactory)) {
      lastProvider = 'smtp';
      try {
        const transporter = transportFactory
          ? transportFactory({ mailUser, mailPass })
          : nodemailer.createTransport({
              host: config?.MAIL_HOST || env.MAIL_HOST || 'smtp.gmail.com',
              port: Number(config?.MAIL_PORT ?? env.MAIL_PORT) || 587,
              secure: false,
              connectionTimeout: SMTP_TIMEOUT_MS,
              greetingTimeout: SMTP_TIMEOUT_MS,
              socketTimeout: SMTP_TIMEOUT_MS,
              auth: {
                user: mailUser,
                pass: mailPass,
              },
              tls: {
                rejectUnauthorized: false,
              },
            });

        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail || mailUser}>`,
          to: toEmail,
          subject,
          text,
          html,
        });

        logger.info({ orderId, toEmail, provider: 'smtp', messageId: info?.messageId }, 'Receipt email sent via SMTP');
        return { sent: true, simulated: false, provider: 'smtp', toEmail, messageId: info?.messageId };
      } catch (err) {
        const rawErr = err?.message || String(err || '');
        const code = err?.code || '';
        const isBlocked =
          code === 'ETIMEDOUT' ||
          code === 'ECONNREFUSED' ||
          code === 'ESOCKET' ||
          /timeout|ETIMEDOUT|ECONNREFUSED/i.test(rawErr);
        const friendlyErr = isBlocked ? 'SMTP_BLOCKED_ON_HOST_USE_PORT_443_WEBHOOK_OR_BREVO' : rawErr;
        logger.warn({ orderId, toEmail, err: friendlyErr, rawErr }, 'Tier 3 SMTP mail failed');
        return { sent: false, simulated: false, provider: 'smtp', toEmail, error: friendlyErr };
      }
    }

    if (lastError) {
      return { sent: false, simulated: false, provider: lastProvider, toEmail, error: lastError };
    }

    logger.info({ orderId, toEmail }, 'Receipt email skipped or simulated (no active mail provider)');
    return { sent: false, simulated: true, provider: 'none', toEmail, error: 'NO_MAIL_PROVIDER_CONFIGURED' };
  },
};

export const sendOrderReceiptEmail = emailService.sendOrderReceiptEmail.bind(emailService);
