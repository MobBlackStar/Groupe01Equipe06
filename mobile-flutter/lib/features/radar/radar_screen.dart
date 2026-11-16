// 💡 Concept & Analogie : Comme le radar de bord d'un sous-marin ou d'un navire qui balaie l'horizon et fait clignoter les cibles selon leur distance et leur niveau d'alerte, cet écran cartographie les commerces partenaires autour de l'ESSECT Montfleury et colore leurs balises selon l'urgence de sauvetage de leurs paniers.
// 🔄 Comparaison React / Flutter : En React, propulsé par MapLibre GL en WebGL avec prismes 3D et vue inclinée ; en Flutter, rendu cartographique 2D ultra-fluide via `flutter_map` avec tuiles sombres CartoDB Dark Matter et tracé piéton dynamique.
// 🎯 À retenir pour la soutenance : "L'écran Radar mobile offre aux étudiants une vision géospatiale immédiate des opportunités anti-gaspillage : le rayon est ajustable de 500m à 3000m et chaque commerce indique son temps de marche exact depuis le campus."
// Module : Cartographie & Géolocalisation Mobile

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/domain/money.dart';

class RadarScreen extends StatefulWidget {
  const RadarScreen({super.key});

  @override
  State<RadarScreen> createState() => _RadarScreenState();
}

class _RadarScreenState extends State<RadarScreen> {
  static const LatLng essectCoords = LatLng(36.7871, 10.1748);
  static const List<int> availableRadiiM = [500, 1000, 1500, 2000, 3000];

  final MapController _mapController = MapController();
  int _selectedRadiusM = 1500;
  bool _isLoading = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _merchants = [];
  Map<String, dynamic>? _selectedMerchant;

