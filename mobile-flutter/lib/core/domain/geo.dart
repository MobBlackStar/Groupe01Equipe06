// 💡 Concept & Analogie : Le compas du commerçant : il lit des coordonnées collées depuis Google Maps et mesure la distance à vol d'oiseau jusqu'à l'ESSECT.
// 🔄 Comparaison React / Flutter : Miroir de `shared/geo.js` et `shared/spot.js` (mêmes constantes : ESSECT 36.7871, 10.1748 ; rayon maximal 3 000 m).
// 🎯 À retenir pour la soutenance : "Une seule implémentation de la règle des 3 km côté mobile, utilisée par l'inscription et la modification de la boutique ; le serveur la revérifie."

import 'dart:math';

const double kEssectLat = 36.7871;
const double kEssectLng = 10.1748;
const int kMaxMerchantDistanceM = 3000;

/// Accepte « 36.7875, 10.1758 », « 36.7875 10.1758 » ou un lien Google Maps (@lat,lng, !3dlat!4dlng, ?q=lat,lng).
({double lat, double lng})? parseCoords(String raw) {
  final text = Uri.decodeFull(raw).trim();
  if (text.isEmpty) return null;

  // 1. Lien Google Maps « place » : !3dLAT!4dLNG prime sur @LAT,LNG
  final bang = RegExp(r'!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)').firstMatch(text);
  if (bang != null) {
    final lat = double.tryParse(bang.group(1)!);
    final lng = double.tryParse(bang.group(2)!);
    if (lat != null && lng != null && lat.abs() <= 90 && lng.abs() <= 180) {
      return (lat: lat, lng: lng);
    }
  }

  // 2. Lien Google Maps @LAT,LNG ou ?q=LAT,LNG
  final gmaps = RegExp(r'(?:@|[?&](?:q|ll|query)=)(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)').firstMatch(text);
  if (gmaps != null) {
    final lat = double.tryParse(gmaps.group(1)!);
    final lng = double.tryParse(gmaps.group(2)!);
    if (lat != null && lng != null && lat.abs() <= 90 && lng.abs() <= 180) {
      return (lat: lat, lng: lng);
    }
  }

  // 3. Coordonnées brutes « lat, lng » ou « lat lng »
  final m = RegExp(r'(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)').firstMatch(text);
  if (m == null) return null;
  final lat = double.tryParse(m.group(1)!);
  final lng = double.tryParse(m.group(2)!);
  if (lat == null || lng == null || lat.abs() > 90 || lng.abs() > 180) return null;
  return (lat: lat, lng: lng);
}

/// Distance (haversine) en mètres entre un point et l'ESSECT.
int distanceFromEssectM(double lat, double lng) {
  const earthRadius = 6371000;
  final dLat = (lat - kEssectLat) * pi / 180;
  final dLng = (lng - kEssectLng) * pi / 180;
  final a = sin(dLat / 2) * sin(dLat / 2) + cos(kEssectLat * pi / 180) * cos(lat * pi / 180) * sin(dLng / 2) * sin(dLng / 2);
  return (earthRadius * 2 * atan2(sqrt(a), sqrt(1 - a))).round();
}

/// Minutes à pied (détour urbain ×1,3, 5 km/h), comme `calculateWalkingMinutes` du backend.
int walkingMinutesFor(int meters) => meters <= 0 ? 0 : max(1, (meters * 1.3 / (5000 / 60)).round());
