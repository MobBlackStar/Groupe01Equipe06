// 💡 Concept & Analogie : Comme l'écran radar holographique d'un vaisseau d'exploration qui cartographie l'environnement immédiat en 3D volumétrique, cette page permet aux étudiants de repérer visuellement les commerces et l'urgence de leurs paniers autour de l'ESSECT Montfleury.
// 🔄 Comparaison React / Flutter : En React, propulsé par MapLibre GL en WebGL avec vue inclinée (pitch 60°) et bâtiments 3D ; en Flutter, rendu via `flutter_map` avec marqueurs radar interactifs.
// 🎯 À retenir pour la soutenance : "Le Montfleury Holo-Radar illustre la puissance de WebGL pour le e-commerce de proximité : les prismes 3D grandissent selon le stock disponible et clignotent en rouge lorsque l'heure de fermeture approche."
// Module : Holo-Radar 3D WebGL

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { MAP_CONFIG, add3DBuildingsLayer } from './mapStyle.js';
import { setupBeaconLayers } from './beaconLayer.js';
import { updateWalkingPath } from './walkingPath.js';
import { droneSwoopToMerchant, resetToCampusHome } from './cameraFx.js';
import {
  Compass,
  Layers,
  MapPin,
  Footprints,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Flame,
  AlertTriangle,
  RotateCcw,
  Store,
} from 'lucide-react';

