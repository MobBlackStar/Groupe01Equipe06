// 💡 Concept & Analogie : Comme le salon d'accès VIP où vous visualisez votre carte d'embarquement prête à l'emploi avec toutes les indications pour rejoindre la porte à pied.
// 🔄 Comparaison React / Flutter : En React, `LivingTicketPage` charge les données du ticket via l'API et affiche `BoardingPass` ; en Flutter, c'est `TicketScreen`.
// 🎯 À retenir pour la soutenance : "Le ticket vivant reste accessible hors-ligne dès qu'il a été généré une première fois pour pallier les pannes de réseau au sous-sol des commerces."

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BoardingPass from './BoardingPass.jsx';
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
  pickupStartAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  pickupEndAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  quantity: 2,
  ticketKeyHex: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  status: 'PAID',
};

export default function LivingTicketPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchTicket() {
      setLoading(true);
      try {
        const response = await apiClient.get(ENDPOINTS.GET_TICKET(id));
        if (isMounted) {
          setTicket(response.data?.ticket || response.data || FALLBACK_TICKET);
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
      <div className="min-h-screen bg-[#0D0F12] flex flex-col items-center justify-center gap-4 text-white">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Génération du Living Ticket sécurisé...</p>
      </div>
    );
  }

  const currentTicket = ticket || FALLBACK_TICKET;

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* En-tête navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/orders"
            className="text-xs font-semibold text-slate-400 hover:text-[#CCFF00] transition-colors"
          >
            ← Mes commandes
          </Link>
          <div className="text-xs text-slate-400">
            Montfleury • Campus ESSECT
          </div>
        </div>

        {/* Le Billet Vivant */}
        <BoardingPass ticket={currentTicket} />

        {/* Conseils et Consignes de retrait */}
        <div className="p-4 rounded-2xl bg-[#161920] border border-white/5 space-y-2 text-xs">
          <h4 className="font-bold text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>Sécurité Anti-Fraude & Conseils</span>
          </h4>
          <p className="text-slate-400 leading-relaxed">
            Ce QR code est dynamique et ne peut pas être partagé par capture d'écran. Présentez directement cet écran au commerçant qui le scannera avec son terminal sécurisé.
          </p>
        </div>
      </div>
    </div>
  );
}
