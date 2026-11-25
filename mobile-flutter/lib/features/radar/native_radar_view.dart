// 💡 Concept & Analogie : Comme le radar de bord d'un sous-marin ou d'un navire qui balaie l'horizon et fait clignoter les cibles selon leur distance et leur niveau d'alerte, cet écran cartographie les commerces partenaires autour de l'ESSECT Montfleury et colore leurs balises selon l'urgence de sauvetage de leurs paniers.
// 🔄 Comparaison React / Flutter : En React, propulsé par MapLibre GL en WebGL avec prismes 3D et vue inclinée ; en Flutter, rendu cartographique 2D ultra-fluide via `flutter_map` avec tuiles sombres CartoDB Dark Matter et tracé piéton dynamique.
// 🎯 À retenir pour la soutenance : "L'écran Radar mobile offre aux étudiants une vision géospatiale immédiate des opportunités anti-gaspillage : le rayon est ajustable de 500m à 3000m et chaque commerce indique son temps de marche exact depuis le campus."
// Module : Cartographie & Géolocalisation Mobile

import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/domain/money.dart';
import '../../core/models/offer_model.dart';
import '../../services/campus_api.dart';
import '../explore/offer_detail_screen.dart';

import '../../app/theme.dart';
/// Carte 2D native (flutter_map) : version de secours du radar, toujours disponible hors ligne du serveur web.
class NativeRadarView extends StatefulWidget {
  /// Boutons ajoutés dans la barre du haut (ex. bascule « Vue 3D WebGL »).
  final List<Widget> extraActions;

  const NativeRadarView({super.key, this.extraActions = const []});

  @override
  State<NativeRadarView> createState() => _NativeRadarViewState();
}

class _NativeRadarViewState extends State<NativeRadarView> with TickerProviderStateMixin {
  static const LatLng essectCoords = LatLng(36.7871, 10.1748);
  static const List<int> availableRadiiM = [500, 1000, 1500, 2000, 3000];

  final MapController _mapController = MapController();
  int _selectedRadiusM = 1500;
  bool _isLoading = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _merchants = [];
  Map<String, dynamic>? _selectedMerchant;