export default function HoloRadarPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [radiusM, setRadiusM] = useState(1500);
  const [radarData, setRadarData] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('3D'); // '3D' | '2D'

  // Rayons disponibles
  const RADIUS_OPTIONS = [500, 1000, 1500, 2500, 3000];

  // Chargement des données géospatiales depuis l'API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchRadar() {
      try {
        const response = await apiClient.get(`${ENDPOINTS.RADAR}?radiusM=${radiusM}`);
        if (isMounted) {
          setRadarData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur chargement radar :', err);
          setError('Impossible de charger les données du radar. Mode secours actif.');
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

  // Gestion de la sélection d'un commerçant
  const handleSelectMerchant = useCallback((merchant) => {
    setSelectedMerchant(merchant);

    if (mapRef.current && merchant?.location) {
      const coords = [merchant.location.lng, merchant.location.lat];
      // Effet cinématique Drone Swoop
      droneSwoopToMerchant(mapRef.current, coords);
      // Tracé piétonnier néon
      updateWalkingPath(mapRef.current, coords);
    }
  }, []);

  // Désélection et retour à l'ESSECT
  const handleCloseDrawer = useCallback(() => {
    setSelectedMerchant(null);
    if (mapRef.current) {
      resetToCampusHome(mapRef.current);
      updateWalkingPath(mapRef.current, null);
    }
  }, []);

  // Initialisation de la carte MapLibre 3D WebGL
  useEffect(() => {
    if (viewMode !== '3D' || !mapContainerRef.current) return;

    const merchants = radarData?.merchants || [];

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
          // Bâtiments 3D extrudés
          add3DBuildingsLayer(map);

          // Si des commerces sont déjà chargés, injecter les balises 3D
          if (merchants.length > 0) {
            setupBeaconLayers(map, merchants, handleSelectMerchant);
          }
        });

        map.on('error', (e) => {
          console.warn('MapLibre WebGL incident :', e);
        });

        mapRef.current = map;
      } catch (e) {
        console.warn('Initialisation WebGL échouée, bascule en vue 2D :', e);
        setViewMode('2D');
      }
    } else {
      // Carte déjà existante : mise à jour des balises selon le rayon
      if (mapRef.current.isStyleLoaded() && merchants.length > 0) {
        setupBeaconLayers(mapRef.current, merchants, handleSelectMerchant);
      }
    }

    return () => {
      // Ne détruit pas la carte immédiatement pour éviter les scintillements
    };
  }, [viewMode, radarData?.merchants, handleSelectMerchant]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#0D0F12] overflow-hidden flex flex-col">
      {/* BARRE DE CONTRÔLE HOLOGRAPHIQUE SUPÉRIEURE */}
      <div className="z-20 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Titre et icône Holo-Radar */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-xl text-[#CCFF00]">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2">
              Montfleury Holo-Radar 3D
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#CCFF00] text-gray-950 px-2 py-0.5 rounded-full">
                WebGL
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Campus ESSECT • {radarData?.totalMerchants || 0} commerce(s) à portée
            </p>
          </div>
        </div>

        {/* Sélecteur de rayon d'exploration */}
        <div className="flex items-center gap-1.5 bg-gray-950/80 p-1 rounded-xl border border-gray-800">
          <span className="text-[11px] font-semibold text-gray-400 px-2">Rayon :</span>
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
                  ? 'bg-[#CCFF00] text-gray-950 shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>

        {/* Boutons d'action : Bascule 3D/2D et Recentrage */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-700 transition-colors"
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
              title="Recentrer sur l'ESSECT"
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ZONE CENTRALE : CARTE 3D OU LISTE 2D DE SECOURS */}
      <div className="relative flex-1 w-full h-full">
        {/* VUE 3D WEBGL MAPLIBRE */}
        {viewMode === '3D' ? (
          <div ref={mapContainerRef} className="w-full h-full bg-[#0D0F12]" />
        ) : (
          /* VUE 2D DE SECOURS (LISTE GÉOLOCALISÉE TRIÉE PAR DISTANCE) */
          <div className="w-full h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-xl font-bold text-white">Commerces à proximité de l'ESSECT</h2>
              <span className="text-xs text-gray-400">Triés par distance croissante</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                Calcul des balises géospatiales...
              </div>
            ) : radarData?.merchants?.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Aucun commerce partenaire trouvé dans un rayon de {radiusM} mètres.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {radarData?.merchants?.map((m) => (
                  <div
                    key={m.id || m.merchantId}
                    onClick={() => handleSelectMerchant(m)}
                    className="bg-gray-900 border border-gray-800 hover:border-[#CCFF00]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white text-base">{m.name}</h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${m.beaconUrgencyColor}20`,
                            color: m.beaconUrgencyColor,
                            border: `1px solid ${m.beaconUrgencyColor}60`,
                          }}
                        >
                          {m.activeOfferCount} panier(s)
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3 line-clamp-1">{m.description || m.type}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-800/80">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Footprints className="w-3.5 h-3.5" />
                        {m.walkingMinutes} min à pied ({m.distanceM} m)
                      </span>
                      <span className="text-[#CCFF00] font-bold flex items-center gap-1">
                        Détails <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LÉGENDE RADAR EN BAS À GAUCHE */}
        {viewMode === '3D' && (
          <div className="absolute bottom-6 left-6 z-10 bg-gray-950/80 backdrop-blur-md border border-gray-800 p-3 rounded-2xl text-[11px] text-gray-300 space-y-1.5 shadow-xl hidden sm:block">
            <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
              Balises 3D Volumétriques
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]" />
              <span>Vert : Clôture &gt; 60 min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
              <span>Orange : Clôture 20 à 60 min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] animate-pulse" />
              <span>Rouge : Clôture &lt; 20 min</span>
            </div>
            <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-800">
              Hauteur ∝ Nombre d'offres en stock
            </div>
          </div>
        )}

        {/* TIROIR LATÉRAL : DÉTAILS DU COMMERCE SÉLECTIONNÉ */}
        {selectedMerchant && (
          <div className="absolute top-0 right-0 z-30 w-full sm:w-96 h-full bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            {/* Bouton de fermeture */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-[#CCFF00] flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> Commerce Ciblé
              </span>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informations de l'établissement */}
            <div className="space-y-3 mb-6">
              <h2 className="text-xl font-black text-white">{selectedMerchant.name}</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md font-medium">
                  {selectedMerchant.type}
                </span>
                <span className="text-amber-400 font-bold">★ {selectedMerchant.ratingAvg?.toFixed(1) || '4.0'}</span>
              </div>

              {/* Estimation piétonne */}
              <div className="bg-gray-950/70 border border-gray-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Footprints className="w-4 h-4" />
                  <span>{selectedMerchant.walkingMinutes} min à pied</span>
                </div>
                <span className="text-gray-400 font-mono">
                  {selectedMerchant.distanceM || selectedMerchant.distanceFromEssectM} m d'ESSECT
                </span>
              </div>
            </div>

            {/* Liste des offres actives */}
            <div className="flex-1 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Paniers Disponibles ({selectedMerchant.activeOffers?.length || 0})
              </h3>

              {(!selectedMerchant.activeOffers || selectedMerchant.activeOffers.length === 0) ? (
                <div className="p-4 bg-gray-950/50 rounded-xl text-center text-xs text-gray-500">
                  Tous les paniers de ce commerce ont été réservés pour le moment.
                </div>
              ) : (
                selectedMerchant.activeOffers.map((offer) => (
                  <div
                    key={offer.id || offer.offerId}
                    className="bg-gray-950 border border-gray-800 hover:border-[#CCFF00]/40 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-white leading-snug">{offer.title}</h4>
                      {offer.isSurprise && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                          Mystery Box
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-black text-[#CCFF00]">
                        {formatTND(offer.currentPriceMillimes || offer.currentPrice || 0)}
                      </span>
                      {offer.originalPriceMillimes && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatTND(offer.originalPriceMillimes)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80 mb-3">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3 h-3" />
                        Fin dans {offer.minutesLeft} min
                      </span>
                      <span>Stock : {offer.quantityAvailable}</span>
                    </div>

                    <Link
                      to={`/app/offers/${offer.id || offer.offerId}`}
                      className="w-full py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
                    >
                      Réserver ce panier <ChevronRight className="w-3.5 h-3.5" />
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
