// 💡 Concept & Analogie : Comme le tableau de bord de gestion d'une boutique qui affiche la devanture, les horaires, les autorisations administratives et l'état des stocks, cette page centralise l'identité du commerce.
// 🔄 Comparaison React / Flutter : En React, la mise à jour s'effectue via un formulaire contrôlé avec feedback toast immédiat ; en Flutter, nous naviguons vers un écran `MerchantStoreScreen` avec scaffold dédié.
// 🎯 À retenir pour la soutenance : "Cette page intègre notre bandeau d'agrément dynamique (`PendingApprovalBanner`) qui débloque automatiquement la publication d'offres dès que l'admin approuve l'établissement."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MERCHANT_STATUS, MERCHANT_TYPES, ESSECT_COORDINATES } from '@shared/constants.js';
import { distanceFromEssect, calculateWalkingMinutes } from '@shared/geo.js';
import SpotEditor from '../radar/SpotEditor.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import PendingApprovalBanner from './PendingApprovalBanner.jsx';
import {
  Button,
  Input,
  Select,
  Toast,
} from '../../components/ui/index.js';

const STATUS_LABEL = {
  [MERCHANT_STATUS.APPROVED]: 'Approuvé',
  [MERCHANT_STATUS.PENDING]: 'En attente',
  [MERCHANT_STATUS.REJECTED]: 'Rejeté',
  [MERCHANT_STATUS.SUSPENDED]: 'Suspendu',
};

