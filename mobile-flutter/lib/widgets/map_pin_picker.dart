// 💡 Concept & Analogie : Comme un plan cadastral interactif avec un compas numérique, ce widget permet au commerçant de positionner sa boutique et valide instantanément le respect du rayon piéton de 3 km.
// 🔄 Comparaison React / Flutter : Équivalent direct de `MapPinPicker.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce sélecteur graphique calcule la distance Haversine en temps réel et avertit visuellement si le commerce sort de la zone éligible."
// Module : Cartographie & Géolocalisation Mobile

import 'dart:math';
import 'package:flutter/material.dart';

import '../app/theme.dart';
class MapPinPicker extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  final Function(double lat, double lng, int distanceMeters, bool isWithinRadius)? onLocationChanged;

  const MapPinPicker({
    super.key,
    this.initialLat = 36.7885,
    this.initialLng = 10.1762,
    this.onLocationChanged,
  });

  @override
  State<MapPinPicker> createState() => _MapPinPickerState();
}

class _MapPinPickerState extends State<MapPinPicker> {
  static const double essectLat = 36.7871;
  static const double essectLng = 10.1748;
  static const double maxRangeM = 3500.0;

  late double _lat;
  late double _lng;
  int _distanceMeters = 0;

  @override
  void initState() {
    super.initState();
    _lat = widget.initialLat;
    _lng = widget.initialLng;
    _recalculateDistance();
  }

  void _recalculateDistance() {
    _distanceMeters = _calculateDistanceHaversine(essectLat, essectLng, _lat, _lng);
    final isWithin = _distanceMeters <= 3000;
    widget.onLocationChanged?.call(_lat, _lng, _distanceMeters, isWithin);
  }

  int _calculateDistanceHaversine(double lat1, double lng1, double lat2, double lng2) {
    const r = 6371000.0; // Rayon de la Terre en mètres
    final dLat = (lat2 - lat1) * (pi / 180.0);
    final dLng = (lng2 - lng1) * (pi / 180.0);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * (pi / 180.0)) * cos(lat2 * (pi / 180.0)) * sin(dLng / 2) * sin(dLng / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return (r * c).round();
  }

  void _setCoordinates(double lat, double lng) {
    setState(() {
      _lat = double.parse(lat.toStringAsFixed(6));
      _lng = double.parse(lng.toStringAsFixed(6));
      _recalculateDistance();
    });
  }

  void _handleTap(TapUpDetails details, Size size) {
    final dx = details.localPosition.dx;
    final dy = details.localPosition.dy;

    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final scale = (size.width * 0.42) / maxRangeM;

    final dLngM = (dx - centerX) / scale;
    final dLatM = (centerY - dy) / scale;

    final newLat = essectLat + (dLatM / 111000.0);
    final newLng = essectLng + (dLngM / 89000.0);

    _setCoordinates(newLat, newLng);
  }

