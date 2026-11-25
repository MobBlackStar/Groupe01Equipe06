// 💡 Concept & Analogie : Équivalent Flutter du moteur React `HalftoneMascotQr` : un `CustomPainter` incruste la mascotte CampusSave au centre d'une matrice QR niveau H (30 %) avec des points halftone calibrés et des repères de coins pleins.
// 🔄 Comparaison React / Flutter : React dessine sur HTML5 `<canvas>` avec `qrcode` ; Flutter dessine sur `ui.Canvas` via `QrCode` / `QrImage` de `qr_flutter` et `assets/brand/mascot-sticker.png`.
// 🎯 À retenir pour la soutenance : "Même algo Halftone exact sur Web et Mobile : quiet zone 3 modules, coins et alignement pleins, points à 42 % avec halo adaptatif sur la mascotte."

import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:qr_flutter/qr_flutter.dart';

class HalftoneMascotQr extends StatefulWidget {
  final String data;
  final double size;
  final String mascotAsset;

  const HalftoneMascotQr({
    super.key,
    required this.data,
    this.size = 210,
    this.mascotAsset = 'assets/brand/mascot-sticker.png',
  });

  @override
  State<HalftoneMascotQr> createState() => _HalftoneMascotQrState();
}

class _HalftoneMascotQrState extends State<HalftoneMascotQr> {
  ui.Image? _mascotImage;
  ByteData? _mascotRgba;

  @override
  void initState() {
    super.initState();
    _loadMascotAsset();
  }

  @override
  void didUpdateWidget(covariant HalftoneMascotQr oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.mascotAsset != widget.mascotAsset) {
      _loadMascotAsset();
    }
  }

  Future<void> _loadMascotAsset() async {
    try {
      final raw = await rootBundle.load(widget.mascotAsset);
      final codec = await ui.instantiateImageCodec(raw.buffer.asUint8List());
      final frame = await codec.getNextFrame();
      final img = frame.image;
      final rgba = await img.toByteData(format: ui.ImageByteFormat.rawRgba);
      if (!mounted) {
        img.dispose();
        return;
      }
      _mascotImage?.dispose();
      setState(() {
        _mascotImage = img;
        _mascotRgba = rgba;
      });
    } catch (_) {
      // Repli silencieux sur un QR halftone haute lisibilité sans mascotte.
    }
  }

  @override
  void dispose() {
    _mascotImage?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'QR code sécurisé CampusSave',
      image: true,
      child: SizedBox(
        width: widget.size,
        height: widget.size,
        child: CustomPaint(
          painter: _HalftoneQrPainter(
            data: widget.data,
            mascotImage: _mascotImage,
            mascotRgba: _mascotRgba,
          ),
        ),
      ),
    );
  }
}

class _HalftoneQrPainter extends CustomPainter {
  final String data;
  final ui.Image? mascotImage;
  final ByteData? mascotRgba;

  static const int _quietModules = 3;
  static const int _mascotMarginModules = 2;
  static const double _mascotDotRadiusRatio = 0.21;
  static const double _outerDotRadiusRatio = 0.35;

  const _HalftoneQrPainter({
    required this.data,
    required this.mascotImage,
    required this.mascotRgba,
  });

  static List<int> _alignmentCenters(int moduleCount) {
    final version = ((moduleCount - 17) / 4).round();
    if (version < 2) return const [];
    const table = <int, List<int>>{
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
      7: [6, 22, 38],
      8: [6, 24, 42],
      9: [6, 26, 46],
      10: [6, 28, 50],
    };
    return table[version] ?? [6, moduleCount - 7];
  }

  static bool _isFinderOrSeparator(int row, int col, int n) {
    return (row < 8 && col < 8) || (row < 8 && col >= n - 8) || (row >= n - 8 && col < 8);
  }

  static bool _isAlignmentModule(int row, int col, int n, List<int> centers) {
    if (centers.isEmpty) return false;
    for (final cy in centers) {
      for (final cx in centers) {
        if ((cy <= 8 && cx <= 8) || (cy <= 8 && cx >= n - 9) || (cy >= n - 9 && cx <= 8)) {
          continue;
        }
        if ((row - cy).abs() <= 2 && (col - cx).abs() <= 2) {
          return true;
        }
      }
    }
    return false;
  }

