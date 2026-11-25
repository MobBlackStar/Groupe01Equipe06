// 💡 Concept & Analogie : Comme un plan cadastral interactif avec un compas numérique, ce widget permet au commerçant de positionner sa boutique via GPS, Google Maps, rues de Montfleury ou toucher direct.
// 🔄 Comparaison React / Flutter : Équivalent direct de `SpotEditor.jsx` sous React (GPS + Google Maps + 6 rues Montfleury + carte interactive).
// 🎯 À retenir pour la soutenance : "Ce sélecteur calcule la distance Haversine en temps réel, lit la puce GPS du smartphone et avertit visuellement si le commerce sort du rayon de 3 km."
// Module : Cartographie & Géolocalisation Mobile

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app/theme.dart';
import '../core/domain/geo.dart';
import 'griddle.dart';

class MontfleuryStreetPreset {
  final String label;
  final double lat;
  final double lng;

  const MontfleuryStreetPreset(this.label, this.lat, this.lng);
}

const List<MontfleuryStreetPreset> kMontfleuryPresets = [
  MontfleuryStreetPreset('Face ESSECT', 36.7865, 10.1739),
  MontfleuryStreetPreset('Boulevard Ali Trad', 36.7885, 10.1762),
  MontfleuryStreetPreset('Rue Galilée', 36.7872, 10.1748),
  MontfleuryStreetPreset('Avenue Bab Jedid', 36.7915, 10.1710),
  MontfleuryStreetPreset('Rue des Silos', 36.7845, 10.1780),
  MontfleuryStreetPreset('Avenue de Bellevue', 36.7838, 10.1772),
];

class MapPinPicker extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  final Function(double lat, double lng, int distanceMeters, bool isWithinRadius)? onLocationChanged;

  const MapPinPicker({
    super.key,
    this.initialLat = kEssectLat,
    this.initialLng = kEssectLng,
    this.onLocationChanged,
  });

  @override
  State<MapPinPicker> createState() => _MapPinPickerState();
}

class _MapPinPickerState extends State<MapPinPicker> {
  static const double maxRangeM = 3500.0;

  late double _lat;
  late double _lng;
  int _distanceMeters = 0;
  bool _gpsLoading = false;
  String? _gpsError;

  @override
  void initState() {
    super.initState();
    _lat = widget.initialLat;
    _lng = widget.initialLng;
    _distanceMeters = distanceFromEssectM(_lat, _lng);
  }

  @override
  void didUpdateWidget(covariant MapPinPicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if ((oldWidget.initialLat - widget.initialLat).abs() > 1e-6 ||
        (oldWidget.initialLng - widget.initialLng).abs() > 1e-6) {
      setState(() {
        _lat = widget.initialLat;
        _lng = widget.initialLng;
        _distanceMeters = distanceFromEssectM(_lat, _lng);
      });
    }
  }

  void _setCoordinates(double lat, double lng) {
    final roundedLat = double.parse(lat.toStringAsFixed(6));
    final roundedLng = double.parse(lng.toStringAsFixed(6));
    final dist = distanceFromEssectM(roundedLat, roundedLng);
    setState(() {
      _lat = roundedLat;
      _lng = roundedLng;
      _distanceMeters = dist;
      _gpsError = null;
    });
    widget.onLocationChanged?.call(roundedLat, roundedLng, dist, dist <= kMaxMerchantDistanceM);
  }