  @override
  Widget build(BuildContext context) {
    const campusLime = AppTheme.red;
    const campusDark = AppTheme.cream;
    const campusCard = AppTheme.biscuit;
    const campusBorder = AppTheme.biscuit;

    final isEligible = _distanceMeters <= 3000;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: campusCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: campusBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // En-tête et indicateur de distance
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '📍 Localisation Boutique',
                style: TextStyle(
                  color: AppTheme.ink,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isEligible
                      ? campusLime.withValues(alpha: 0.15)
                      : AppTheme.red.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isEligible
                        ? campusLime.withValues(alpha: 0.5)
                        : AppTheme.red.withValues(alpha: 0.6),
                  ),
                ),
                child: Text(
                  isEligible ? '$_distanceMeters m (Éligible)' : '$_distanceMeters m (> 3 km)',
                  style: TextStyle(
                    color: isEligible ? campusLime : AppTheme.red,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Touchez la carte pour ajuster la position de votre établissement.',
            style: TextStyle(color: AppTheme.muted, fontSize: 13),
          ),
          const SizedBox(height: 12),

          // Radar Graphique Interactif
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 220,
              color: campusDark,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return GestureDetector(
                    onTapUp: (details) => _handleTap(details, Size(constraints.maxWidth, constraints.maxHeight)),
                    child: CustomPaint(
                      size: Size(constraints.maxWidth, constraints.maxHeight),
                      painter: _RadarMapPainter(
                        centerLat: essectLat,
                        centerLng: essectLng,
                        targetLat: _lat,
                        targetLng: _lng,
                        maxRangeM: maxRangeM,
                        isEligible: isEligible,
                        campusLime: campusLime,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Raccourcis Repères de Montfleury
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _buildLandmarkChip('Face ESSECT (120 m)', 36.7891, 10.1748),
              _buildLandmarkChip('Baguette & Bag. (210 m)', 36.7885, 10.1762),
              _buildLandmarkChip('Pâtisserie Masmoudi (340 m)', 36.7876, 10.1775),
              _buildLandmarkChip('Bd 9 Avril (410 m)', 36.7865, 10.1735),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLandmarkChip(String label, double lat, double lng) {
    return InkWell(
      onTap: () => _setCoordinates(lat, lng),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: AppTheme.cream,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.biscuit),
        ),
        child: Text(
          label,
          style: const TextStyle(color: AppTheme.muted, fontSize: 13),
        ),
      ),
    );
  }
}

class _RadarMapPainter extends CustomPainter {
  final double centerLat;
  final double centerLng;
  final double targetLat;
  final double targetLng;
  final double maxRangeM;
  final bool isEligible;
  final Color campusLime;

  _RadarMapPainter({
    required this.centerLat,
    required this.centerLng,
    required this.targetLat,
    required this.targetLng,
    required this.maxRangeM,
    required this.isEligible,
    required this.campusLime,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final scale = (size.width * 0.42) / maxRangeM;

    final circlePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0
      ..color = AppTheme.ink.withValues(alpha: 0.08);

    // Cercles concentriques
    canvas.drawCircle(Offset(centerX, centerY), 1000 * scale, circlePaint);
    canvas.drawCircle(Offset(centerX, centerY), 2000 * scale, circlePaint);

    // Cercle 3000m (Limite d'éligibilité)
    final limitPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = isEligible
          ? campusLime.withValues(alpha: 0.35)
          : AppTheme.red.withValues(alpha: 0.4);
    canvas.drawCircle(Offset(centerX, centerY), 3000 * scale, limitPaint);

    // Axes en croix
    final axisPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8
      ..color = AppTheme.ink.withValues(alpha: 0.05);
    canvas.drawLine(Offset(centerX, 0), Offset(centerX, size.height), axisPaint);
    canvas.drawLine(Offset(0, centerY), Offset(size.width, centerY), axisPaint);

    // Centre : ESSECT Montfleury
    final essectPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = campusLime;
    canvas.drawCircle(Offset(centerX, centerY), 6, essectPaint);

    // Position de l'épingle
    final dLatM = (targetLat - centerLat) * 111000.0;
    final dLngM = (targetLng - centerLng) * 89000.0;
    final pinX = centerX + (dLngM * scale);
    final pinY = centerY - (dLatM * scale);

    // Ligne reliant campus et boutique
    final linePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = isEligible ? campusLime : AppTheme.red;
    canvas.drawLine(Offset(centerX, centerY), Offset(pinX, pinY), linePaint);

    // Épingle boutique
    final pinPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = isEligible ? campusLime : AppTheme.red;
    canvas.drawCircle(Offset(pinX, pinY), 7, pinPaint);

    final borderPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = AppTheme.cream;
    canvas.drawCircle(Offset(pinX, pinY), 7, borderPaint);
  }

  @override
  bool shouldRepaint(covariant _RadarMapPainter oldDelegate) {
    return oldDelegate.targetLat != targetLat ||
        oldDelegate.targetLng != targetLng ||
        oldDelegate.isEligible != isEligible;
  }
}