  List<int> _sampleMascotRgba(double u, double v) {
    final img = mascotImage;
    final rgba = mascotRgba;
    if (img == null || rgba == null || u < 0 || u >= 1 || v < 0 || v >= 1) {
      return const [255, 255, 255, 0];
    }
    final x = (u * img.width).floor().clamp(0, img.width - 1);
    final y = (v * img.height).floor().clamp(0, img.height - 1);
    final offset = (y * img.width + x) * 4;
    if (offset + 3 >= rgba.lengthInBytes) return const [255, 255, 255, 0];
    return [
      rgba.getUint8(offset),
      rgba.getUint8(offset + 1),
      rgba.getUint8(offset + 2),
      rgba.getUint8(offset + 3),
    ];
  }

  @override
  void paint(Canvas canvas, Size size) {
    final side = size.shortestSide;
    final whitePaint = Paint()..color = Colors.white;
    canvas.drawRect(Rect.fromLTWH(0, 0, side, side), whitePaint);

    if (data.isEmpty) return;

    final qrCode = QrCode.fromData(
      data: data,
      errorCorrectLevel: QrErrorCorrectLevel.H,
    );
    final qrImage = QrImage(qrCode);
    final n = qrImage.moduleCount;
    final total = n + _quietModules * 2;
    final cell = side / total;
    final alignCenters = _alignmentCenters(n);

    final mascotOrigin = (_quietModules + _mascotMarginModules) * cell;
    final mascotSpan = ((n - _mascotMarginModules * 2).clamp(0, n)) * cell;
    final mascotRect = Rect.fromLTWH(mascotOrigin, mascotOrigin, mascotSpan, mascotSpan);

    if (mascotImage != null && mascotSpan > 0) {
      final src = Rect.fromLTWH(
        0,
        0,
        mascotImage!.width.toDouble(),
        mascotImage!.height.toDouble(),
      );
      canvas.drawImageRect(
        mascotImage!,
        src,
        mascotRect,
        Paint()
          ..color = Colors.white.withValues(alpha: 0.94)
          ..filterQuality = FilterQuality.high,
      );
    }

    final darkPaint = Paint()..color = const Color(0xFF111111);
    final darkHaloPaint = Paint()..color = Colors.white.withValues(alpha: 0.84);
    final lightHaloPaint = Paint()..color = const Color(0xFF111111).withValues(alpha: 0.22);

    for (var row = 0; row < n; row++) {
      for (var col = 0; col < n; col++) {
        final isDark = qrImage.isDark(row, col);
        final x0 = (_quietModules + col) * cell;
        final y0 = (_quietModules + row) * cell;
        final cx = x0 + cell / 2;
        final cy = y0 + cell / 2;

        if (_isFinderOrSeparator(row, col, n) || _isAlignmentModule(row, col, n, alignCenters)) {
          canvas.drawRect(
            Rect.fromLTWH(x0, y0, cell + 0.4, cell + 0.4),
            isDark ? darkPaint : whitePaint,
          );
          continue;
        }

        final u = mascotSpan > 0 ? (cx - mascotOrigin) / mascotSpan : -1.0;
        final v = mascotSpan > 0 ? (cy - mascotOrigin) / mascotSpan : -1.0;
        final sample = _sampleMascotRgba(u, v);
        final overMascot = u >= 0 && u < 1 && v >= 0 && v < 1 && sample[3] > 30;
        final luminance = 0.299 * sample[0] + 0.587 * sample[1] + 0.114 * sample[2];

        if (overMascot) {
          final dotRadius = cell * _mascotDotRadiusRatio;
          if (isDark) {
            if (luminance < 125) {
              canvas.drawCircle(Offset(cx, cy), dotRadius + cell * 0.055, darkHaloPaint);
            }
            canvas.drawCircle(Offset(cx, cy), dotRadius, darkPaint);
          } else {
            if (luminance > 180) {
              canvas.drawCircle(Offset(cx, cy), dotRadius + cell * 0.045, lightHaloPaint);
            }
            canvas.drawCircle(Offset(cx, cy), dotRadius, whitePaint);
          }
        } else if (isDark) {
          canvas.drawCircle(Offset(cx, cy), cell * _outerDotRadiusRatio, darkPaint);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _HalftoneQrPainter oldDelegate) {
    return oldDelegate.data != data ||
        oldDelegate.mascotImage != mascotImage ||
        oldDelegate.mascotRgba != mascotRgba;
  }
}
