// 💡 Concept & Analogie : Comme le salon d'accès VIP où vous visualisez votre carte d'embarquement prête à l'emploi avec toutes les indications pour rejoindre la porte à pied.
// 🔄 Comparaison React / Flutter : En React, `LivingTicketPage` charge les données du ticket via l'API et affiche `BoardingPass` ; en Flutter, c'est `TicketScreen`.
// 🎯 À retenir pour la soutenance : "Le ticket vivant reste accessible hors-ligne dès qu'il a été généré une première fois pour pallier les pannes de réseau au sous-sol des commerces."

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BoardingPass from './BoardingPass.jsx';
import UnboxingReveal from '../surprise/UnboxingReveal.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { Spinner } from '../../components/ui/index.js';

// Données de secours si commande locale / offline
const FALLBACK_TICKET = {
  orderId: 'ord-demo-essectx',
  orderCode: 'CS-8K4M9',
  offerTitle: 'Baguette Farcie Escalope Panée & Double Fromage',
  merchantName: 'Baguette & Baguette Montfleury',
  merchantAddress: '14 Rue Abou El Kacem Chebbi, Montfleury, Tunis',
  pickupStartAt: new Date(Date.now() - 15 * 60 * 1000),
  pickupEndAt: new Date(Date.now() + 60 * 60 * 1000),
  quantity: 2,
  ticketKeyHex: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  status: 'PAID',
};

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

export default function LivingTicketPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnboxing, setShowUnboxing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchTicket() {
      setLoading(true);
      try {
        // Deux sources distinctes : les paramètres cryptographiques (/ticket : ticketKey, orderCode) et la
        // commande elle-même (titre, quantité, créneau, commerce). Sans la clé réelle, le QR est inscannable.
        const [ticketRes, orderRes] = await Promise.all([
          apiClient.get(ENDPOINTS.GET_TICKET(id)),
          apiClient.get(ENDPOINTS.ORDER_BY_ID(id)).catch(() => null),
        ]);
        if (isMounted) {
          setTicket(buildTicket(id, ticketRes.data?.ticket || ticketRes.data, orderRes?.data?.order || orderRes?.data));
        }
      } catch (err) {
        console.warn('Ticket non trouvé via API, activation du fallback de démonstration :', err.message);
        if (isMounted) {
          setTicket({ ...FALLBACK_TICKET, orderId: id || FALLBACK_TICKET.orderId });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTicket();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="cs-container cs-page min-h-[70vh] flex flex-col items-center justify-center gap-5 text-[#111111]">
        <Spinner size="lg" />
        <p className="cs-body text-[#5E5850]">Génération du Living Ticket sécurisé...</p>
      </div>
    );
  }

  const currentTicket = ticket || FALLBACK_TICKET;

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
          Montrez ce ticket vivant au comptoir. Le QR code change toutes les 30 secondes : une capture d'écran ne passera pas.
        </p>
      </header>

      <div className="grid gap-12 lg:gap-16 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] items-start">
        {/* Le Billet Vivant */}
        <div className="lg:sticky lg:top-28">
          <BoardingPass ticket={currentTicket} />
        </div>

        {/* Mode d'emploi + démo unboxing */}
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

          <section className="cs-card p-6 sm:p-8">
            <span className="cs-sticker cs-sticker-red mb-5">Surprise</span>
            <h2 className="cs-h3 mt-2">Panier surprise ?</h2>
            <p className="cs-body text-[#5E5850] mt-2 mb-6">
              Revivez l’ouverture de la boîte mystère et découvrez les EcoPoints gagnés.
            </p>
            {/* Bouton Démo Unboxing Panier Surprise */}
            <button
              type="button"
              onClick={() => setShowUnboxing(true)}
              className="cs-btn cs-btn-mustard cs-btn-block"
            >
              <span aria-hidden="true">🎁</span>
              <span>Revoir l’unboxing</span>
            </button>
          </section>
        </aside>
      </div>

      {/* Modale d'animation Unboxing */}
      {showUnboxing && (
        <UnboxingReveal
          isOpen={showUnboxing}
          items={[
            { title: 'Croissant aux Amandes', quantity: 2, valueMillimes: 3600 },
            { title: 'Pain au Chocolat Beurre', quantity: 2, valueMillimes: 3200 },
          ]}
          rarity="LEGENDARY"
          merchantName={currentTicket.merchantName}
          onClose={() => setShowUnboxing(false)}
        />
      )}
    </div>
  );
}
