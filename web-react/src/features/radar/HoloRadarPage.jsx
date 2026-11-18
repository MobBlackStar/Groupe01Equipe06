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

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#0E0D0C] overflow-hidden flex flex-col font-sans select-none text-white">
      {/* 1. BARRE DE COMMANDE HOLOGRAPHIQUE SUPÉRIEURE */}
      <div className="z-30 bg-[#0E0D0C]/90 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Titre & Statut */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF5500]/15 border border-[#FF5500]/40 rounded-xl text-[#FF5500] shadow-md shadow-[#FF5500]/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-2">
                Montfleury Holo-Radar
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#FF5500] text-black px-2 py-0.5 rounded-full">
                  3D WebGL
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Hub Campus ESSECT • {sortedMerchants.length} relais actifs à portée
            </p>
          </div>
        </div>

        {/* Sélecteur de rayon d'exploration */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          <span className="text-[11px] font-bold text-gray-400 px-2 uppercase tracking-wider">Rayon :</span>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRadiusM(r);
                handleCloseDrawer();
              }}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                radiusM === r
                  ? 'bg-[#FF5500] text-black shadow-lg shadow-[#FF5500]/30 font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
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
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/15 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            {viewMode === '3D' ? 'Vue Liste 2D' : 'Holo-Radar 3D'}
          </button>

          {viewMode === '3D' && (
            <button
              type="button"
              onClick={() => {
                if (mapRef.current) resetToCampusHome(mapRef.current);
              }}
              title="Recentrer sur le campus ESSECT"
              className="p-1.5 bg-white/10 hover:bg-white/15 text-gray-200 hover:text-[#FF5500] rounded-xl border border-white/15 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. ZONE CENTRALE : VUE 3D OU LISTE 2D */}
      <div className="relative flex-1 w-full h-full">
        {viewMode === '3D' ? (
          <div ref={mapContainerRef} className="w-full h-full bg-[#0E0D0C]" />
        ) : (
          /* VUE 2D DE SECOURS */
          <div className="w-full h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-xl font-black text-white">Commerces autour de l'ESSECT</h2>
                <p className="text-xs text-gray-400">Triés par proximité piétonne immédiate</p>
              </div>
              <span className="text-xs font-mono text-[#FF5500] bg-[#FF5500]/10 border border-[#FF5500]/30 px-2.5 py-1 rounded-full">
                {sortedMerchants.length} établissements
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedMerchants.map((m, idx) => (
                <div
                  key={m.id || m.merchantId}
                  onClick={() => handleSelectMerchant(m)}
                  className="bg-[#161412] border border-white/10 hover:border-[#FF5500]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between group shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#F5C400] text-black font-extrabold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="font-black text-white text-base group-hover:text-[#FF5500] transition-colors">
                          {m.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30">
                        {m.activeOfferCount || 1} panier(s)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{m.description || m.type}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-1 text-[#F5C400] font-bold">
                      <Footprints className="w-3.5 h-3.5" />
                      {m.walkingMinutes || 4} min à pied
                    </span>
                    <span className="text-white font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Voir <ChevronRight className="w-3.5 h-3.5 text-[#FF5500]" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. HERO ÉDITORIAL OVERLAY TOP-LEFT (GRIDDLECAR image6.png) */}
        {viewMode === '3D' && (
          <div className="absolute top-6 left-6 z-20 pointer-events-none max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-mono uppercase tracking-widest text-amber-400 mb-2 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
              Direct Montfleury • Stop 01 / 0{sortedMerchants.length || 5}
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase leading-[0.95] drop-shadow-2xl">
              Autour de l’ESSECT,
              <br />
              <span className="text-[#FF5500]">heure par heure.</span>
            </h2>

            <p className="text-xs md:text-sm text-gray-300 mt-2 font-medium drop-shadow-md max-w-sm">
              Circuits d'invendus, créneaux de collecte et trajets piétons en temps réel dans le quartier de Montfleury.
            </p>
          </div>
        )}

        {/* 4. CARTE GLASSMORPHIC FLOTTANTE À DROITE (SCHEDULE & ALERTES - image6.png) */}
        {viewMode === '3D' && !selectedMerchant && (
          <div className="absolute top-6 right-6 z-20 w-80 lg:w-96 bg-[#0E0D0C]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF5500] font-black">
                  Programme du Jour
                </span>
                <h3 className="text-base font-black text-white">Créneaux de Sauvetage</h3>
              </div>
              <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                Aujourd'hui
              </span>
            </div>

            {/* Liste chronologique des créneaux */}
            <div className="space-y-2">
              {SCHEDULE_SLOTS.map((slot, index) => {
                const targetM = sortedMerchants.find((m) => (m.id || m.merchantId) === slot.merchantId);
                const isFirst = index === 0;

                return (
                  <div
                    key={slot.time}
                    onClick={() => {
                      if (targetM) handleSelectMerchant(targetM);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isFirst
                        ? 'bg-[#FF5500]/10 border-[#FF5500]/40 text-white'
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-1.5 h-7 rounded-full ${
                          isFirst ? 'bg-[#FF5500]' : 'bg-gray-600 group-hover:bg-[#F5C400]'
                        }`}
                      />
                      <div>
                        <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#FF5500]" />
                          <span>{slot.time}</span>
                        </div>
                        <div className="text-xs font-extrabold text-white group-hover:text-[#FF5500] transition-colors">
                          {targetM ? targetM.name : slot.label}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#F5C400] font-mono">
                        {targetM ? `${targetM.walkingMinutes || 3} min` : '5 min'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification de confirmation si l'alerte a été cliquée */}
            {alertSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in duration-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Alertes SMS & Push activées pour le prochain créneau !
              </div>
            )}

            {/* Boutons CTA d'action (comme dans image6.png: Add week to calendar / Text me when parked) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  alert("Planning synchronisé avec l'agenda Google / ICS de l'ESSECT !");
                }}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-white/10"
              >
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>+ Agenda</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerAlert}
                className="py-2.5 px-3 bg-[#FF5500] hover:bg-[#ff661a] text-black text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#FF5500]/30 hover:scale-[1.02]"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>M'alerter</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. TROIS FICHES NUMÉROTÉES EN BAS (1, 2, 3 AVEC "X MIN À PIED" - FIKA image3.png) */}
        {viewMode === '3D' && !selectedMerchant && (
          <div className="absolute bottom-6 left-6 right-6 lg:right-[420px] z-20 pointer-events-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {topThreeMerchants.map((merchant, idx) => {
                const num = idx + 1;
                const cutoutUrl = getFramerFoodImage(merchant.name || merchant.type || '');
                const photoUrl =
                  MERCHANT_PHOTOS[merchant.id] ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
                const offersCount = merchant.activeOfferCount || merchant.activeOffers?.length || 2;
                const minPrice = merchant.activeOffers?.[0]?.currentPriceMillimes || 3500;

                return (
                  <DepthCard
                    key={merchant.id || merchant.merchantId}
                    maxTilt={12}
                    scale={1.03}
                    glare={true}
                    maxGlare={0.25}
                    onClick={() => handleSelectMerchant(merchant)}
                    className="cursor-pointer bg-[#141210]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl transition-all hover:border-[#FF5500]/60 group"
                  >
                    {/* Badge Numéro Fika circulaire */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5C400] text-black font-black text-xs flex items-center justify-center border-2 border-black shadow-md">
                          {num}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-extrabold">
                          {merchant.type || 'RELAIS'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#FF5500] bg-[#FF5500]/15 px-2 py-0.5 rounded-full border border-[#FF5500]/30">
                        {offersCount} panier(s)
                      </span>
                    </div>

                    {/* Image / Miniature 3D flottante avec cutout transparent */}
                    <DepthCard.Floating depth={30} shadow={true} className="overflow-hidden rounded-xl h-24 mb-2.5 relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center p-2">
                      <img
                        src={cutoutUrl}
                        alt={merchant.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow(0 8px 16px rgba(0,0,0,0.5)) transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = photoUrl;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[11px] text-white font-bold pointer-events-none">
                        <span className="truncate">{merchant.name}</span>
                        <span className="text-[#FF5500] font-mono font-black">{formatTND(minPrice)}</span>
                      </div>
                    </DepthCard.Floating>

                    {/* Barre de métriques : X MIN À PIED */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                      <span className="flex items-center gap-1.5 text-[#F5C400] font-black tracking-wide text-[11px]">
                        <Footprints className="w-3.5 h-3.5 text-[#F5C400]" />
                        {merchant.walkingMinutes || 3} MIN À PIED
                      </span>
                      <span className="text-gray-400 text-[10px] font-mono">
                        {merchant.distanceM || merchant.distanceFromEssectM || 200} m
                      </span>
                    </div>
                  </DepthCard>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. TIROIR LATÉRAL : DÉTAILS D'UN COMMERCE CIBLÉ AVEC DRONE SWOOP */}
        {selectedMerchant && (
          <div className="absolute top-0 right-0 z-40 w-full sm:w-[420px] h-full bg-[#0E0D0C]/95 backdrop-blur-2xl border-l border-white/15 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            {/* Bouton de fermeture */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <span className="text-xs uppercase font-black tracking-widest text-[#FF5500] flex items-center gap-2">
                <Store className="w-4 h-4" /> Relais Partenaire Ciblé
              </span>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photographie d'en-tête */}
            <div className="relative rounded-2xl overflow-hidden h-36 mb-4 border border-white/10 shadow-lg">
              <img
                src={
                  MERCHANT_PHOTOS[selectedMerchant.id] ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
                }
                alt={selectedMerchant.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0D0C] via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">{selectedMerchant.name}</h2>
                  <p className="text-xs text-gray-300">{selectedMerchant.address?.street || 'Montfleury, Tunis'}</p>
                </div>
                <span className="text-xs font-mono font-bold bg-[#F5C400] text-black px-2 py-0.5 rounded-md">
                  ★ {selectedMerchant.ratingAvg?.toFixed(1) || '4.8'}
                </span>
              </div>
            </div>

            {/* Guide piétonnier Montfleury */}
            <div className="bg-black/60 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs mb-5">
              <div className="flex items-center gap-2 text-[#F5C400] font-black">
                <Footprints className="w-4 h-4" />
                <span>{selectedMerchant.walkingMinutes || 3} min à pied depuis l'ESSECT</span>
              </div>
              <span className="text-gray-400 font-mono text-[11px]">
                {selectedMerchant.distanceM || selectedMerchant.distanceFromEssectM || 200} m
              </span>
            </div>

            {/* Paniers d'invendus disponibles */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Paniers Disponibles ({selectedMerchant.activeOffers?.length || 0})
                </h3>
                <span className="text-[10px] font-mono text-[#FF5500]">Collecte directe</span>
              </div>

              {(!selectedMerchant.activeOffers || selectedMerchant.activeOffers.length === 0) ? (
                <div className="p-6 bg-white/5 rounded-2xl text-center text-xs text-gray-400 border border-white/10">
                  Tous les paniers de ce commerce ont été sauvés pour le moment.
                  <br />
                  <span className="text-amber-400 font-bold mt-1 inline-block">Prochain créneau à 16:00 !</span>
                </div>
              ) : (
                selectedMerchant.activeOffers.map((offer) => (
                  <div
                    key={offer.id || offer.offerId}
                    className="bg-[#181615] border border-white/10 hover:border-[#FF5500]/50 rounded-2xl p-4 transition-all shadow-md group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-black text-white leading-snug group-hover:text-[#FF5500] transition-colors">
                        {offer.title}
                      </h4>
                      {offer.isSurprise && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                          Panier Mystère
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xl font-black text-[#FF5500]">
                        {formatTND(offer.currentPriceMillimes || offer.currentPrice || 0)}
                      </span>
                      {offer.originalPriceMillimes && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatTND(offer.originalPriceMillimes)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/10 mb-3 font-mono">
                      <span className="flex items-center gap-1 text-[#F5C400]">
                        <Clock className="w-3 h-3" />
                        Fin dans {offer.minutesLeft || 35} min
                      </span>
                      <span>Stock : {offer.quantityAvailable || 1}</span>
                    </div>

                    <Link
                      to={`/app/offers/${offer.id || offer.offerId}`}
                      className="w-full py-2.5 bg-[#FF5500] hover:bg-[#ff661a] text-black text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#FF5500]/20 hover:scale-[1.01]"
                    >
                      Réserver ce panier <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
