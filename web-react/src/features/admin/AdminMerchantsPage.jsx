// 💡 Concept & Analogie : Comme la préfecture ou la mairie qui délivre les licences d'exploitation après vérification du cadastre et du registre d'hygiène, cette console permet à l'administration universitaire d'agréer ou de suspendre un commerce.
// 🔄 Comparaison React / Flutter : En React, la table de validation intègre des onglets de filtrage et une modale avec motif obligatoire de rejet ; en Flutter, la même logique est portée par un écran d'administration responsive.
// 🎯 À retenir pour la soutenance : "Toute décision administrative est enregistrée dans une transaction atomique Firestore avec l'identifiant de l'administrateur, et déclenche une notification push FCM instantanée vers le gérant concerné."

import React, { useState, useEffect } from 'react';
import { MERCHANT_STATUS } from '@shared/constants.js';
import { distanceFromEssect, calculateWalkingMinutes } from '@shared/geo.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTunisDate } from '../../lib/formatters.js';
import {
  Button,
  Card,
  Badge,
  Modal,
  Tabs,
  Toast,
} from '../../components/ui/index.js';

// Données démo initiales réalistes de Montfleury
const DEMO_ADMIN_MERCHANTS = [
  {
    id: 'merch-01',
    name: 'Pizzeria Bella Napoli',
    type: 'RESTAURANT',
    phone: '+21671390555',
    street: 'Boulevard du 9 Avril, Montfleury',
    lat: 36.7915,
    lng: 10.1710,
    status: MERCHANT_STATUS.PENDING,
    statusReason: '',
    submittedAt: 'Aujourd hui à 14h20',
  },
  {
    id: 'merch-02',
    name: 'Baguette & Baguette Montfleury',
    type: 'FAST_FOOD',
    phone: '+21671390111',
    street: 'Avenue Habib Bourguiba, Montfleury',
    lat: 36.7885,
    lng: 10.1762,
    status: MERCHANT_STATUS.APPROVED,
    statusReason: 'Dossier conforme et validé',
    submittedAt: 'Hier à 11h00',
  },
  {
    id: 'merch-03',
    name: "Cafétéria L'Étoile du Savoir",
    type: 'CAFETERIA',
    phone: '+21671390222',
    street: "Rue de l'ESSECT, Montfleury",
    lat: 36.7865,
    lng: 10.1739,
    status: MERCHANT_STATUS.APPROVED,
    statusReason: 'Dossier conforme',
    submittedAt: 'Hier à 09h30',
  },
  {
    id: 'merch-04',
    name: 'Pâtisserie Masmoudi Montfleury',
    type: 'PATISSERIE',
    phone: '+21671390333',
    street: 'Rue de la République, Montfleury',
    lat: 36.7892,
    lng: 10.1725,
    status: MERCHANT_STATUS.APPROVED,
    statusReason: 'Dossier conforme',
    submittedAt: '15 Nov 2026',
  },
];

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState(DEMO_ADMIN_MERCHANTS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [rejectModalData, setRejectModalData] = useState(null); // { merchant, reason }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadAdminMerchants() {
      try {
        const res = await apiClient.get(ENDPOINTS.ADMIN_MERCHANTS);
        if (res.data?.merchants && res.data.merchants.length > 0) {
          setMerchants(res.data.merchants);
        }
      } catch (err) {
        console.warn('API admin merchants fallback démo:', err.message);
      }
    }
    loadAdminMerchants();
  }, []);

  const tabs = [
    { id: 'ALL', label: 'Tous les Commerces', count: merchants.length },
    {
      id: MERCHANT_STATUS.PENDING,
      label: 'En Attente',
      count: merchants.filter((m) => m.status === MERCHANT_STATUS.PENDING).length,
    },
    {
      id: MERCHANT_STATUS.APPROVED,
      label: 'Agréés',
      count: merchants.filter((m) => m.status === MERCHANT_STATUS.APPROVED).length,
    },
    {
      id: MERCHANT_STATUS.REJECTED,
      label: 'Rejetés',
      count: merchants.filter((m) => m.status === MERCHANT_STATUS.REJECTED).length,
    },
  ];

  const filteredMerchants = merchants.filter((m) => {
    if (activeTab === 'ALL') return true;
    return m.status === activeTab;
  });

  async function handleApprove(merchant) {
    try {
      await apiClient.patch(ENDPOINTS.ADMIN_MERCHANT_STATUS(merchant.id), {
        status: MERCHANT_STATUS.APPROVED,
        statusReason: 'Dossier validé par la commission universitaire ESSECT',
        reason: 'Dossier validé par la commission universitaire ESSECT',
      });
    } catch (err) {
      console.warn('API approve fallback:', err.message);
    }

    setMerchants((prev) =>
      prev.map((m) =>
        m.id === merchant.id
          ? { ...m, status: MERCHANT_STATUS.APPROVED, statusReason: 'Approuvé par Admin' }
          : m
      )
    );

    setToast({
      type: 'success',
      message: `Le commerce ${merchant.name} a été approuvé avec succès !`,
    });
  }

  async function handleConfirmReject() {
    if (!rejectModalData || !rejectModalData.reason.trim()) {
      setToast({ type: 'error', message: 'Le motif de rejet est obligatoire.' });
      return;
    }

    const { merchant, reason, newStatus } = rejectModalData;

    try {
      await apiClient.patch(ENDPOINTS.ADMIN_MERCHANT_STATUS(merchant.id), {
        status: newStatus || MERCHANT_STATUS.REJECTED,
        statusReason: reason,
        reason,
      });
    } catch (err) {
      console.warn('API reject fallback:', err.message);
    }

    setMerchants((prev) =>
      prev.map((m) =>
        m.id === merchant.id
          ? { ...m, status: newStatus || MERCHANT_STATUS.REJECTED, statusReason: reason }
          : m
      )
    );

    setToast({
      type: 'warning',
      message: `Le statut de ${merchant.name} est désormais : ${newStatus || 'REJETÉ'}`,
    });

    setRejectModalData(null);
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#141210]/15">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-anton uppercase tracking-wide text-[#141210]">
                Validation des Commerces Partenaires
              </h1>
              <Badge variant="griddle" size="md">CONSOLE ADMIN</Badge>
            </div>
            <p className="text-xs text-[#141210]/70 mt-1 font-sans">
              Contrôlez l'ancrage local (rayon ≤ 3 km de l'ESSECT) et délivrez les agréments de publication.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Table */}
        <Card className="bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141210] text-white uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Établissement</th>
                  <th className="py-3.5 px-4 font-bold">Type</th>
                  <th className="py-3.5 px-4 font-bold">Distance ESSECT</th>
                  <th className="py-3.5 px-4 font-bold">Statut</th>
                  <th className="py-3.5 px-4 font-bold">Date Dossier</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions Décisionnelles</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#141210]/15">
                {filteredMerchants.map((merchant) => {
                  const lat = merchant.location?.lat ?? merchant.lat;
                  const lng = merchant.location?.lng ?? merchant.lng;
                  const street = merchant.address?.street ?? merchant.street ?? 'Montfleury';
                  const dist = (lat != null && lng != null) ? distanceFromEssect(lat, lng) : (merchant.distanceM ?? 500);
                  const walk = calculateWalkingMinutes(dist);
                  const isPending = merchant.status === MERCHANT_STATUS.PENDING;
                  const isApproved = merchant.status === MERCHANT_STATUS.APPROVED;

                  return (
                    <tr
                      key={merchant.id}
                      className="hover:bg-white/50 transition-colors"
                    >
                      <td className="py-4 px-4 font-bold text-[#141210]">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏪</span>
                          <div>
                            <span className="block font-black text-sm">{merchant.name}</span>
                            <span className="text-[11px] text-[#141210]/60 font-sans">
                              {street}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-[#141210]">
                        {merchant.type}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-anton text-sm text-[#141210] block">
                          {dist} m
                        </span>
                        <span className="text-[10px] text-[#141210]/60 font-mono">
                          ~{walk} min à pied
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            isApproved
                              ? 'green'
                              : isPending
                              ? 'yellow'
                              : 'red'
                          }
                          size="sm"
                          dot={isApproved}
                        >
                          {merchant.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-[#141210]/70 font-mono">
                        {merchant.submittedAt?.includes('T') ? formatTunisDate(merchant.submittedAt) : merchant.submittedAt}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => handleApprove(merchant)}
                              className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#15803D] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] hover:shadow-[1px_1px_0px_#141210] text-xs font-black transition-all"
                            >
                              ✓ Approuver
                            </button>
                          )}

                          {merchant.status !== MERCHANT_STATUS.REJECTED && (
                            <button
                              type="button"
                              onClick={() =>
                                setRejectModalData({
                                  merchant,
                                  reason: '',
                                  newStatus: MERCHANT_STATUS.REJECTED,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] hover:shadow-[1px_1px_0px_#141210] text-xs font-black transition-all"
                            >
                              ✕ Rejeter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal Rejet */}
        <Modal
          isOpen={Boolean(rejectModalData)}
          onClose={() => setRejectModalData(null)}
          title={`Refuser le dossier : ${rejectModalData?.merchant?.name}`}
          description="Un motif explicatif est obligatoire pour notifier le commerçant."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModalData(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
              >
                Confirmer le Rejet
              </Button>
            </>
          }
        >
          {rejectModalData && (
            <div className="space-y-3 py-2 text-xs">
              <label className="block text-xs font-black uppercase text-[#141210]/70 font-mono">
                Motif officiel communiqué au gérant :
              </label>
              <textarea
                rows={3}
                value={rejectModalData.reason}
                onChange={(e) =>
                  setRejectModalData((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="ex : Établissement situé au-delà de 3 000 m ou registre non conforme..."
                className="w-full bg-white text-[#141210] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] rounded-xl p-3 outline-none font-sans font-medium"
              />
            </div>
          )}
        </Modal>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}