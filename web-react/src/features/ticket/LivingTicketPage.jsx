// 💡 Concept & Analogie : Comme le salon d'accès VIP où vous visualisez votre carte d'embarquement prête à l'emploi avec toutes les indications pour rejoindre la porte à pied.
// 🔄 Comparaison React / Flutter : En React, `LivingTicketPage` charge les données du ticket via l'API et affiche `BoardingPass` ; en Flutter, c'est `TicketScreen`.
// 🎯 À retenir pour la soutenance : "Le ticket vivant reste accessible hors-ligne dès qu'il a été généré une première fois pour pallier les pannes de réseau au sous-sol des commerces."

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import BoardingPass from './BoardingPass.jsx';
import UnboxingReveal from '../surprise/UnboxingReveal.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { Spinner, EmptyState } from '../../components/ui/index.js';
import RatingDialog from '../orders/RatingDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Assemble le ticket affiché à partir de la réponse /orders/:id/ticket (ticketKey, orderCode)
 * et de la commande (snapshots d'offre et de commerce).
 */
function buildTicket(id, crypto = {}, order = {}) {
  const offer = order?.offerSnapshot || {};
  const merchant = order?.merchantSnapshot || {};
  return {
    orderId: order?.orderId || order?.id || id,
    orderCode: crypto.orderCode || order?.orderCode,
    // Clé HMAC réelle du serveur (hex). Le nom historique `ticketKeyHex` reste accepté.
    ticketKeyHex: crypto.ticketKey || crypto.ticketKeyHex,
    offerTitle: offer.title,
    merchantName: merchant.name,
    merchantAddress: merchant.address?.street,
    pickupStartAt: offer.pickupStartAt,
    pickupEndAt: offer.pickupEndAt,
    quantity: order?.quantity,
    status: order?.status || 'PAID',
  };
}

const POLL_MS = 4000;

export default function LivingTicketPage() {
  const { id } = useParams();
  const { refreshProfile } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [showUnboxing, setShowUnboxing] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const autoRevealDone = useRef(false);
  const wasPaid = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchTicket() {
      setLoading(true);
      setError('');
      try {
        // Deux sources distinctes : les paramètres cryptographiques (/ticket : ticketKey, orderCode) et la
        // commande elle-même (titre, quantité, créneau, commerce). Sans la clé réelle, le QR est inscannable.
        const [ticketRes, orderRes] = await Promise.all([
          apiClient.get(ENDPOINTS.GET_TICKET(id)),
          apiClient.get(ENDPOINTS.ORDER_BY_ID(id)).catch(() => null),
        ]);
        if (isMounted) {
          const o = orderRes?.data?.order || orderRes?.data || null;
          setOrder(o);
          wasPaid.current = o?.status === 'PAID';
          setTicket(buildTicket(id, ticketRes.data?.ticket || ticketRes.data, o));
        }
      } catch (err) {
        // Jamais de faux ticket : un QR inventé ne serait pas scannable. On explique et on propose de réessayer.
        if (isMounted) setError(err?.response?.data?.error?.message || 'Ticket introuvable : la commande doit être payée pour générer le QR.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTicket();
    return () => {
      isMounted = false;
    };
  }, [id, reloadKey]);

  // Suivi du retrait en direct : dès que le commerçant valide, la commande passe à COMPLETED
  useEffect(() => {
    if (!ticket || order?.status !== 'PAID') return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.ORDER_BY_ID(id));
        const fresh = res.data?.order || res.data;
        if (fresh?.status && fresh.status !== 'PAID') {
          setOrder(fresh);
          setTicket((prev) => (prev ? { ...prev, status: fresh.status } : prev));
          if (fresh.status === 'COMPLETED') refreshProfile?.();
        }
      } catch {
        /* réseau instable : on réessaie au prochain tour */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [ticket, order?.status, id, refreshProfile]);

  const isSurprise = Boolean(order?.offerSnapshot?.isSurpriseBasket);
  const isCompleted = order?.status === 'COMPLETED';
  const hasReveal = Array.isArray(order?.reveal?.items) && order.reveal.items.length > 0;

  // Le déballage s'ouvre tout seul à la validation du retrait (une seule fois, uniquement si le retrait vient d'être validé ici)
  useEffect(() => {
    if (isCompleted && isSurprise && hasReveal && wasPaid.current && !autoRevealDone.current) {
      autoRevealDone.current = true;
      setShowUnboxing(true);
    }
  }, [isCompleted, isSurprise, hasReveal]);

  if (loading) {
    return (
      <div className="cs-container cs-page min-h-[70vh] flex flex-col items-center justify-center gap-5 text-[#111111]">
        <Spinner size="lg" />
        <p className="cs-body text-[#5E5850]">Génération du Living Ticket sécurisé...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="cs-container cs-page text-[#111111]">
        <Link to="/app/orders" className="cs-link inline-flex items-center min-h-[44px] mb-6">← Mes tickets</Link>
        <EmptyState
          icon="🎟️"
          title="Ticket indisponible"
          description={error || 'Impossible de charger ce ticket.'}
          action={<button type="button" onClick={() => setReloadKey((k) => k + 1)} className="cs-btn cs-btn-red">Réessayer</button>}
        />
      </div>
    );
  }

  const ratingOrder = order
    ? { ...order, id: order.orderId || order.id || id, merchantName: order.merchantSnapshot?.name, offerTitle: order.offerSnapshot?.title }
    : null;

  return (
    <div className="cs-container cs-page text-[#111111]">
      {/* En-tête navigation */}
      <Link to="/app/orders" className="cs-link inline-flex items-center min-h-[44px] mb-6">
        ← Mes tickets
      </Link>

      <header className="mb-10 lg:mb-14">
        <p className="cs-eyebrow mb-3">Montfleury · Campus ESSECT</p>
        <h1 className="cs-display">Mon ticket</h1>
        <p className="cs-lead mt-4 max-w-2xl">
          {isCompleted
            ? 'Retrait validé : bon appétit ! Vos EcoPoints sont déjà crédités.'
            : 'Montrez ce ticket vivant au comptoir. Le QR code change toutes les 30 secondes : une capture d\'écran ne passera pas.'}
        </p>
      </header>

      {isCompleted && (
        <div className="cs-card p-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="status">
          <p className="text-lg font-semibold">
            ✅ Retrait validé{order?.rewards?.pointsAwarded ? ` · +${order.rewards.pointsAwarded} EcoPoints` : ''}
          </p>
          <div className="flex flex-wrap gap-3">
            {isSurprise && hasReveal && (
              <button type="button" onClick={() => setShowUnboxing(true)} className="cs-btn cs-btn-mustard cs-btn-sm">🎁 Voir mon panier</button>
            )}
            {!order?.rating && (
              <button type="button" onClick={() => setShowRating(true)} className="cs-btn cs-btn-red cs-btn-sm">⭐ Noter la commande</button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-12 lg:gap-16 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] items-start">
        {/* Le Billet Vivant */}
        <div className="lg:sticky lg:top-28">
          <BoardingPass ticket={ticket} />
        </div>

        {/* Mode d'emploi */}
        <aside className="space-y-10 lg:pt-4">
          <section>
            <h2 className="cs-title mb-8">Au comptoir</h2>
            <ol className="space-y-7">
              {[
                ['Arrivez dans le créneau', 'Le commerçant prépare votre lot pour l’heure indiquée sur le ticket.'],
                ['Montrez le QR code', 'Luminosité au maximum, le commerçant le scanne en une seconde.'],
                ['Caméra en panne ?', 'Dictez le code de secours à 6 chiffres affiché sous le QR.'],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-5">
                  <span className="cs-dot-badge shrink-0 !w-12 !h-12 !text-lg">{i + 1}</span>
                  <div>
                    <p className="cs-h3">{title}</p>
                    <p className="cs-body text-[#5E5850] mt-1">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {isSurprise && (
            <section className="cs-card p-6 sm:p-8">
              <span className="cs-sticker cs-sticker-red mb-5">Surprise</span>
              <h2 className="cs-h3 mt-2">Panier surprise</h2>
              <p className="cs-body text-[#5E5850] mt-2">
                {isCompleted && hasReveal
                  ? 'Le contenu du panier a été révélé : revivez l’ouverture de la boîte.'
                  : 'Le contenu reste secret jusqu’au retrait : il se révélera ici, automatiquement, dès que le commerçant aura validé votre ticket.'}
              </p>
              {isCompleted && hasReveal && (
                <button type="button" onClick={() => setShowUnboxing(true)} className="cs-btn cs-btn-mustard cs-btn-block mt-6">
                  <span aria-hidden="true">🎁</span>
                  <span>Revoir l’unboxing</span>
                </button>
              )}
            </section>
          )}
        </aside>
      </div>

      {/* Déballage du vrai contenu du panier (renvoyé par le serveur au scan) */}
      {showUnboxing && <UnboxingReveal isOpen={showUnboxing} order={order} onClose={() => setShowUnboxing(false)} />}

      {/* Notation 1 à 5 étoiles d'une commande terminée */}
      <RatingDialog
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        order={showRating ? ratingOrder : null}
        onSuccess={({ rating }) => setOrder((prev) => (prev ? { ...prev, rating } : prev))}
      />
    </div>
  );
}