  @override
  void initState() {
    super.initState();
    _fetchRadarData();
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
        _errorMessage = 'Mode hors-ligne : données locales Montfleury affichées.';
        _merchants = _getFallbackMerchants();
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> _getFallbackMerchants() {
    return [
      {
        'id': 'm1',
        'tradeName': 'Baguette & Cie Montfleury',
        'category': 'BAKERY',
        'location': {'lat': 36.7885, 'lng': 10.1762},
        'address': '12 Avenue Montfleury, Tunis',
        'distanceFromEssectM': 210,
        'walkingMinutes': 3,
        'urgency': 'CLOSING_SOON',
        'beaconUrgencyColor': '#FF5500',
        'activeOffers': [
          {
            'id': 'o1',
            'title': 'Baguettes tradition & Viennoiseries',
            'currentPrice': 2500,
            'isSurprise': false,
            'rarity': 'COMMON',
          }
        ],
      },
      {
        'id': 'm2',
        'tradeName': 'Green Cantine Étudiante',
        'category': 'RESTAURANT',
        'location': {'lat': 36.7858, 'lng': 10.1729},
        'address': 'Rue Ibn Khaldoun, Montfleury',
        'distanceFromEssectM': 240,
        'walkingMinutes': 3,
        'urgency': 'NORMAL',
        'beaconUrgencyColor': '#CCFF00',
        'activeOffers': [
          {
            'id': 'o2',
            'title': 'Bowl Végétarien & Jus Frais',
            'currentPrice': 4500,
            'isSurprise': true,
            'rarity': 'EPIC',
          }
        ],
      },
      {
        'id': 'm3',
        'tradeName': 'Épicerie Solidaire Bab El Gorjani',
        'category': 'GROCERY',
        'location': {'lat': 36.7892, 'lng': 10.1715},
        'address': 'Boulevard Bab El Gorjani',
        'distanceFromEssectM': 380,
        'walkingMinutes': 5,
        'urgency': 'CRITICAL_FLASH',
        'beaconUrgencyColor': '#FF1744',
        'activeOffers': [
          {
            'id': 'o3',
            'title': 'Panier Fruits & Légumes de Saison',
            'currentPrice': 3000,
            'isSurprise': false,
            'rarity': 'RARE',
          }
        ],
      },
    ];
  }

  Color _parseHexColor(String? hexString, Color defaultColor) {
    if (hexString == null || hexString.isEmpty) return defaultColor;
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

    _mapController.move(LatLng(lat, lng), 16.5);
    _showMerchantBottomSheet(merchant);
  }

  void _showMerchantBottomSheet(Map<String, dynamic> merchant) {
    final urgencyColor = _parseHexColor(merchant['beaconUrgencyColor'] as String?, const Color(0xFFCCFF00));
    final offers = (merchant['activeOffers'] as List<dynamic>? ?? []);
    final int distanceM = (merchant['distanceFromEssectM'] as num?)?.toInt() ?? 0;
    final int walkingMins = (merchant['walkingMinutes'] as num?)?.toInt() ?? max<int>(1, (distanceM / 80).round());

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF16191E),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          decoration: BoxDecoration(
            color: const Color(0xFF16191E),
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
                    color: Colors.white24,
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
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          merchant['address'] as String? ?? 'Montfleury, Tunis',
                          style: const TextStyle(color: Colors.white60, fontSize: 13),
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
                      color: const Color(0xFF1C2027),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.directions_walk, size: 16, color: Color(0xFFCCFF00)),
                        const SizedBox(width: 6),
                        Text(
                          '~$walkingMins min à pied ($distanceM m)',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
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
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Liste des paniers actifs
              Text(
                'Paniers à sauver (${offers.length})',
                style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),

              if (offers.isEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C2027),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Aucun panier disponible pour le moment.',
                    style: TextStyle(color: Colors.white38, fontSize: 13),
                  ),
                )
              else
                ...offers.map((offer) {
                  final priceMillimes = (offer['currentPrice'] as num?)?.toInt() ?? 3000;
                  final isSurprise = offer['isSurprise'] == true;
                  final rarity = offer['rarity'] as String? ?? 'COMMON';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1C2027),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSurprise ? const Color(0xFFA855F7).withOpacity(0.5) : Colors.white10,
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
                                        color: const Color(0xFFA855F7).withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '🎁 $rarity',
                                        style: const TextStyle(
                                          color: Color(0xFFA855F7),
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                  Expanded(
                                    child: Text(
                                      offer['title'] as String? ?? 'Panier Sauvetage',
                                      style: const TextStyle(
                                        color: Colors.white,
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
                                  color: Color(0xFFCCFF00),
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
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Panier sélectionné : ${offer['title']}',
                                  style: const TextStyle(color: Colors.black),
                                ),
                                backgroundColor: const Color(0xFFCCFF00),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFCCFF00),
                            foregroundColor: Colors.black,
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
                backgroundColor: Color(0xFF16191E),
              ),
            );
          },
          child: Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFCCFF00),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFCCFF00).withOpacity(0.5),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(Icons.school, color: Colors.black, size: 24),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'ESSECT',
                  style: TextStyle(color: Color(0xFFCCFF00), fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),

      // Marqueurs Commerçants
      ..._merchants.map((m) {
        final loc = m['location'] as Map<String, dynamic>?;
        final lat = (loc?['lat'] as num?)?.toDouble() ?? (m['lat'] as num?)?.toDouble() ?? 36.7871;
        final lng = (loc?['lng'] as num?)?.toDouble() ?? (m['lng'] as num?)?.toDouble() ?? 10.1748;
        final urgencyColor = _parseHexColor(m['beaconUrgencyColor'] as String?, const Color(0xFFCCFF00));
        final offersCount = (m['activeOffers'] as List<dynamic>? ?? []).length;
        final isSelected = _selectedMerchant?['id'] == m['id'];

        return Marker(
          point: LatLng(lat, lng),
          width: 52,
          height: 52,
          child: GestureDetector(
            onTap: () => _onMerchantTapped(m),
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                // Halo lumineux d'urgence
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: isSelected ? 48 : 42,
                  height: isSelected ? 48 : 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF16191E),
                    shape: BoxShape.circle,
                    border: Border.all(color: urgencyColor, width: isSelected ? 3 : 2),
                    boxShadow: [
                      BoxShadow(
                        color: urgencyColor.withOpacity(isSelected ? 0.7 : 0.4),
                        blurRadius: isSelected ? 12 : 8,
                        spreadRadius: isSelected ? 3 : 1,
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.restaurant,
                    color: urgencyColor,
                    size: 20,
                  ),
                ),

                // Badge du nombre de paniers disponibles
                if (offersCount > 0)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: urgencyColor,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$offersCount',
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
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
        const Color(0xFFCCFF00),
      );

      polylines.add(
        Polyline(
          points: [
            essectCoords,
            LatLng(mLat, mLng),
          ],
          color: urgencyColor,
          strokeWidth: 3.5,
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0B0D10),
      appBar: AppBar(
        backgroundColor: const Color(0xFF16191E),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: Color(0xFFCCFF00),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Radar Montfleury',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location, color: Color(0xFFCCFF00)),
            tooltip: 'Recentrer sur l\'ESSECT',
            onPressed: () {
              setState(() {
                _selectedMerchant = null;
              });
              _mapController.move(essectCoords, 15.5);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            tooltip: 'Actualiser le radar',
            onPressed: _fetchRadarData,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Carte interactive OpenStreetMap / CartoDB Dark Matter
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(
              initialCenter: essectCoords,
              initialZoom: 15.5,
              minZoom: 13.0,
              maxZoom: 18.0,
            ),
            children: [
              // Tuiles cartographiques sombres
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
                userAgentPackageName: 'tn.essect.campussave',
              ),

              // Cercle de portée du radar (rayon sélectionné)
              CircleLayer(
                circles: [
                  CircleMarker(
                    point: essectCoords,
                    radius: _selectedRadiusM.toDouble(),
                    useRadiusInMeter: true,
                    color: const Color(0xFFCCFF00).withOpacity(0.06),
                    borderColor: const Color(0xFFCCFF00).withOpacity(0.4),
                    borderStrokeWidth: 1.5,
                  ),
                ],
              ),

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
                        color: isSelected ? Colors.black : Colors.white,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                      backgroundColor: const Color(0xFF16191E).withOpacity(0.9),
                      selectedColor: const Color(0xFFCCFF00),
                      checkmarkColor: Colors.black,
                      side: BorderSide(
                        color: isSelected ? const Color(0xFFCCFF00) : Colors.white12,
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
                    color: const Color(0xFF16191E).withOpacity(0.95),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFCCFF00).withOpacity(0.5)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFCCFF00)),
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Balayage du radar en cours...',
                        style: TextStyle(color: Colors.white, fontSize: 12),
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
                  color: const Color(0xFF16191E),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFF5500)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Color(0xFFFF5500), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Légende des urgences en bas
          Positioned(
            bottom: 16,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF16191E).withOpacity(0.92),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildLegendItem(const Color(0xFFCCFF00), 'Standard'),
                  _buildLegendItem(const Color(0xFFFF5500), 'Ferme bientôt'),
                  _buildLegendItem(const Color(0xFFFF1744), 'Urgence éclair'),
                ],
              ),
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
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 11),
        ),
      ],
    );
  }
}