export default function MerchantStorePage() {
  const [store, setStore] = useState({
    name: '',
    type: MERCHANT_TYPES.FAST_FOOD,
    description: '',
    phone: '',
    street: '',
    area: 'Montfleury',
    city: 'Tunis',
    lat: 36.7885,
    lng: 10.1762,
    openingHours: '08:00 - 21:00',
    logoUrl: '',
    status: MERCHANT_STATUS.PENDING,
    statusReason: '',
  });

  // `noStore` : le compte n'a pas (encore) de boutique -> on ne montre aucune fiche inventée
  const [noStore, setNoStore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const distanceMeters = distanceFromEssect(store.lat, store.lng);
  const walkingMins = calculateWalkingMinutes(distanceMeters);

  const merchantTypeOptions = [
    { value: MERCHANT_TYPES.FAST_FOOD, label: '🍔 Sandwicherie & Fast-Food' },
    { value: MERCHANT_TYPES.RESTAURANT, label: '🍽️ Restaurant Traditionnel' },
    { value: MERCHANT_TYPES.CAFETERIA, label: '☕ Cafétéria & Salon de Thé' },
    { value: MERCHANT_TYPES.BOULANGERIE, label: '🥖 Boulangerie Artisanale' },
    { value: MERCHANT_TYPES.PATISSERIE, label: '🧁 Pâtisserie & Douceurs' },
  ];

  // Chargement du profil commerçant connecté
  useEffect(() => {
    async function loadStore() {
      try {
        const res = await apiClient.get(ENDPOINTS.MERCHANTS_ME);
        if (res.data?.merchant) {
          const m = res.data.merchant;
          setStore({
            name: m.name || '',
            type: m.type || MERCHANT_TYPES.FAST_FOOD,
            description: m.description || '',
            phone: m.phone || '',
            street: m.address?.street || '',
            area: m.address?.area || 'Montfleury',
            city: m.address?.city || 'Tunis',
            lat: m.location?.lat || 36.7885,
            lng: m.location?.lng || 10.1762,
            openingHours: m.openingHours || '08:00 - 21:00',
            logoUrl: m.logoUrl || '',
            status: m.status || MERCHANT_STATUS.PENDING,
            statusReason: m.statusReason || '',
          });
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setNoStore(true);
        } else {
          setToast({ type: 'error', message: err?.response?.data?.error?.message || 'Impossible de charger votre boutique.' });
        }
      }
    }
    loadStore();
  }, []);

  function handleChange(field, value) {
    setStore((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Tous les champs de la fiche partent au serveur (adresse et position comprises) ; le statut d'agrément reste protégé côté API
      const res = await apiClient.patch(ENDPOINTS.MERCHANTS_ME, {
        name: store.name.trim(),
        type: store.type,
        description: store.description,
        phone: store.phone.trim(),
        openingHours: store.openingHours.trim(),
        address: { street: store.street.trim(), area: store.area, city: store.city },
        location: { lat: Number(store.lat), lng: Number(store.lng) },
        ...(store.logoUrl.trim() ? { logoUrl: store.logoUrl.trim() } : {}),
      });
      const m = res.data?.merchant;
      if (m) setStore((prev) => ({ ...prev, lat: m.location?.lat ?? prev.lat, lng: m.location?.lng ?? prev.lng }));
      setToast({ type: 'success', message: 'Fiche commerçant mise à jour !' });
    } catch (err) {
      // Jamais de faux succès : la vraie raison (ex. TOO_FAR, téléphone invalide) est affichée
      setToast({ type: 'error', message: err?.response?.data?.error?.message || 'Enregistrement impossible : réessayez.' });
    } finally {
      setLoading(false);
    }
  }

  // Bascule démo pour tester les 3 statuts devant le jury ESSECT
  function toggleDemoStatus() {
    const nextStatus =
      store.status === MERCHANT_STATUS.APPROVED
        ? MERCHANT_STATUS.PENDING
        : store.status === MERCHANT_STATUS.PENDING
        ? MERCHANT_STATUS.REJECTED
        : MERCHANT_STATUS.APPROVED;

    const reason =
      nextStatus === MERCHANT_STATUS.REJECTED
        ? 'Attestation RNE non lisible et distance > 3000m'
        : '';

    setStore((prev) => ({ ...prev, status: nextStatus, statusReason: reason }));
    setToast({
      type: 'info',
      message: `Statut simulé pour la démonstration : ${nextStatus}`,
    });
  }

  const hasDistance = Number.isFinite(Number(distanceMeters));
  const hasWalk = Number.isFinite(Number(walkingMins));
  // Adresse sans doublons ("…, Montfleury, Montfleury" → une seule fois)
  const addressLine = [store.street, store.area, store.city]
    .flatMap((part) => String(part || '').split(','))
    .map((part) => part.trim())
    .filter((part, idx, arr) => part && arr.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === idx)
    .join(', ');
  const typeLabel = merchantTypeOptions.find((o) => o.value === store.type)?.label || store.type;

  return (
    <div className="cs-container cs-page">
      {/* En-tête */}
      <header className="mb-10 lg:mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="min-w-0">
          <p className="cs-eyebrow mb-3">Ma boutique</p>
          <h1 className="cs-display break-words">{store.name || 'Mon établissement'}</h1>
          <p className="cs-lead mt-4 max-w-2xl">
            {addressLine || 'Adresse à compléter'}
          </p>
        </div>

        <Link to="/merchant/offers" className="cs-btn cs-btn-cream shrink-0 self-start lg:self-auto">
          <span aria-hidden="true">📦</span>
          <span>Mes offres</span>
        </Link>
      </header>

      {noStore && (
        <div className="cs-card p-6 mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="status">
          <p className="text-lg font-semibold">Vous n'avez pas encore de boutique : déposez votre dossier pour publier des offres.</p>
          <Link to="/merchant/onboarding" className="cs-btn cs-btn-red cs-btn-sm shrink-0 self-start">Créer ma boutique</Link>
        </div>
      )}

      {/* BANDEAU D'AGRÉMENT TEMPS RÉEL */}
      <PendingApprovalBanner
        status={store.status}
        statusReason={store.statusReason}
        className="mb-12"
      />

      {/* Repères clés */}
      <section className="mb-16 grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="cs-stat">
          <span className="cs-label">Distance ESSECT</span>
          <span className="cs-stat-value">{hasDistance ? `${Math.round(distanceMeters)} m` : '—'}</span>
        </div>
        <div className="cs-stat">
          <span className="cs-label">À pied</span>
          <span className="cs-stat-value">{hasWalk ? `~${walkingMins} min` : '—'}</span>
        </div>
        <div className="cs-stat col-span-2 lg:col-span-1">
          <span className="cs-label">Statut</span>
          <span className="cs-stat-value text-[#DA0711]">{STATUS_LABEL[store.status] || store.status || '—'}</span>
        </div>
      </section>

      {/* Formulaire de Modification + aperçu public */}
      <section className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
       <div className="lg:col-span-8 min-w-0">
        <h2 className="cs-title mb-8">Fiche établissement</h2>

        <form onSubmit={handleSave} className="cs-card p-6 sm:p-10 space-y-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Nom de l'enseigne"
              required
              value={store.name}
              onChange={(e) => handleChange('name', e.target.value)}
              leftIcon={<span>🏪</span>}
            />

            <Select
              label="Type d'établissement"
              required
              options={merchantTypeOptions}
              value={store.type}
              onChange={(e) => handleChange('type', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="store-description" className="cs-field-label">
              Description &amp; spécialités
            </label>
            <textarea
              id="store-description"
              rows={4}
              value={store.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="cs-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Téléphone"
              required
              value={store.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              leftIcon={<span>📞</span>}
            />

            <Input
              label="Horaires de service"
              required
              value={store.openingHours}
              onChange={(e) => handleChange('openingHours', e.target.value)}
              leftIcon={<span>🕒</span>}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Adresse (rue)"
              required
              value={store.street}
              onChange={(e) => handleChange('street', e.target.value)}
              leftIcon={<span>📍</span>}
            />

            <Input
              label="Logo (lien, facultatif)"
              value={store.logoUrl}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              leftIcon={<span>🖼️</span>}
              helperText="Adresse https d'une image"
            />
          </div>

          {/* Position de la boutique : carte 3D, coordonnées Google Maps, porte sur la rue (rayon 3 km vérifié aussi par le serveur) */}
          <div className="pt-2 space-y-3">
            <span className="cs-field-label block">Emplacement de la boutique</span>
            <SpotEditor
              value={{ lat: store.lat, lng: store.lng }}
              onChange={(spot) => setStore((prev) => ({ ...prev, lat: spot.lat, lng: spot.lng }))}
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4 border-t border-[#111111]/10">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full sm:w-auto h-12 px-8 text-base font-bold shadow-sm"
            >
              Enregistrer
            </Button>
          </div>
        </form>
       </div>

        {/* Aperçu en direct de la fiche vue par les étudiants */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24" aria-label="Aperçu de la fiche">
          <h2 className="cs-title mb-8">Aperçu</h2>
          <div className="cs-card-ink p-6 sm:p-8">
            <p className="font-semibold uppercase tracking-[0.08em] text-[15px] text-[#FFD000] mb-3">
              Vu par les étudiants
            </p>
            <h3 className="cs-h3 !text-2xl break-words">{store.name || 'Mon établissement'}</h3>
            {typeLabel && <p className="text-base mt-2 text-[#FAF3E6]/80">{typeLabel}</p>}
            {store.description && (
              <p className="text-base mt-4 leading-relaxed line-clamp-4">{store.description}</p>
            )}
            <dl className="mt-6 space-y-4 text-base">
              <div>
                <dt className="text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FAF3E6]/60">Adresse</dt>
                <dd className="mt-1">{addressLine || '—'}</dd>
              </div>
              <div>
                <dt className="text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FAF3E6]/60">Horaires</dt>
                <dd className="mt-1">{store.openingHours || '—'}</dd>
              </div>
              <div>
                <dt className="text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FAF3E6]/60">Téléphone</dt>
                <dd className="mt-1 cs-mono">{store.phone || '—'}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      {/* Démo jury : bascule des 3 statuts d'agrément */}
      <section
        className="rounded-[1.25rem] border-2 border-dashed border-[#111111] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        aria-label="Démo jury"
      >
        <div>
          <p className="cs-label !text-[#111111]">Démo jury</p>
          <p className="text-base text-[#5E5850] mt-1">
            Simule les statuts d'agrément (approuvé, en attente, rejeté). Statut actuel : {STATUS_LABEL[store.status] || store.status}.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleDemoStatus}
          className="cs-btn cs-btn-mustard cs-btn-sm min-h-[44px] shrink-0"
          title="Tester les 3 états d'agrément pour la soutenance"
        >
          <span aria-hidden="true">🎭</span>
          <span>Changer le statut</span>
        </button>
      </section>

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
