// 💡 Concept & Analogie : Comme la préfecture ou la mairie qui délivre les licences d'exploitation après vérification du cadastre et du registre d'hygiène, cette console permet à l'administration universitaire d'agréer ou de suspendre un commerce.
// 🔄 Comparaison React / Flutter : En React, la table de validation intègre des onglets de filtrage et une modale avec motif obligatoire de rejet ; en Flutter, la même logique est portée par un écran d'administration responsive.
// 🎯 À retenir pour la soutenance : "Toute décision administrative est enregistrée dans une transaction atomique Firestore avec l'identifiant de l'administrateur, et déclenche une notification push FCM instantanée vers le gérant concerné."

import React, { useState, useEffect, useCallback } from 'react';
import { MERCHANT_STATUS, MERCHANT_TYPES } from '@shared/constants.js';
import SpotEditor from '../radar/SpotEditor.jsx';
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
  const [usingDemo, setUsingDemo] = useState(true); // vrai tant que la liste ne vient pas de l'API : aucune action de spot en mode démo
  const [spotModal, setSpotModal] = useState(null); // { mode: 'create' | 'move', merchant? }
  const [spotForm, setSpotForm] = useState({ name: '', type: MERCHANT_TYPES.FAST_FOOD, phone: '+216', street: '' });
  const [spotLoc, setSpotLoc] = useState(null); // { lat, lng, withinRadius, ... } renvoyé par SpotEditor
  const [spotBusy, setSpotBusy] = useState(false);
  const [spotError, setSpotError] = useState('');
  const [removeModal, setRemoveModal] = useState(null); // { merchant, hard }

  const loadAdminMerchants = useCallback(async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN_MERCHANTS);
      if (Array.isArray(res.data?.merchants)) {
        setMerchants(res.data.merchants);
        setUsingDemo(false);
      }
    } catch (err) {
      console.warn('API admin merchants fallback démo:', err.message);
    }
  }, []);

  useEffect(() => {
    loadAdminMerchants();
  }, [loadAdminMerchants]);

  function apiErrorMessage(err, fallback) {
    const e = err?.response?.data?.error;
    if (e?.code === 'TOO_FAR') return e.message || 'Hors du rayon de 3 km autour de l\'ESSECT.';
    if (Array.isArray(e?.details) && e.details.length > 0) return `${e.message || 'Données invalides'} : ${e.details.map((d) => `${d.field} — ${d.message}`).join(' ; ')}`;
    if (e?.message) return e.message;
    if (err?.response) return `${fallback} (erreur ${err.response.status})`;
    return "Serveur injoignable : rien n'a été modifié.";
  }

  function openCreateSpot() {
    setSpotForm({ name: '', type: MERCHANT_TYPES.FAST_FOOD, phone: '+216', street: '' });
    setSpotLoc(null);
    setSpotError('');
    setSpotModal({ mode: 'create' });
  }

  function openMoveSpot(merchant) {
    const lat = merchant.location?.lat ?? merchant.lat;
    const lng = merchant.location?.lng ?? merchant.lng;
    setSpotLoc(lat != null && lng != null ? { lat, lng, withinRadius: true } : null);
    setSpotError('');
    setSpotModal({ mode: 'move', merchant });
  }

  async function handleSaveSpot() {
    if (!spotLoc) {
      setSpotError('Placez le spot sur la carte ou collez des coordonnées.');
      return;
    }
    if (!spotLoc.withinRadius) {
      setSpotError('Cet emplacement est hors du rayon de 3 km autour de l\'ESSECT : le serveur le refusera.');
      return;
    }
    setSpotBusy(true);
    setSpotError('');
    try {
      if (spotModal.mode === 'create') {
        await apiClient.post(ENDPOINTS.ADMIN_MERCHANTS, {
          name: spotForm.name.trim(),
          type: spotForm.type,
          phone: spotForm.phone.trim(),
          address: { street: spotForm.street.trim() || 'Montfleury' },
          location: { lat: spotLoc.lat, lng: spotLoc.lng },
        });
        setToast({ type: 'success', message: `Spot « ${spotForm.name.trim()} » ajouté au radar.` });
      } else {
        await apiClient.patch(ENDPOINTS.ADMIN_MERCHANT_LOCATION(spotModal.merchant.id), { location: { lat: spotLoc.lat, lng: spotLoc.lng } });
        setToast({ type: 'success', message: `« ${spotModal.merchant.name} » déplacé.` });
      }
      setSpotModal(null);
      await loadAdminMerchants();
    } catch (err) {
      setSpotError(apiErrorMessage(err, "Impossible d'enregistrer le spot"));
    } finally {
      setSpotBusy(false);
    }
  }

  async function handleRemove() {
    if (!removeModal) return;
    setSpotBusy(true);
    try {
      await apiClient.delete(`${ENDPOINTS.ADMIN_MERCHANT(removeModal.merchant.id)}?hard=${removeModal.hard ? 'true' : 'false'}`);
      setToast({ type: 'success', message: removeModal.hard ? 'Spot supprimé définitivement.' : 'Commerce archivé (retiré du radar, données conservées).' });
      setRemoveModal(null);
      await loadAdminMerchants();
    } catch (err) {
      setToast({ type: 'error', message: apiErrorMessage(err, 'Impossible de retirer ce commerce') });
      setRemoveModal(null);
    } finally {
      setSpotBusy(false);
    }
  }

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
      setToast({
        type: 'success',
        message: `Le commerce "${merchant.name}" a été officiellement approuvé !`,
      });
      await loadAdminMerchants();
    } catch (err) {
      console.warn('API approve error:', err.message);
      setToast({ type: 'error', message: apiErrorMessage(err, "Impossible d'approuver ce commerce") });
    }
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
      setToast({
        type: 'warning',
        message: `Le statut de ${merchant.name} est désormais : ${newStatus || 'REJETÉ'}`,
      });
      setRejectModalData(null);
      await loadAdminMerchants();
    } catch (err) {
      console.warn('API reject error:', err.message);
      setToast({ type: 'error', message: apiErrorMessage(err, "Impossible de modifier le statut de ce commerce") });
      setRejectModalData(null);
    }
  }

  // Données d'affichage par ligne (partagées entre la table desktop et les cartes mobiles)
  const merchantRows = filteredMerchants.map((merchant) => {
    const lat = merchant.location?.lat ?? merchant.lat;
    const lng = merchant.location?.lng ?? merchant.lng;
    const street = merchant.address?.street ?? merchant.street ?? 'Montfleury';
    const dist = (lat != null && lng != null) ? distanceFromEssect(lat, lng) : (merchant.distanceM ?? 500);
    const walk = calculateWalkingMinutes(dist);
    return {
      merchant,
      street,
      typeLabel: TYPE_LABELS[merchant.type] || merchant.type || '—',
      distLabel: Number.isFinite(Number(dist)) ? `${Number(dist).toLocaleString('fr-FR')} m` : '—',
      walkLabel: Number.isFinite(Number(walk)) ? `${walk} min à pied` : '',
      isPending: merchant.status === MERCHANT_STATUS.PENDING,
      isApproved: merchant.status === MERCHANT_STATUS.APPROVED,
      statusUi: STATUS_UI[merchant.status] || { label: merchant.status || '—', pill: 'cs-pill-outline' },
    };
  });

  const renderStatusPill = (row) => (
    <span className={`cs-pill shrink-0 ${row.statusUi.pill}`}>
      {row.isApproved && <span className="w-2 h-2 rounded-full bg-[#1F7A3A]" aria-hidden="true" />}
      {row.statusUi.label}
    </span>
  );

  const renderActions = (row, block) => {
    const { merchant, isApproved } = row;
    const canReject = merchant.status !== MERCHANT_STATUS.REJECTED;
    if (isApproved && !canReject) return null;
    return (
      <div className={block ? 'mt-5 grid gap-3' : 'inline-flex flex-wrap justify-end items-center gap-2'}>
        {!isApproved && (
          <button
            type="button"
            onClick={() => handleApprove(merchant)}
            className={`cs-btn cs-btn-ink ${block ? 'cs-btn-block' : 'cs-btn-sm'}`}
          >
            ✓ Approuver
          </button>
        )}

        {canReject && (
          <button
            type="button"
            onClick={() =>
              setRejectModalData({
                merchant,
                reason: '',
                newStatus: MERCHANT_STATUS.REJECTED,
              })
            }
            className={`cs-btn cs-btn-cream !text-[#DA0711] ${block ? 'cs-btn-block' : 'cs-btn-sm'}`}
          >
            ✕ Rejeter
          </button>
        )}

        {!usingDemo && (
          <>
            <button type="button" onClick={() => openMoveSpot(merchant)} className={`cs-btn cs-btn-cream ${block ? 'cs-btn-block' : 'cs-btn-sm'}`}>
              Déplacer
            </button>
            {merchant.archived ? null : (
              <button type="button" onClick={() => setRemoveModal({ merchant, hard: false })} className={`cs-btn cs-btn-cream ${block ? 'cs-btn-block' : 'cs-btn-sm'}`}>
                Archiver
              </button>
            )}
            {merchant.isDemoSpot && (
              <button type="button" onClick={() => setRemoveModal({ merchant, hard: true })} className={`cs-btn cs-btn-cream !text-[#DA0711] ${block ? 'cs-btn-block' : 'cs-btn-sm'}`}>
                Supprimer
              </button>
            )}
          </>
        )}
      </div>
    );
  };

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
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={openCreateSpot} disabled={usingDemo} className="cs-btn cs-btn-red">
              ＋ Ajouter un spot
            </button>
            {usingDemo && (
              <span className="cs-help-text">Mode démonstration (aucun commerce réel chargé) : l'ajout, le déplacement et le retrait de spots demandent l'API.</span>
            )}
          </div>
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
          <>
            {/* Mobile (< md) : une carte empilée par commerce */}
            <ul className="md:hidden flex flex-col gap-4">
              {merchantRows.map((row) => (
                <li key={row.merchant.id} className="cs-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[18px] font-semibold uppercase leading-tight line-clamp-2 min-w-0">{row.merchant.name}</h3>
                    {renderStatusPill(row)}
                  </div>
                  <p className="text-[15px] text-[#5E5850] mt-1 line-clamp-2">{row.street}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
                    <div>
                      <dt className="cs-label">Type</dt>
                      <dd className="font-semibold">{row.typeLabel}</dd>
                    </div>
                    <div>
                      <dt className="cs-label">Distance</dt>
                      <dd className="font-semibold">{row.distLabel}{row.walkLabel ? ` · ${row.walkLabel}` : ''}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="cs-label">Dossier</dt>
                      <dd>{submittedLabel(row.merchant)}</dd>
                    </div>
                  </dl>
                  {row.merchant.statusReason && !row.isPending && (
                    <p className="text-[15px] text-[#5E5850] mt-3 line-clamp-2">{row.merchant.statusReason}</p>
                  )}
                  {renderActions(row, true)}
                </li>
              ))}
            </ul>

            {/* Desktop (≥ md) : table */}
            <div className="hidden md:block cs-card p-2 overflow-x-auto">
              <table className="cs-table">
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
                  {merchantRows.map((row) => (
                    <tr key={row.merchant.id}>
                      <td className="min-w-[200px]">
                        <span className="block text-[17px] font-semibold uppercase leading-tight line-clamp-2">{row.merchant.name}</span>
                        <span className="block text-[15px] text-[#5E5850] mt-1 line-clamp-2">{row.street}</span>
                      </td>
                      <td className="whitespace-nowrap font-semibold">{row.typeLabel}</td>
                      <td className="whitespace-nowrap">
                        <span className="cs-figure text-[1.75rem] block">{row.distLabel}</span>
                        {row.walkLabel && <span className="text-[14px] text-[#5E5850]">~{row.walkLabel}</span>}
                      </td>
                      <td>
                        {renderStatusPill(row)}
                        {row.merchant.statusReason && !row.isPending && (
                          <span className="block text-[14px] text-[#5E5850] mt-1.5 max-w-[220px] line-clamp-2">
                            {row.merchant.statusReason}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-[#5E5850]">{submittedLabel(row.merchant)}</td>
                      <td className="text-right">{renderActions(row, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

        {/* Modal Spot : ajout ou déplacement sur la carte 3D */}
        <Modal
          isOpen={Boolean(spotModal)}
          onClose={() => setSpotModal(null)}
          size="xl"
          title={spotModal?.mode === 'create' ? 'Ajouter un spot de démonstration' : `Déplacer : ${spotModal?.merchant?.name || ''}`}
          description="Rayon maximal : 3 km autour de l'ESSECT (vérifié aussi par le serveur)."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setSpotModal(null)}>Annuler</Button>
              <Button variant="primary" size="sm" isLoading={spotBusy} onClick={handleSaveSpot} disabled={!spotLoc || !spotLoc.withinRadius || (spotModal?.mode === 'create' && (spotForm.name.trim().length < 2 || !/^\+216[2-9]\d{7}$/.test(spotForm.phone.trim())))}>
                {spotModal?.mode === 'create' ? 'Ajouter au radar' : 'Enregistrer la position'}
              </Button>
            </>
          }
        >
          {spotModal && (
            <div className="py-2 space-y-5">
              {spotModal.mode === 'create' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="spot-name" className="cs-field-label">Nom du spot</label>
                    <input id="spot-name" className="cs-input" value={spotForm.name} onChange={(e) => setSpotForm((f) => ({ ...f, name: e.target.value }))} placeholder="ex : Sandwicherie du coin" />
                  </div>
                  <div>
                    <label htmlFor="spot-type" className="cs-field-label">Type</label>
                    <select id="spot-type" className="cs-input" value={spotForm.type} onChange={(e) => setSpotForm((f) => ({ ...f, type: e.target.value }))}>
                      {Object.entries(MERCHANT_TYPES).map(([k, v]) => (
                        <option key={k} value={v}>{TYPE_LABELS[v] || v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="spot-phone" className="cs-field-label">Téléphone</label>
                    <input id="spot-phone" className="cs-input" value={spotForm.phone} onChange={(e) => setSpotForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+21671390111" />
                  </div>
                  <div>
                    <label htmlFor="spot-street" className="cs-field-label">Rue</label>
                    <input id="spot-street" className="cs-input" value={spotForm.street} onChange={(e) => setSpotForm((f) => ({ ...f, street: e.target.value }))} placeholder="ex : Avenue Habib Bourguiba" />
                  </div>
                </div>
              )}
              <SpotEditor value={spotLoc ? { lat: spotLoc.lat, lng: spotLoc.lng } : null} onChange={setSpotLoc} />
              {spotError && <p className="cs-error-text" role="alert">{spotError}</p>}
            </div>
          )}
        </Modal>

        {/* Modal retrait : archivage (par défaut) ou suppression définitive d'un spot de démo */}
        <Modal
          isOpen={Boolean(removeModal)}
          onClose={() => setRemoveModal(null)}
          title={removeModal?.hard ? 'Supprimer définitivement ce spot ?' : 'Archiver ce commerce ?'}
          description={removeModal?.hard ? 'Le spot de démonstration disparaît pour de bon. Action irréversible.' : 'Il disparaît du radar mais ses données sont conservées.'}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setRemoveModal(null)}>Annuler</Button>
              <Button variant="danger" size="sm" isLoading={spotBusy} onClick={handleRemove}>
                {removeModal?.hard ? 'Supprimer définitivement' : 'Archiver'}
              </Button>
            </>
          }
        >
          {removeModal && <p className="cs-body py-2">{removeModal.merchant.name}</p>}
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
