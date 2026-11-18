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

// Libellés d'affichage (présentation uniquement)
const STATUS_UI = {
  [MERCHANT_STATUS.PENDING]: { label: 'En attente', pill: 'cs-pill-mustard' },
  [MERCHANT_STATUS.APPROVED]: { label: 'Approuvé', pill: 'cs-pill-leaf' },
  [MERCHANT_STATUS.REJECTED]: { label: 'Rejeté', pill: 'cs-pill-red' },
  [MERCHANT_STATUS.SUSPENDED]: { label: 'Suspendu', pill: 'cs-pill-ink' },
};

const TYPE_LABELS = {
  RESTAURANT: 'Restaurant',
  CAFETERIA: 'Cafétéria',
  BOULANGERIE: 'Boulangerie',
  FAST_FOOD: 'Fast-food',
  PATISSERIE: 'Pâtisserie',
};

// Date de dépôt : texte libre conservé, ISO / Timestamp Firestore formatés en heure de Tunis
function submittedLabel(merchant) {
  const v = merchant.submittedAt ?? merchant.createdAt;
  if (!v) return '—';
  if (typeof v === 'string' && !/^\d{4}-\d{2}-\d{2}T/.test(v)) return v;
  let input = v;
  if (typeof v?.toDate === 'function') input = v.toDate();
  else if (typeof v?._seconds === 'number') input = v._seconds * 1000;
  else if (typeof v?.seconds === 'number') input = v.seconds * 1000;
  return formatTunisDate(input, { fallback: '—', includeYear: true });
}

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
      label: 'Approuvés',
      count: merchants.filter((m) => m.status === MERCHANT_STATUS.APPROVED).length,
    },
    {
      id: MERCHANT_STATUS.REJECTED,
      label: 'Rejetés / Suspendus',
      count: merchants.filter((m) => [MERCHANT_STATUS.REJECTED, MERCHANT_STATUS.SUSPENDED].includes(m.status)).length,
    },
  ];

  const filteredMerchants = merchants.filter((m) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === MERCHANT_STATUS.REJECTED) {
      return [MERCHANT_STATUS.REJECTED, MERCHANT_STATUS.SUSPENDED].includes(m.status);
    }
    return m.status === activeTab;
  });

  async function handleApprove(merchant) {
    try {
      await apiClient.patch(ENDPOINTS.ADMIN_MERCHANT_STATUS(merchant.id), {
        status: MERCHANT_STATUS.APPROVED,
        statusReason: 'Agréé par l administration ESSECT',
      });
    } catch (err) {
      console.warn('API approve fallback:', err.message);
    }

    setMerchants((prev) =>
      prev.map((m) =>
        m.id === merchant.id ? { ...m, status: MERCHANT_STATUS.APPROVED, statusReason: 'Agréé' } : m
      )
    );

    setToast({
      type: 'success',
      message: `Le commerce "${merchant.name}" a été officiellement approuvé !`,
    });
  }

  async function handleConfirmReject() {
    if (!rejectModalData) return;
    const { merchant, reason, newStatus } = rejectModalData;

    if (!reason.trim()) {
      alert('Veuillez renseigner un motif pour justifier le refus.');
      return;
    }

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
    <div className="bg-[#FAF3E6] text-[#111111] min-h-screen">
      <div className="cs-container cs-page">
        {/* Header */}
        <header className="mb-10 lg:mb-12">
          <p className="cs-eyebrow mb-3">Console admin · Modération</p>
          <h1 className="cs-display">Commerces partenaires</h1>
          <p className="cs-lead mt-4 max-w-3xl">
            Contrôlez l'ancrage local (rayon ≤ 3 km de l'ESSECT) et délivrez les agréments de publication.
          </p>
        </header>

        {/* Filtres */}
        <div className="mb-8 -mx-1 px-1 overflow-x-auto scrollbar-none">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="!flex-nowrap sm:!flex-wrap" />
        </div>

        {/* Table */}
        {filteredMerchants.length === 0 ? (
          <div className="cs-card p-10 text-center">
            <p className="cs-h3">Aucun commerce dans cette catégorie</p>
            <p className="cs-body text-[#5E5850] mt-2">Changez de filtre pour voir les autres dossiers.</p>
          </div>
        ) : (
          <div className="cs-card p-2 overflow-x-auto">
            <table className="cs-table min-w-[880px]">
              <thead>
                <tr>
                  <th>Établissement</th>
                  <th>Type</th>
                  <th>Distance ESSECT</th>
                  <th>Statut</th>
                  <th>Dossier</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.map((merchant) => {
                  const lat = merchant.location?.lat ?? merchant.lat;
                  const lng = merchant.location?.lng ?? merchant.lng;
                  const street = merchant.address?.street ?? merchant.street ?? 'Montfleury';
                  const dist = (lat != null && lng != null) ? distanceFromEssect(lat, lng) : (merchant.distanceM ?? 500);
                  const walk = calculateWalkingMinutes(dist);
                  const isPending = merchant.status === MERCHANT_STATUS.PENDING;
                  const isApproved = merchant.status === MERCHANT_STATUS.APPROVED;
                  const statusUi = STATUS_UI[merchant.status] || { label: merchant.status || '—', pill: 'cs-pill-outline' };

                  return (
                    <tr key={merchant.id}>
                      <td className="min-w-[240px]">
                        <span className="block text-[17px] font-semibold uppercase leading-tight line-clamp-2">{merchant.name}</span>
                        <span className="block text-[15px] text-[#5E5850] mt-1 line-clamp-2">{street}</span>
                      </td>
                      <td className="whitespace-nowrap font-semibold">
                        {TYPE_LABELS[merchant.type] || merchant.type || '—'}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="cs-figure text-[1.75rem] block">{Number.isFinite(Number(dist)) ? `${dist} m` : '—'}</span>
                        <span className="text-[14px] text-[#5E5850]">
                          {Number.isFinite(Number(walk)) ? `~${walk} min à pied` : ''}
                        </span>
                      </td>
                      <td>
                        <span className={`cs-pill ${statusUi.pill}`}>
                          {isApproved && <span className="w-2 h-2 rounded-full bg-[#1F7A3A]" aria-hidden="true" />}
                          {statusUi.label}
                        </span>
                        {merchant.statusReason && !isPending && (
                          <span className="block text-[14px] text-[#5E5850] mt-1.5 max-w-[220px] line-clamp-2">
                            {merchant.statusReason}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-[#5E5850]">{submittedLabel(merchant)}</td>
                      <td className="text-right">
                        <div className="inline-flex flex-wrap justify-end items-center gap-2">
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => handleApprove(merchant)}
                              className="cs-btn cs-btn-ink cs-btn-sm"
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
                              className="cs-btn cs-btn-cream cs-btn-sm !text-[#DA0711]"
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
        )}

        {/* Modal Rejet */}
        <Modal
          isOpen={Boolean(rejectModalData)}
          onClose={() => setRejectModalData(null)}
          title={`Refuser le dossier : ${rejectModalData?.merchant?.name || ''}`}
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
                Confirmer le rejet
              </Button>
            </>
          }
        >
          {rejectModalData && (
            <div className="py-2">
              <label htmlFor="reject-reason" className="cs-field-label">
                Motif officiel communiqué au gérant
              </label>
              <textarea
                id="reject-reason"
                rows={3}
                value={rejectModalData.reason}
                onChange={(e) =>
                  setRejectModalData((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="ex : Établissement situé au-delà de 3 000 m ou registre non conforme..."
                className="cs-input"
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
