// 💡 Concept & Analogie : Comme le centre de contrôle urbain d'un service d'urgence ou d'une flotte autonome, cette page projette en 3D la topographie de Montfleury avec un tracé néon orange reliant l'ESSECT aux commerçants partenaires.
// 🔄 Comparaison React / Flutter : En React, propulsé par MapLibre GL WebGL avec vue inclinée (pitch 62°), bâtiments volumétriques et cartes 3D inclinables ; en Flutter, rendu via flutter_map avec polylignes et fiches tactiles.
// 🎯 À retenir pour la soutenance : "Le Montfleury Holo-Radar concrétise l'expérience Griddlecar (image6.png) et Fika (image3.png) : un circuit néon orange relie l'ESSECT aux commerces, avec pins numérotés et fiches en perspective 3D."
// Module : Holo-Radar 3D WebGL

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { mockMerchants, mockOffers } from '../../mocks/index.js';
import { getFramerFoodImage } from '../../lib/framerAssets.js';
import { MAP_CONFIG, add3DBuildingsLayer } from './mapStyle.js';
import { setupBeaconLayers, createFikaNumberedMarkers } from './beaconLayer.js';
import { setupCircuitRoute, updateWalkingPath } from './walkingPath.js';
import { droneSwoopToMerchant, resetToCampusHome } from './cameraFx.js';
import { DepthCard } from '../../components/common/DepthCard.jsx';
import {
  Compass,
  Layers,
  Footprints,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  RotateCcw,
  Store,
  Calendar,
  Bell,
  Navigation,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

// Fallback photographique haute définition pour les commerces de Montfleury
const MERCHANT_PHOTOS = {
  'merchant-baguette-baguette': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
  'merchant-etoile-savoir': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
  'merchant-patisserie-masmoudi': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
  'merchant-le-dome': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  'merchant-bella-napoli': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
};

// Horaires de collecte types pour la fiche calendrier de droite (image6.png)
const SCHEDULE_SLOTS = [
  { time: '11:30 - 13:00', label: 'Rush Déjeuner Campus', merchantId: 'merchant-baguette-baguette' },
  { time: '13:30 - 15:00', label: 'Goûter & Cafétéria', merchantId: 'merchant-etoile-savoir' },
  { time: '16:00 - 18:00', label: 'Douceurs du Jour', merchantId: 'merchant-patisserie-masmoudi' },
  { time: '18:30 - 20:30', label: 'Dîner Chaud Éco', merchantId: 'merchant-le-dome' },
  { time: '20:00 - 21:30', label: 'Soirée Pizzas & Fours', merchantId: 'merchant-bella-napoli' },
];

export default function HoloRadarPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [radiusM, setRadiusM] = useState(1500);
  const [radarData, setRadarData] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('3D'); // '3D' | '2D'
  const [alertSuccess, setAlertSuccess] = useState(false);

  const RADIUS_OPTIONS = [500, 1000, 1500, 2500, 3000];

  // Chargement des données géospatiales depuis l'API avec fallback robuste
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchRadar() {
      try {
        const response = await apiClient.get(`${ENDPOINTS.RADAR}?radiusM=${radiusM}`);
        if (isMounted) {
          if (response.data && response.data.merchants && response.data.merchants.length > 0) {
            setRadarData(response.data);
          } else {
            // Repli gracieux sur les mocks de démonstration de Montfleury
            setRadarData({
              merchants: mockMerchants.map((m) => {
                const offers = mockOffers.filter((o) => o.merchantId === m.id);
                return {
                  ...m,
                  activeOffers: offers,
                  activeOfferCount: offers.length || 2,
                  beaconUrgencyColor:
                    offers.length > 3
                      ? MAP_CONFIG.COLORS.URGENCY_HIGH
                      : MAP_CONFIG.COLORS.URGENCY_MEDIUM,
                };
              }),
              totalMerchants: mockMerchants.length,
            });
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Mode hors-ligne / secours pour Holo-Radar :', err);
          setRadarData({
            merchants: mockMerchants.map((m) => {
              const offers = mockOffers.filter((o) => o.merchantId === m.id);
              return {
                ...m,
                activeOffers: offers,
                activeOfferCount: offers.length || 2,
                beaconUrgencyColor:
                  offers.length > 3
                    ? MAP_CONFIG.COLORS.URGENCY_HIGH
                    : MAP_CONFIG.COLORS.URGENCY_MEDIUM,
              };
            }),
            totalMerchants: mockMerchants.length,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRadar();

    return () => {
      isMounted = false;
    };
  }, [radiusM]);

  // Liste ordonnée des commerces par distance de l'ESSECT
  const sortedMerchants = useMemo(() => {
    const list = radarData?.merchants || [];
    return [...list].sort(
      (a, b) => (a.distanceM || a.distanceFromEssectM || 0) - (b.distanceM || b.distanceFromEssectM || 0)
    );
  }, [radarData?.merchants]);

  // Les 3 commerces les plus proches pour les 3 fiches du bas (image3.png)
  const topThreeMerchants = useMemo(() => {
    return sortedMerchants.slice(0, 3);
  }, [sortedMerchants]);

  // Gestion de la sélection d'un commerçant
  const handleSelectMerchant = useCallback((merchant) => {
    setSelectedMerchant(merchant);

    if (mapRef.current && merchant?.location) {
      const coords = [merchant.location.lng, merchant.location.lat];
      // Drone Swoop cinématique vers la cible
      droneSwoopToMerchant(mapRef.current, coords);
      // Met à jour la ligne de trajectoire d'approche piétonne
      updateWalkingPath(mapRef.current, coords);
    }
  }, []);

  // Désélection et recentrage vers le Campus ESSECT
  const handleCloseDrawer = useCallback(() => {
    setSelectedMerchant(null);
    if (mapRef.current) {
      resetToCampusHome(mapRef.current);
      updateWalkingPath(mapRef.current, null);
    }
  }, []);

  // Déclenche l'alerte de notification (simulation bouton "Text me when parked")
  const handleTriggerAlert = useCallback(() => {
    setAlertSuccess(true);
    setTimeout(() => setAlertSuccess(false), 3500);
  }, []);

  // Nettoyage et rafraîchissement des marqueurs HTML
  const refreshMarkers = useCallback(
    (map, merchants) => {
      // Supprime les anciens marqueurs pour éviter toute fuite de mémoire
      if (markersRef.current && markersRef.current.length > 0) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
      }

      if (map && merchants && merchants.length > 0) {
        markersRef.current = createFikaNumberedMarkers(map, merchants, handleSelectMerchant);
      }
    },
    [handleSelectMerchant]
  );

  // Initialisation du moteur MapLibre 3D WebGL
  useEffect(() => {
    if (viewMode !== '3D' || !mapContainerRef.current) return;

    const merchants = sortedMerchants;

    if (!mapRef.current) {
      try {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_CONFIG.DEFAULT_STYLE,
          center: MAP_CONFIG.DEFAULT_CAMERA.center,
          zoom: MAP_CONFIG.DEFAULT_CAMERA.zoom,
          pitch: MAP_CONFIG.DEFAULT_CAMERA.pitch,
          bearing: MAP_CONFIG.DEFAULT_CAMERA.bearing,
          antialias: true,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

        map.on('load', () => {
          // Bâtiments 3D extrudés ambrés/obsidienne
          add3DBuildingsLayer(map);

          // Injection des balises 3D et du circuit néon orange (image6.png)
          if (merchants.length > 0) {
            setupBeaconLayers(map, merchants, handleSelectMerchant);
            setupCircuitRoute(map, merchants);
            refreshMarkers(map, merchants);
          }
        });

        map.on('error', (e) => {
          console.warn('MapLibre WebGL incident :', e);
        });

        mapRef.current = map;
      } catch (e) {
        console.warn('Initialisation WebGL impossible, bascule en vue 2D :', e);
        setViewMode('2D');
      }
    } else {
      // Carte déjà existante : mise à jour sans rechargement lourd (ZÉRO boucle 60fps)
      if (mapRef.current.isStyleLoaded() && merchants.length > 0) {
        setupBeaconLayers(mapRef.current, merchants, handleSelectMerchant);
        setupCircuitRoute(mapRef.current, merchants);
        refreshMarkers(mapRef.current, merchants);
      }
    }

    return () => {
      // Nettoie les marqueurs au démontage
      if (markersRef.current) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
      }
    };
  }, [viewMode, sortedMerchants, handleSelectMerchant, refreshMarkers]);

  // Gardes d'affichage (jamais de "0,000 DT" ni de NaN)
  const priceOrDash = (millimes) => {
    const n = Number(millimes);
    return millimes === null || millimes === undefined || !Number.isFinite(n) || n <= 0 ? '—' : formatTND(n);
  };
  const distanceLabel = (m) => `${m.distanceM || m.distanceFromEssectM || 200} m`;
  const ratingLabel = (m) => {
    const r = Number(m?.ratingAvg);
    return Number.isFinite(r) && r > 0 ? r.toFixed(1).replace('.', ',') : '4,8';
  };
  const FALLBACK_PHOTO =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="relative w-full h-[calc(100vh-82px)] min-h-[560px] bg-[#FAF3E6] overflow-hidden flex flex-col font-sans text-[#111111]">
      {/* 1. BARRE DE COMMANDE SUPÉRIEURE */}
      <div className="z-30 bg-[#FAF3E6] border-b-2 border-[#111111] px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        {/* Titre & Statut */}
        <div className="min-w-0">
          <p className="cs-eyebrow mb-2 flex items-center gap-2">
            <Compass className="w-4 h-4" aria-hidden="true" />
            Campus ESSECT · {sortedMerchants.length} relais actifs à portée
          </p>
          <h1 className="cs-display !text-[clamp(3.25rem,6vw,5.5rem)] flex flex-wrap items-center gap-x-4 gap-y-1">
            Holo-Radar
            <span className="cs-sticker cs-sticker-red !text-lg">3D live</span>
          </h1>
        </div>

        {/* Sélecteur de rayon d'exploration */}
        <div className="flex flex-wrap items-center gap-2 max-w-full" role="group" aria-label="Rayon d'exploration">
          <span className="cs-label shrink-0 mr-1">Rayon</span>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRadiusM(r);
                handleCloseDrawer();
              }}
              aria-pressed={radiusM === r}
              className="cs-chip shrink-0 !px-4"
            >
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>

        {/* Boutons d'action : Bascule 3D/2D et Recentrage ESSECT */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
            className="cs-btn cs-btn-ink cs-btn-sm min-h-[2.75rem]"
          >
            <Layers className="w-4 h-4" aria-hidden="true" />
            {viewMode === '3D' ? 'Vue liste' : 'Radar 3D'}
          </button>

          {viewMode === '3D' && (
            <button
              type="button"
              onClick={() => {
                if (mapRef.current) resetToCampusHome(mapRef.current);
              }}
              title="Recentrer sur le campus ESSECT"
              aria-label="Recentrer sur le campus ESSECT"
              className="cs-icon-btn"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. ZONE CENTRALE : VUE 3D OU LISTE 2D */}
      <div className="relative flex-1 w-full min-h-0">
        {viewMode === '3D' ? (
          <div ref={mapContainerRef} className="w-full h-full bg-[#E2D8C5]" />
        ) : (
          /* VUE 2D DE SECOURS */
          <div className="w-full h-full overflow-y-auto">
            <div className="cs-container cs-page">
              <header className="mb-10">
                <p className="cs-eyebrow mb-3">Autour de l'ESSECT</p>
                <h2 className="cs-display">Commerces à portée</h2>
                <p className="cs-lead mt-4 max-w-2xl">
                  {sortedMerchants.length} établissements triés par proximité piétonne immédiate.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMerchants.map((m, idx) => (
                  <button
                    type="button"
                    key={m.id || m.merchantId}
                    onClick={() => handleSelectMerchant(m)}
                    className="cs-card cs-card-hover p-6 text-left flex flex-col justify-between gap-5 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="cs-dot-badge shrink-0">{idx + 1}</span>
                        <span className="cs-pill cs-pill-red">{m.activeOfferCount || 1} panier(s)</span>
                      </div>
                      <h3 className="cs-h3 line-clamp-2 group-hover:text-[#DA0711] transition-colors">{m.name}</h3>
                      <p className="text-base text-[#5E5850] mt-2 line-clamp-2">{m.description || m.type}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-[#111111]/10">
                      <span className="flex items-center gap-2 font-semibold uppercase text-[15px]">
                        <Footprints className="w-5 h-5 text-[#DA0711]" aria-hidden="true" />
                        {m.walkingMinutes || 4} min à pied
                      </span>
                      <span className="cs-link flex items-center gap-1">
                        Voir <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. TITRE ÉDITORIAL EN SURIMPRESSION (panneau encre) */}
        {viewMode === '3D' && (
          <div className="hidden md:block absolute top-5 left-5 z-20 pointer-events-none max-w-sm">
            <div className="cs-card-ink p-6">
              <p className="cs-eyebrow !text-[#FFD000] mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DA0711] animate-pulse" aria-hidden="true" />
                Direct Montfleury · {sortedMerchants.length || 5} arrêts
              </p>
              <h2 className="cs-title !text-[#FAF3E6]">
                Autour de l’ESSECT, <span className="text-[#DA0711]">heure par heure.</span>
              </h2>
              <p className="text-lg text-[#FAF3E6]/85 mt-3 leading-snug">
                Circuits d'invendus, créneaux de collecte et trajets piétons en temps réel.
              </p>
            </div>
          </div>
        )}

        {/* 4. PANNEAU CRÈME À DROITE (PROGRAMME & ALERTES) */}
        {viewMode === '3D' && !selectedMerchant && (
          <div className="hidden lg:flex flex-col gap-4 absolute top-5 right-14 z-20 w-[360px] max-h-[calc(100%-2.5rem)] overflow-y-auto bg-[#FAF3E6] border-2 border-[#111111] rounded-[1.25rem] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="cs-eyebrow">Programme du jour</p>
                <h3 className="cs-h3 mt-1">Créneaux de sauvetage</h3>
              </div>
              <span className="cs-pill cs-pill-mustard">Aujourd'hui</span>
            </div>

            {/* Liste chronologique des créneaux */}
            <ul className="flex flex-col">
              {SCHEDULE_SLOTS.map((slot, index) => {
                const targetM = sortedMerchants.find((m) => (m.id || m.merchantId) === slot.merchantId);
                const isFirst = index === 0;

                return (
                  <li key={slot.time} className="border-b-2 border-[#111111]/10 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (targetM) handleSelectMerchant(targetM);
                      }}
                      className={`w-full min-h-[3.5rem] py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#EDE6D7] group ${
                        isFirst ? 'bg-[#EDE6D7]' : ''
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-1.5 self-stretch rounded-full ${isFirst ? 'bg-[#DA0711]' : 'bg-[#111111]/20 group-hover:bg-[#FFD000]'}`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#5E5850]">
                            <Clock className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
                            {slot.time}
                          </span>
                          <span className="block text-base font-semibold uppercase leading-tight line-clamp-2 group-hover:text-[#DA0711] transition-colors">
                            {targetM ? targetM.name : slot.label}
                          </span>
                        </span>
                      </span>
                      <span className="text-[14px] font-semibold whitespace-nowrap">
                        {targetM ? `${targetM.walkingMinutes || 3} min` : '5 min'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Notification de confirmation si l'alerte a été cliquée */}
            {alertSuccess && (
              <div className="rounded-2xl bg-[#DDEFD9] text-[#1F7A3A] px-4 py-3 text-[15px] font-semibold flex items-center gap-2 animate-fadeIn" role="status">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                Alertes SMS & Push activées pour le prochain créneau !
              </div>
            )}

            {/* Boutons CTA d'action */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  alert("Planning synchronisé avec l'agenda Google / ICS de l'ESSECT !");
                }}
                className="cs-btn cs-btn-cream cs-btn-sm !px-3"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>Agenda</span>
              </button>

              <button type="button" onClick={handleTriggerAlert} className="cs-btn cs-btn-red cs-btn-sm !px-3">
                <Bell className="w-4 h-4" aria-hidden="true" />
                <span>M'alerter</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. TROIS FICHES NUMÉROTÉES EN BAS (X MIN À PIED) */}
        {viewMode === '3D' && !selectedMerchant && (
          <div className="absolute bottom-4 left-0 right-0 sm:bottom-5 sm:left-5 sm:right-5 lg:right-[436px] z-20 pointer-events-none">
            <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-none px-4 sm:px-0 pb-1">
              {topThreeMerchants.map((merchant, idx) => {
                const num = idx + 1;
                const cutoutUrl = getFramerFoodImage(merchant.name || merchant.type || '');
                const photoUrl = MERCHANT_PHOTOS[merchant.id] || FALLBACK_PHOTO;
                const offersCount = merchant.activeOfferCount || merchant.activeOffers?.length || 2;
                const minPrice = merchant.activeOffers?.[0]?.currentPriceMillimes;

                return (
                  <DepthCard
                    key={merchant.id || merchant.merchantId}
                    maxTilt={8}
                    scale={1.02}
                    glare={false}
                    onClick={() => handleSelectMerchant(merchant)}
                    className="pointer-events-auto cursor-pointer snap-start shrink-0 w-[78%] sm:w-[46%] md:w-auto bg-[#FAF3E6] border-2 border-[#111111] rounded-[1.25rem] p-3"
                  >
                    {/* Photo pleine largeur */}
                    <div className="cs-photo cs-photo-zoom aspect-[16/9] rounded-xl">
                      <img
                        src={photoUrl}
                        alt={merchant.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = cutoutUrl;
                        }}
                      />
                      <span className="cs-dot-badge absolute top-2 left-2 z-10 border-2 border-[#FAF3E6]">{num}</span>
                      <span className="cs-pill cs-pill-mustard absolute top-2 right-2 z-10">{offersCount} panier(s)</span>
                    </div>

                    <div className="px-1 pt-3">
                      <h3 className="text-[17px] font-bold uppercase leading-tight line-clamp-2 min-h-[2.5em]">{merchant.name}</h3>
                      <p className="cs-figure text-[1.6rem] text-[#DA0711] mt-1">
                        {priceOrDash(minPrice) !== '—' && <span className="cs-label mr-2 align-middle">Dès</span>}
                        {priceOrDash(minPrice)}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[14px] font-semibold text-[#5E5850]">
                        <span className="flex items-center gap-1.5 uppercase text-[#111111]">
                          <Footprints className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
                          {merchant.walkingMinutes || 3} min à pied
                        </span>
                        <span>{distanceLabel(merchant)}</span>
                      </div>
                    </div>
                  </DepthCard>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. TIROIR LATÉRAL : DÉTAILS D'UN COMMERCE CIBLÉ AVEC DRONE SWOOP */}
        {selectedMerchant && (
          <div className="absolute top-0 right-0 z-40 w-full sm:w-[440px] h-full bg-[#FAF3E6] sm:border-l-2 border-[#111111] p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Bouton de fermeture */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="cs-eyebrow flex items-center gap-2">
                <Store className="w-4 h-4" aria-hidden="true" /> Relais partenaire
              </span>
              <button
                type="button"
                onClick={handleCloseDrawer}
                aria-label="Fermer la fiche du commerce"
                className="cs-icon-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photographie d'en-tête */}
            <div className="cs-photo aspect-[16/9] mb-5">
              <img
                src={MERCHANT_PHOTOS[selectedMerchant.id] || FALLBACK_PHOTO}
                alt={selectedMerchant.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                }}
              />
              <span className="cs-pill cs-pill-mustard absolute top-3 right-3 z-10">★ {ratingLabel(selectedMerchant)}</span>
            </div>

            <h2 className="cs-figure text-[clamp(2.5rem,6vw,3.25rem)] uppercase">{selectedMerchant.name}</h2>
            <p className="text-base text-[#5E5850] mt-1">{selectedMerchant.address?.street || 'Montfleury, Tunis'}</p>

            {/* Guide piétonnier Montfleury */}
            <div className="cs-card-ink mt-5 mb-8 px-5 py-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold uppercase text-base text-[#FFD000]">
                <Footprints className="w-5 h-5" aria-hidden="true" />
                {selectedMerchant.walkingMinutes || 3} min à pied
              </span>
              <span className="text-[15px] text-[#FAF3E6]/80">{distanceLabel(selectedMerchant)} de l'ESSECT</span>
            </div>

            {/* Paniers d'invendus disponibles */}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="cs-h3">Paniers disponibles ({selectedMerchant.activeOffers?.length || 0})</h3>
              </div>

              {(!selectedMerchant.activeOffers || selectedMerchant.activeOffers.length === 0) ? (
                <div className="cs-card p-6 text-center">
                  <p className="text-base">Tous les paniers de ce commerce ont été sauvés pour le moment.</p>
                  <p className="cs-pill cs-pill-mustard mt-3">Prochain créneau à 16:00 !</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {selectedMerchant.activeOffers.map((offer) => (
                    <article key={offer.id || offer.offerId} className="cs-card p-5">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h4 className="text-lg font-bold uppercase leading-tight line-clamp-2">{offer.title}</h4>
                        {offer.isSurprise && <span className="cs-pill cs-pill-ink shrink-0">Mystère</span>}
                      </div>

                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="cs-figure text-[2.25rem] text-[#DA0711]">
                          {priceOrDash(offer.currentPriceMillimes || offer.currentPrice)}
                        </span>
                        {offer.originalPriceMillimes && (
                          <span className="text-base text-[#5E5850] line-through">
                            {priceOrDash(offer.originalPriceMillimes)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 text-[15px] font-semibold text-[#5E5850] mb-4">
                        <span className="flex items-center gap-1.5 text-[#111111]">
                          <Clock className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
                          Fin dans {offer.minutesLeft || 35} min
                        </span>
                        <span>Stock : {offer.quantityAvailable || 1}</span>
                      </div>

                      <Link to={`/app/offers/${offer.id || offer.offerId}`} className="cs-btn cs-btn-red cs-btn-block">
                        Réserver ce panier <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