  /// Balayage radar et anneaux pulsés autour de l'ESSECT (seule la couche dessinée se repeint, pas la carte).
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 2800));

  /// Vol animé de la caméra vers un commerce (centre + zoom interpolés, courbe douce).
  AnimationController? _fly;

  /// Itinéraires piétons pré-calculés par les rues (mêmes données que le site web), clé « lng,lat|lng,lat ».
  Map<String, List<LatLng>> _streetRoutes = const {};

  @override
  void initState() {
    super.initState();
    _fetchRadarData();
    _loadStreetRoutes();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (MediaQuery.of(context).disableAnimations) {
        _pulse.value = 0.3;
      } else {
        _pulse.repeat();
      }
    });
  }

  @override
  void dispose() {
    _pulse.dispose();
    _fly?.dispose();
    super.dispose();
  }

  Future<void> _loadStreetRoutes() async {
    try {
      final raw = jsonDecode(await rootBundle.loadString('assets/radar/street_routes.json')) as Map<String, dynamic>;
      final routes = (raw['routes'] as Map<String, dynamic>? ?? {});
      final parsed = <String, List<LatLng>>{};
      routes.forEach((key, value) {
        final coords = (value as Map<String, dynamic>)['c'] as List<dynamic>? ?? const [];
        parsed[key] = coords.map((c) {
          final pair = c as List<dynamic>;
          return LatLng((pair[1] as num).toDouble(), (pair[0] as num).toDouble());
        }).toList();
      });
      if (mounted) setState(() => _streetRoutes = parsed);
    } catch (_) {
      // sans fichier d'itinéraires : trait direct ESSECT -> commerce
    }
  }

  /// Chemin par les rues depuis l'ESSECT ; à défaut, la ligne droite.
  List<LatLng> _routeTo(LatLng dest) {
    String k(LatLng p) => '${p.longitude.toStringAsFixed(5)},${p.latitude.toStringAsFixed(5)}';
    final route = _streetRoutes['${k(essectCoords)}|${k(dest)}'];
    return (route != null && route.length > 1) ? route : [essectCoords, dest];
  }

  /// Déplacement de caméra animé (comme `flyTo` sur le web) : 700 ms, courbe ease-in-out, zoom qui « respire ».
  void _flyTo(LatLng dest, double zoom) {
    final camera = _mapController.camera;
    final from = camera.center;
    final fromZoom = camera.zoom;
    _fly?.dispose();
    final reduce = MediaQuery.of(context).disableAnimations;
    if (reduce) {
      _mapController.move(dest, zoom);
      return;
    }
    final ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    final curve = CurvedAnimation(parent: ctrl, curve: Curves.easeInOutCubic);
    ctrl.addListener(() {
      final t = curve.value;
      final lat = from.latitude + (dest.latitude - from.latitude) * t;
      final lng = from.longitude + (dest.longitude - from.longitude) * t;
      final dip = sin(t * pi) * 0.6; // léger dézoom au milieu du trajet
      _mapController.move(LatLng(lat, lng), fromZoom + (zoom - fromZoom) * t - dip);
    });
    _fly = ctrl;
    ctrl.forward();
  }

  int? _minPriceMillimes(Map<String, dynamic> merchant) {
    final prices = (merchant['activeOffers'] as List<dynamic>? ?? [])
        .map((o) => (o as Map)['currentPriceMillimes'] ?? o['currentPrice'])
        .whereType<num>()
        .map((n) => n.toInt())
        .where((n) => n > 0)
        .toList();
    if (prices.isEmpty) return null;
    return prices.reduce(min);
  }

  Future<void> _fetchRadarData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiClient.dio.get(
        '${Endpoints.radar}?radiusM=$_selectedRadiusM',
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final rawMerchants = data['merchants'] as List<dynamic>? ?? [];

        setState(() {
          _merchants = rawMerchants.map((m) => Map<String, dynamic>.from(m as Map)).toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Données du radar indisponibles.';
          _isLoading = false;
        });
      }
    } catch (err) {
      // 💡 En cas de déconnexion réseau ou d'indisponibilité API, repli sur données de secours locales
      setState(() {
        // Jamais de commerces inventés : sans réseau, la carte reste vide et le dit.
        _errorMessage = 'Radar indisponible : vérifiez la connexion puis réessayez.';
        _merchants = const [];
        _isLoading = false;
      });
    }
  }

  Color _parseHexColor(String? hexString, Color defaultColor) {
    if (hexString == null || hexString.isEmpty) return defaultColor;
    // L'API émet du néon (#CCFF00 / #FF5500 / #FF1744) : on le traduit en moutarde / orange / rouge Griddle
    final known = hexString.toUpperCase();
    if (known == '#CCFF00' || known == '#FF5500' || known == '#FF1744') return AppTheme.urgencyFromApi(known);
    try {
      final clean = hexString.replaceAll('#', '');
      if (clean.length == 6) {
        return Color(int.parse('FF$clean', radix: 16));
      }
    } catch (_) {}
    return defaultColor;
  }

  void _onMerchantTapped(Map<String, dynamic> merchant) {
    final loc = merchant['location'] as Map<String, dynamic>?;
    final lat = (loc?['lat'] as num?)?.toDouble() ?? (merchant['lat'] as num?)?.toDouble() ?? 36.7871;
    final lng = (loc?['lng'] as num?)?.toDouble() ?? (merchant['lng'] as num?)?.toDouble() ?? 10.1748;

    setState(() {
      _selectedMerchant = merchant;
    });

    _flyTo(LatLng(lat, lng), 16.6);
    Future.delayed(const Duration(milliseconds: 420), () {
      if (mounted) _showMerchantBottomSheet(merchant);
    });
  }

  Future<void> _openGoogleMapsDirections(double lat, double lng) async {
    final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=walking');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d\'ouvrir Google Maps sur cet appareil.')),
      );
    }
  }

  Future<void> _openOfferFromRadar(Map<String, dynamic> rawOffer, Map<String, dynamic> merchant, int distanceM) async {
    final offerId = rawOffer['id']?.toString() ?? '';
    OfferModel? resolved;
    if (offerId.isNotEmpty) {
      try {
        final all = await CampusApi.shared.fetchOffers();
        for (final o in all) {
          if (o.id == offerId) {
            resolved = o;
            break;
          }
        }
      } catch (_) {}
    }
    resolved ??= OfferModel.fromJson({
      ...rawOffer,
      'merchantId': rawOffer['merchantId'] ?? merchant['id'] ?? '',
      'merchantName': rawOffer['merchantName'] ?? merchant['tradeName'] ?? merchant['name'],
      'currentPriceMillimes': rawOffer['currentPriceMillimes'] ?? rawOffer['currentPrice'],
      'distanceFromEssectM': distanceM,
    });
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OfferDetailScreen(
          offer: resolved!,
          distanceFromEssectM: resolved.distanceFromEssectM ?? distanceM,
        ),
      ),
    );
  }

  void _showMerchantBottomSheet(Map<String, dynamic> merchant) {
    final urgencyColor = _parseHexColor(merchant['beaconUrgencyColor'] as String?, AppTheme.red);
    final offers = (merchant['activeOffers'] as List<dynamic>? ?? []);
    final int distanceM = (merchant['distanceFromEssectM'] as num?)?.toInt() ?? 0;
    final int walkingMins = (merchant['walkingMinutes'] as num?)?.toInt() ?? max<int>(1, (distanceM / 80).round());
    final loc = merchant['location'] as Map<String, dynamic>?;
    final double mLat = (loc?['lat'] as num?)?.toDouble() ?? (merchant['lat'] as num?)?.toDouble() ?? 36.7871;
    final double mLng = (loc?['lng'] as num?)?.toDouble() ?? (merchant['lng'] as num?)?.toDouble() ?? 10.1748;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.biscuit,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          decoration: BoxDecoration(
            color: AppTheme.biscuit,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(
              top: BorderSide(color: urgencyColor.withOpacity(0.4), width: 2),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Poignée de glissement
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.sand,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // En-tête commerce
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: urgencyColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: urgencyColor, width: 1.5),
                    ),
                    child: Icon(
                      Icons.storefront,
                      color: urgencyColor,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          merchant['tradeName'] as String? ?? 'Commerce',
                          style: const TextStyle(
                            color: AppTheme.ink,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          merchant['address'] as String? ?? 'Montfleury, Tunis',
                          style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Badges distance & temps piéton
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.biscuit,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.sand),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.directions_walk, size: 16, color: AppTheme.red),
                        const SizedBox(width: 6),
                        Text(
                          '~$walkingMins min à pied ($distanceM m)',
                          style: const TextStyle(color: AppTheme.ink, fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: urgencyColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: urgencyColor.withOpacity(0.5)),
                    ),
                    child: Text(
                      merchant['urgency'] == 'CRITICAL_FLASH'
                          ? '⚡ DÉSTOCKAGE ÉCLAIR'
                          : merchant['urgency'] == 'CLOSING_SOON'
                              ? '⏳ FERMETURE PROCHE'
                              : '🌿 SAUVETAGE EN COURS',
                      style: TextStyle(
                        color: urgencyColor,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _openGoogleMapsDirections(mLat, mLng),
                  icon: const Icon(Icons.directions_outlined, size: 18, color: AppTheme.ink),
                  label: const Text('Itinéraire Google Maps', style: TextStyle(color: AppTheme.ink, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: AppTheme.cream,
                    side: const BorderSide(color: AppTheme.ink, width: 1.5),
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Liste des paniers actifs
              Text(
                'Paniers à sauver (${offers.length})',
                style: const TextStyle(color: AppTheme.muted, fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),

              if (offers.isEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Aucun panier disponible pour le moment.',
                    style: TextStyle(color: AppTheme.muted, fontSize: 13),
                  ),
                )
              else
                ...offers.map((offer) {
                  final rawOffer = Map<String, dynamic>.from(offer as Map);
                  final priceMillimes = (rawOffer['currentPriceMillimes'] as num?)?.toInt() ??
                      (rawOffer['currentPrice'] as num?)?.toInt() ??
                      3000;
                  final isSurprise = rawOffer['isSurprise'] == true || rawOffer['isSurpriseBasket'] == true;
                  final rarity = rawOffer['rarity'] as String? ?? 'COMMON';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.cream,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSurprise ? AppTheme.red.withOpacity(0.5) : AppTheme.sand,
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (isSurprise) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      margin: const EdgeInsets.only(right: 6),
                                      decoration: BoxDecoration(
                                        color: AppTheme.red.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '🎁 $rarity',
                                        style: const TextStyle(
                                          color: AppTheme.red,
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                  Expanded(
                                    child: Text(
                                      rawOffer['title'] as String? ?? 'Panier Sauvetage',
                                      style: const TextStyle(
                                        color: AppTheme.ink,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                Money.formatTND(priceMillimes),
                                style: const TextStyle(
                                  color: AppTheme.red,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(ctx).pop();
                            _openOfferFromRadar(rawOffer, merchant, distanceM);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.red,
                            foregroundColor: AppTheme.cream,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                          child: const Text('Sauver', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Calcul des marqueurs
    final markers = <Marker>[
      // Marqueur central ESSECT Montfleury
      Marker(
        point: essectCoords,
        width: 60,
        height: 60,
        child: GestureDetector(
          onTap: () {
            _mapController.move(essectCoords, 16.0);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Point de départ : Campus ESSECT Montfleury 🎓'),
                duration: Duration(seconds: 2),
                backgroundColor: AppTheme.biscuit,
              ),
            );
          },
          child: Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.red,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.red.withOpacity(0.5),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(Icons.school, color: AppTheme.cream, size: 24),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(
                  color: AppTheme.ink,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'ESSECT',
                  style: TextStyle(color: AppTheme.cream, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),

      // Marqueurs Commerçants : épingle Griddle (numéro + prix « dès »), mise en avant si choisie
      ..._merchants.asMap().entries.map((entry) {
        final m = entry.value;
        final loc = m['location'] as Map<String, dynamic>?;
        final lat = (loc?['lat'] as num?)?.toDouble() ?? (m['lat'] as num?)?.toDouble() ?? 36.7871;
        final lng = (loc?['lng'] as num?)?.toDouble() ?? (m['lng'] as num?)?.toDouble() ?? 10.1748;
        final urgencyColor = _parseHexColor(m['beaconUrgencyColor'] as String?, AppTheme.red);
        final isSelected = _selectedMerchant?['id'] == m['id'];
        final price = _minPriceMillimes(m);

        return Marker(
          point: LatLng(lat, lng),
          width: 132,
          height: 66,
          alignment: Alignment.topCenter, // la pointe de l'épingle touche le point exact
          child: _PricePin(
            number: entry.key + 1,
            priceLabel: price != null ? Money.formatTND(price) : null,
            urgency: urgencyColor,
            selected: isSelected,
            onTap: () => _onMerchantTapped(m),
          ),
        );
      }),
    ];

    // Ligne de tracé piéton vers le commerce sélectionné
    final polylines = <Polyline>[];
    if (_selectedMerchant != null) {
      final loc = _selectedMerchant!['location'] as Map<String, dynamic>?;
      final mLat = (loc?['lat'] as num?)?.toDouble() ?? (_selectedMerchant!['lat'] as num?)?.toDouble() ?? 36.7871;
      final mLng = (loc?['lng'] as num?)?.toDouble() ?? (_selectedMerchant!['lng'] as num?)?.toDouble() ?? 10.1748;
      final urgencyColor = _parseHexColor(
        _selectedMerchant!['beaconUrgencyColor'] as String?,
        AppTheme.red,
      );

      final route = _routeTo(LatLng(mLat, mLng));
      polylines
        ..add(Polyline(points: route, color: AppTheme.mustard.withValues(alpha: 0.55), strokeWidth: 12)) // lueur
        ..add(Polyline(points: route, color: urgencyColor, strokeWidth: 5, borderColor: AppTheme.ink, borderStrokeWidth: 1.5));
    }

    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        backgroundColor: AppTheme.biscuit,
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: AppTheme.red,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text('RADAR MONTFLEURY', style: AppTheme.display(28)),
          ],
        ),
        actions: [
          ...widget.extraActions,
          IconButton(
            icon: const Icon(Icons.my_location, color: AppTheme.red),
            tooltip: 'Recentrer sur l\'ESSECT',
            onPressed: () {
              setState(() {
                _selectedMerchant = null;
              });
              _flyTo(essectCoords, 15.5);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.muted),
            tooltip: 'Actualiser le radar',
            onPressed: _fetchRadarData,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Fond quadrillé Griddle de secours si les tuiles OSM tardent à charger
          Positioned.fill(
            child: CustomPaint(
              painter: _RadarGridBackdropPainter(),
            ),
          ),

          // Carte interactive OpenStreetMap (crème)
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(
              initialCenter: essectCoords,
              initialZoom: 15.5,
              minZoom: 13.0,
              maxZoom: 18.0,
            ),
            children: [
              // Fond clair OpenStreetMap, teinté crème Griddle (fini la carte sombre au néon)
              ColorFiltered(
                colorFilter: const ColorFilter.mode(Color(0xFFFFF1D6), BlendMode.multiply),
                child: TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'tn.essect.campussave',
                ),
              ),

              // Portée du radar : disque, anneaux tous les 500 m, secteur qui balaie et ondes pulsées autour de l'ESSECT
              _RadarSweepLayer(animation: _pulse, center: essectCoords, radiusM: _selectedRadiusM.toDouble()),

              // Ligne piétonne
              if (polylines.isNotEmpty) PolylineLayer(polylines: polylines),

              // Marqueurs ESSECT & Commerces
              MarkerLayer(markers: markers),
            ],
          ),

          // Barre supérieure : Filtres de rayon (chips)
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: availableRadiiM.map((radius) {
                  final isSelected = _selectedRadiusM == radius;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      selected: isSelected,
                      label: Text('${radius >= 1000 ? (radius / 1000).toStringAsFixed(1) : radius} ${radius >= 1000 ? 'km' : 'm'}'),
                      labelStyle: TextStyle(
                        color: isSelected ? AppTheme.cream : AppTheme.ink,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 13,
                      ),
                      backgroundColor: AppTheme.biscuit.withOpacity(0.9),
                      selectedColor: AppTheme.red,
                      checkmarkColor: AppTheme.cream,
                      side: BorderSide(
                        color: isSelected ? AppTheme.red : AppTheme.sand,
                      ),
                      onSelected: (selected) {
                        if (selected && _selectedRadiusM != radius) {
                          setState(() {
                            _selectedRadiusM = radius;
                          });
                          _fetchRadarData();
                        }
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Indicateur de chargement
          if (_isLoading)
            Positioned(
              top: 70,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.red.withOpacity(0.5)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.red),
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Balayage du radar en cours...',
                        style: TextStyle(color: AppTheme.ink, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Alerte d'erreur ou repli
          if (_errorMessage != null && !_isLoading)
            Positioned(
              top: 70,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.biscuit,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.orange),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppTheme.orange, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Liste rapide des commerces les plus proches + Légende en bas
          Positioned(
            bottom: 12,
            left: 12,
            right: 12,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_merchants.isNotEmpty)
                  SizedBox(
                    height: 76,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _merchants.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final m = _merchants[index];
                        final name = (m['tradeName'] ?? m['name'] ?? 'Commerce').toString();
                        final dist = (m['distanceFromEssectM'] as num?)?.toInt() ?? 0;
                        final count = (m['activeOffers'] as List<dynamic>? ?? []).length;
                        final selected = _selectedMerchant?['id'] == m['id'];
                        return GestureDetector(
                          onTap: () => _onMerchantTapped(m),
                          child: Container(
                            width: 215,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: selected ? AppTheme.mustard : AppTheme.cream.withOpacity(0.96),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.ink, width: selected ? 2.5 : 1.5),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppTheme.ink, fontSize: 14, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '$dist m · $count offre${count > 1 ? 's' : ''}',
                                  style: const TextStyle(color: AppTheme.muted, fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.ink.withOpacity(0.15)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildLegendItem(AppTheme.mustard, 'Standard'),
                      _buildLegendItem(AppTheme.orange, 'Ferme bientôt'),
                      _buildLegendItem(AppTheme.red, 'Urgence éclair'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.ink, width: 1),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(color: AppTheme.ink, fontSize: 13, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

class _RadarGridBackdropPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = AppTheme.cream);
    final linePaint = Paint()
      ..color = AppTheme.ink.withValues(alpha: 0.06)
      ..strokeWidth = 1;
    const step = 36.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), linePaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), linePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}


/// Épingle Griddle : pastille numérotée + étiquette prix, tige encre ; grossit et se cercle de moutarde quand elle est choisie.
class _PricePin extends StatelessWidget {
  const _PricePin({required this.number, required this.priceLabel, required this.urgency, required this.selected, required this.onTap});

  final int number;
  final String? priceLabel;
  final Color urgency;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Commerce $number${priceLabel != null ? ', dès $priceLabel' : ''}',
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedScale(
          scale: selected ? 1.12 : 1,
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutBack,
          alignment: Alignment.bottomCenter,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.ink : AppTheme.red,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.ink, width: 2),
                      boxShadow: [BoxShadow(color: urgency.withValues(alpha: 0.65), blurRadius: selected ? 14 : 8, spreadRadius: selected ? 3 : 1)],
                    ),
                    child: Text('$number', style: TextStyle(color: selected ? AppTheme.mustard : AppTheme.cream, fontSize: 15, fontWeight: FontWeight.w800)),
                  ),
                  if (priceLabel != null)
                    Transform.translate(
                      offset: const Offset(-6, 0),
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(10, 4, 8, 4),
                        decoration: BoxDecoration(
                          color: selected ? AppTheme.mustard : AppTheme.cream,
                          borderRadius: BorderRadius.circular(99),
                          border: Border.all(color: AppTheme.ink, width: 2),
                          boxShadow: const [BoxShadow(color: Color(0x33111111), blurRadius: 6, offset: Offset(0, 3))],
                        ),
                        child: Text(priceLabel!, style: const TextStyle(color: AppTheme.ink, fontSize: 13, fontWeight: FontWeight.w800, fontFamily: 'monospace')),
                      ),
                    ),
                ],
              ),
              Container(width: 3, height: 12, decoration: BoxDecoration(color: AppTheme.ink, borderRadius: BorderRadius.circular(2))),
              Container(width: 10, height: 4, decoration: BoxDecoration(color: AppTheme.ink.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4))),
            ],
          ),
        ),
      ),
    );
  }
}

/// Couche flutter_map : le radar autour de l'ESSECT, dessiné en pixels écran à partir de la caméra courante.
class _RadarSweepLayer extends StatelessWidget {
  const _RadarSweepLayer({required this.animation, required this.center, required this.radiusM});

  final Animation<double> animation;
  final LatLng center;
  final double radiusM;

  @override
  Widget build(BuildContext context) {
    final camera = MapCamera.of(context);
    final c = camera.getOffsetFromOrigin(center);
    final edge = camera.getOffsetFromOrigin(LatLng(center.latitude + radiusM / 111320.0, center.longitude));
    final rPx = (edge - c).distance;
    final pxPerM = radiusM > 0 ? rPx / radiusM : 0.0;
    return IgnorePointer(
      child: RepaintBoundary(
        child: CustomPaint(
          size: Size.infinite,
          painter: _SweepPainter(animation: animation, center: c, radiusPx: rPx, pxPerM: pxPerM),
        ),
      ),
    );
  }
}

class _SweepPainter extends CustomPainter {
  _SweepPainter({required this.animation, required this.center, required this.radiusPx, required this.pxPerM}) : super(repaint: animation);

  final Animation<double> animation;
  final Offset center;
  final double radiusPx;
  final double pxPerM;

  @override
  void paint(Canvas canvas, Size size) {
    if (radiusPx <= 0) return;
    final t = animation.value;
    final disc = Paint()..color = AppTheme.red.withValues(alpha: 0.05);
    canvas.drawCircle(center, radiusPx, disc);

    // anneaux de distance tous les 500 m
    final ring = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = AppTheme.red.withValues(alpha: 0.22);
    for (double m = 500; m * pxPerM < radiusPx - 2; m += 500) {
      canvas.drawCircle(center, m * pxPerM, ring);
    }
    canvas.drawCircle(
      center,
      radiusPx,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.2
        ..color = AppTheme.red.withValues(alpha: 0.55),
    );

    // secteur qui balaie (dégradé conique : bord net, traîne qui s'efface)
    final angle = t * 2 * pi;
    final rect = Rect.fromCircle(center: center, radius: radiusPx);
    final sweep = Paint()
      ..shader = SweepGradient(
        startAngle: 0,
        endAngle: 2 * pi,
        colors: [AppTheme.red.withValues(alpha: 0), AppTheme.red.withValues(alpha: 0), AppTheme.red.withValues(alpha: 0.26)],
        stops: const [0, 0.78, 1],
        transform: GradientRotation(angle - 2 * pi),
      ).createShader(rect);
    canvas.drawCircle(center, radiusPx, sweep);
    final tip = Offset(center.dx + cos(angle) * radiusPx, center.dy + sin(angle) * radiusPx);
    canvas.drawLine(
      center,
      tip,
      Paint()
        ..strokeWidth = 2
        ..color = AppTheme.red.withValues(alpha: 0.7),
    );

    // trois ondes qui partent du campus
    for (var i = 0; i < 3; i++) {
      final p = (t * 1.5 + i / 3) % 1.0;
      final r = 14 + p * min(radiusPx, 140.0);
      canvas.drawCircle(
        center,
        r,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5 * (1 - p) + 0.5
          ..color = AppTheme.red.withValues(alpha: 0.55 * (1 - p)),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _SweepPainter old) => old.center != center || old.radiusPx != radiusPx || old.pxPerM != pxPerM;
}
