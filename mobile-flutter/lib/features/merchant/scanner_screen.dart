// 💡 Concept & Analogie : Comme la douchette sans fil du commerçant qui valide les commandes au comptoir, cet écran utilise la caméra mobile ou la saisie manuelle avec retour haptique instantané.
// 🔄 Comparaison React / Flutter : Utilise le package Flutter `mobile_scanner` haute performance avec gestion du flash/torche ; équivalent de `MerchantScanPage.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Le scanner mobile active la caméra native, transmet la signature à l'API de vérification, et déclenche une vibration haptique lors de la validation du panier."
// Module : Espace Commerçant Mobile

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

import '../../app/theme.dart';
class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;
  bool _isTorchOn = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final rawPayload = barcodes.first.rawValue;
    if (rawPayload == null || rawPayload.isEmpty) return;

    setState(() {
      _isProcessing = true;
    });

    await _controller.stop();
    await _validateScan(rawPayload);
  }

  Future<void> _validateScan(String qrPayload) async {
    try {
      final response = await ApiClient.dio.post(
        Endpoints.scanTicket,
        data: {'qrPayload': qrPayload},
      );

      HapticFeedback.heavyImpact();
      if (!mounted) return;
      _showSuccessSheet(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      HapticFeedback.vibrate();
      final errData = e.response?.data;
      String errorMsg = 'Erreur lors de la validation du billet';
      if (errData is Map && errData['error'] != null) {
        errorMsg = errData['error']['message'] ?? errorMsg;
      }
      if (!mounted) return;
      _showErrorSheet(errorMsg);
    } catch (e) {
      HapticFeedback.vibrate();
      if (!mounted) return;
      _showErrorSheet('Erreur imprévue : $e');
    }
  }

  Future<void> _validateManualCode(String orderCode, String code6) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      final response = await ApiClient.dio.post(
        Endpoints.redeemCode,
        data: {
          'orderCode': orderCode.trim().toUpperCase(),
          'code6': code6.trim(),
        },
      );

      HapticFeedback.heavyImpact();
      if (!mounted) return;
      Navigator.of(context).pop(); // Ferme le formulaire manuel
      _showSuccessSheet(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      HapticFeedback.vibrate();
      final errData = e.response?.data;
      String errorMsg = 'Code manuel invalide ou expiré';
      if (errData is Map && errData['error'] != null) {
        errorMsg = errData['error']['message'] ?? errorMsg;
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg),
          backgroundColor: AppTheme.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  void _showSuccessSheet(Map<String, dynamic> data) {
    final order = data['order'] as Map<String, dynamic>? ?? {};
    final pointsAwarded = data['pointsAwarded'] ?? 0;
    final isSurprise = data['isSurprise'] == true;
    final reveal = data['reveal'] as Map<String, dynamic>?;

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      backgroundColor: AppTheme.biscuit,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppTheme.leaf.withOpacity(0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.leaf.withOpacity(0.4), width: 2),
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: AppTheme.leaf,
                  size: 40,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Retrait Validé !',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.ink,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Vous pouvez remettre la commande à l\'étudiant.',
                style: TextStyle(fontSize: 13, color: AppTheme.leaf),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.cream,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.ink.withOpacity(0.08)),
                ),
                child: Column(
                  children: [
                    _buildReceiptRow('N° Commande', order['orderCode'] ?? 'CS-?????', isBold: true),
                    const Divider(color: AppTheme.sand, height: 20),
                    _buildReceiptRow(
                      'Étudiant',
                      order['studentSnapshot']?['displayName'] ?? 'Étudiant ESSECT',
                    ),
                    const Divider(color: AppTheme.sand, height: 20),
                    _buildReceiptRow(
                      'Portions',
                      '${order['quantity'] ?? 1} portion(s)',
                      valueColor: AppTheme.red,
                    ),
                    const Divider(color: AppTheme.sand, height: 20),
                    _buildReceiptRow(
                      'Points attribués',
                      '+$pointsAwarded EcoPoints',
                      valueColor: AppTheme.leaf,
                    ),
                    if (isSurprise && reveal != null) ...[
                      const Divider(color: AppTheme.sand, height: 20),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          '🎁 Contenu Mystery Box :',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.ink,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      ...(reveal['items'] as List<dynamic>? ?? []).map((item) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '• ${item['name']}',
                                style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                              ),
                              Text(
                                'x${item['qty']}',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.red,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _restartScanner();
                  },
                  icon: const Icon(Icons.qr_code_scanner_rounded),
                  label: const Text('Scanner la commande suivante'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.red,
                    foregroundColor: AppTheme.cream,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showErrorSheet(String errorMessage) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: AppTheme.biscuit,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.red.withOpacity(0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.red.withOpacity(0.4), width: 2),
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: AppTheme.red,
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Refus du Billet',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.ink,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: AppTheme.red),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _restartScanner();
                  },
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Réessayer'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.redDark,
                    foregroundColor: AppTheme.ink,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 13, color: AppTheme.muted),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: valueColor ?? AppTheme.ink,
            fontFamily: isBold ? 'monospace' : null,
          ),
        ),
      ],
    );
  }

  void _restartScanner() {
    setState(() {
      _isProcessing = false;
    });
    _controller.start();
  }

  void _openManualDialog() {
    final orderCodeController = TextEditingController();
    final code6Controller = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.biscuit,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            24,
            24,
            24,
            MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Saisie Manuelle de Secours',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.ink,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: AppTheme.muted),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: orderCodeController,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(
                  color: AppTheme.ink,
                  fontFamily: 'monospace',
                  fontSize: 18,
                ),
                decoration: InputDecoration(
                  labelText: 'Code Commande (ex : CS-7H9KZ)',
                  labelStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
                  filled: true,
                  fillColor: AppTheme.cream,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: AppTheme.ink.withOpacity(0.1)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: AppTheme.red),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: code6Controller,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppTheme.red,
                  fontFamily: 'monospace',
                  fontSize: 24,
                  letterSpacing: 6,
                  fontWeight: FontWeight.bold,
                ),
                decoration: InputDecoration(
                  labelText: 'Code à 6 chiffres sous le QR',
                  labelStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
                  filled: true,
                  fillColor: AppTheme.cream,
                  counterText: '',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: AppTheme.ink.withOpacity(0.1)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: AppTheme.red),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    _validateManualCode(
                      orderCodeController.text,
                      code6Controller.text,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.red,
                    foregroundColor: AppTheme.cream,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  child: const Text('Valider le Retrait'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        title: const Text(
          'Scanner de Retrait',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AppTheme.biscuit,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
              color: _isTorchOn ? AppTheme.red : AppTheme.muted,
            ),
            onPressed: () async {
              await _controller.toggleTorch();
              setState(() {
                _isTorchOn = !_isTorchOn;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch_rounded, color: AppTheme.muted),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        alignment: Alignment.center,
        children: [
          // Vue caméra MobileScanner avec repli défensif pour le Web et Desktop
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error, child) {
              return Container(
                color: AppTheme.cream,
                alignment: Alignment.center,
                padding: const EdgeInsets.all(24),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.camera_alt_outlined, size: 48, color: AppTheme.muted),
                    SizedBox(height: 12),
                    Text(
                      'Caméra non disponible sur cet aperçu',
                      style: TextStyle(color: AppTheme.ink, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Utilisez la saisie manuelle ci-dessous pour valider le code à 6 chiffres.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppTheme.muted, fontSize: 13),
                    ),
                  ],
                ),
              );
            },
          ),

          // Viseur graphique
          Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.red, width: 3),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.red.withOpacity(0.2),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),

          // Message guide en bas
          Positioned(
            bottom: 110,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Pointez la caméra vers le Living Ticket de l\'étudiant',
                style: TextStyle(color: AppTheme.ink, fontSize: 13),
              ),
            ),
          ),

          // Bouton flottant pour saisie manuelle de secours
          Positioned(
            bottom: 30,
            left: 24,
            right: 24,
            child: ElevatedButton.icon(
              onPressed: _openManualDialog,
              icon: const Icon(Icons.keyboard_rounded),
              label: const Text('Saisie de secours (code à 6 chiffres)'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.biscuit,
                foregroundColor: AppTheme.red,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: AppTheme.red.withOpacity(0.4)),
                ),
                textStyle: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),

          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.red),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