  Future<void> _useCurrentGps() async {
    setState(() {
      _gpsLoading = true;
      _gpsError = null;
    });
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!mounted) return;
        setState(() {
          _gpsLoading = false;
          _gpsError = 'GPS désactivé : activez la localisation sur votre téléphone ou choisissez une rue ci-dessous.';
        });
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        if (!mounted) return;
        setState(() {
          _gpsLoading = false;
          _gpsError = 'Autorisation de localisation refusée. Choisissez une rue de Montfleury ou ouvrez Google Maps.';
        });
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );
      if (!mounted) return;
      _setCoordinates(pos.latitude, pos.longitude);
      setState(() => _gpsLoading = false);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _gpsLoading = false;
        _gpsError = 'Position GPS indisponible pour le moment. Utilisez une rue ci-dessous ou Google Maps.';
      });
    }
  }

  Future<void> _openGoogleMaps() async {
    final uri = Uri.parse('https://www.google.com/maps/@$_lat,$_lng,17z');
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && mounted) {
        setState(() => _gpsError = 'Impossible d\'ouvrir Google Maps sur cet appareil.');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _gpsError = 'Impossible d\'ouvrir Google Maps sur cet appareil.');
      }
    }
  }

  void _handleTap(TapUpDetails details, Size size) {
    final dx = details.localPosition.dx;
    final dy = details.localPosition.dy;

    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final scale = (min(size.width, size.height) * 0.44) / maxRangeM;

    final dLngM = (dx - centerX) / scale;
    final dLatM = (centerY - dy) / scale;

    final newLat = kEssectLat + (dLatM / 111000.0);
    final newLng = kEssectLng + (dLngM / 89000.0);

    _setCoordinates(newLat, newLng);
  }

  @override
  Widget build(BuildContext context) {
    final isEligible = _distanceMeters <= kMaxMerchantDistanceM;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.biscuit,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.ink, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // En-tête et indicateur de distance
          Row(
            children: [
              const Expanded(
                child: Text(
                  '📍 Localisation de la boutique',
                  style: TextStyle(
                    color: AppTheme.ink,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
              GPill(
                isEligible ? '$_distanceMeters m (Éligible)' : '$_distanceMeters m (> 3 km)',
                color: isEligible ? const Color(0xFFDDEFD9) : AppTheme.red,
                textColor: isEligible ? AppTheme.leaf : AppTheme.cream,
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Actions rapides : GPS natif + Google Maps
          Row(
            children: [
              Expanded(
                child: GButton(
                  _gpsLoading ? 'Localisation…' : 'Ma position GPS',
                  icon: Icons.my_location,
                  variant: GVariant.cream,
                  small: true,
                  loading: _gpsLoading,
                  onPressed: _gpsLoading ? null : _useCurrentGps,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: GButton(
                  'Google Maps',
                  icon: Icons.map_outlined,
                  variant: GVariant.cream,
                  small: true,
                  onPressed: _openGoogleMaps,
                ),
              ),
            ],
          ),

          if (_gpsError != null) ...[
            const SizedBox(height: 10),
            GNotice(_gpsError!, icon: Icons.location_off_outlined, color: AppTheme.red),
          ],

          const SizedBox(height: 12),
          Text(
            'Ou touchez le radar / choisissez une rue de Montfleury :',
            style: AppTheme.body(13, AppTheme.muted),
          ),
          const SizedBox(height: 10),

          // Radar Graphique Interactif
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 190,
              decoration: BoxDecoration(
                color: AppTheme.cream,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.ink, width: 1.5),
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return GestureDetector(
                    onTapUp: (details) => _handleTap(details, Size(constraints.maxWidth, constraints.maxHeight)),
                    child: CustomPaint(
                      size: Size(constraints.maxWidth, constraints.maxHeight),
                      painter: _RadarMapPainter(
                        centerLat: kEssectLat,
                        centerLng: kEssectLng,
                        targetLat: _lat,
                        targetLng: _lng,
                        maxRangeM: maxRangeM,
                        isEligible: isEligible,
                        accentColor: isEligible ? AppTheme.leaf : AppTheme.red,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Raccourcis 1-clic rues de Montfleury
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: kMontfleuryPresets.map((preset) {
              final selected = (_lat - preset.lat).abs() < 1e-5 && (_lng - preset.lng).abs() < 1e-5;
              return GChip(
                preset.label,
                selected: selected,
                onTap: () => _setCoordinates(preset.lat, preset.lng),
              );
            }).toList(),
          ),
        ],
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
  final Color accentColor;

  _RadarMapPainter({
    required this.centerLat,
    required this.centerLng,
    required this.targetLat,
    required this.targetLng,
    required this.maxRangeM,
    required this.isEligible,
    required this.accentColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final scale = (min(size.width, size.height) * 0.44) / maxRangeM;

    final circlePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0
      ..color = AppTheme.ink.withValues(alpha: 0.10);

    canvas.drawCircle(Offset(centerX, centerY), 1000 * scale, circlePaint);
    canvas.drawCircle(Offset(centerX, centerY), 2000 * scale, circlePaint);

    final limitPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..color = isEligible
          ? AppTheme.leaf.withValues(alpha: 0.55)
          : AppTheme.red.withValues(alpha: 0.6);
    canvas.drawCircle(Offset(centerX, centerY), 3000 * scale, limitPaint);

    final axisPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8
      ..color = AppTheme.ink.withValues(alpha: 0.07);
    canvas.drawLine(Offset(centerX, 0), Offset(centerX, size.height), axisPaint);
    canvas.drawLine(Offset(0, centerY), Offset(size.width, centerY), axisPaint);

    final essectPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = AppTheme.red;
    canvas.drawCircle(Offset(centerX, centerY), 6, essectPaint);

    final dLatM = (targetLat - centerLat) * 111000.0;
    final dLngM = (targetLng - centerLng) * 89000.0;
    final pinX = (centerX + (dLngM * scale)).clamp(12.0, size.width - 12.0);
    final pinY = (centerY - (dLatM * scale)).clamp(12.0, size.height - 12.0);

    final linePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = accentColor;
    canvas.drawLine(Offset(centerX, centerY), Offset(pinX, pinY), linePaint);

    final pinPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = accentColor;
    canvas.drawCircle(Offset(pinX, pinY), 8, pinPaint);

    final borderPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..color = AppTheme.paper;
    canvas.drawCircle(Offset(pinX, pinY), 8, borderPaint);
  }

  @override
  bool shouldRepaint(covariant _RadarMapPainter oldDelegate) {
    return oldDelegate.targetLat != targetLat ||
        oldDelegate.targetLng != targetLng ||
        oldDelegate.isEligible != isEligible;
  }
}
