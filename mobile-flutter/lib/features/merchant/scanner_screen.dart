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
          backgroundColor: Colors.redAccent,
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
      backgroundColor: const Color(0xFF161920),
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
                  color: const Color(0xFF10B981).withOpacity(0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4), width: 2),
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF34D399),
                  size: 40,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Retrait Validé !',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Vous pouvez remettre la commande à l\'étudiant.',
                style: TextStyle(fontSize: 13, color: Color(0xFF34D399)),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D0F12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.08)),
                ),
                child: Column(
                  children: [
                    _buildReceiptRow('N° Commande', order['orderCode'] ?? 'CS-?????', isBold: true),
                    const Divider(color: Colors.white10, height: 20),
                    _buildReceiptRow(
                      'Étudiant',
                      order['studentSnapshot']?['displayName'] ?? 'Étudiant ESSECT',
                    ),
                    const Divider(color: Colors.white10, height: 20),
                    _buildReceiptRow(
                      'Portions',
                      '${order['quantity'] ?? 1} portion(s)',
                      valueColor: const Color(0xFFCCFF00),
                    ),
                    const Divider(color: Colors.white10, height: 20),
                    _buildReceiptRow(
                      'Points attribués',
                      '+$pointsAwarded EcoPoints',
                      valueColor: const Color(0xFF34D399),
                    ),
                    if (isSurprise && reveal != null) ...[
                      const Divider(color: Colors.white10, height: 20),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          '🎁 Contenu Mystery Box :',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber.shade400,
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
                                style: const TextStyle(fontSize: 12, color: Colors.white70),
                              ),
                              Text(
                                'x${item['qty']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.amber.shade200,
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
                    backgroundColor: const Color(0xFFCCFF00),
                    foregroundColor: Colors.black,
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
      backgroundColor: const Color(0xFF161920),
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
                  color: Colors.red.withOpacity(0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.red.withOpacity(0.4), width: 2),
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: Colors.redAccent,
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Refus du Billet',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.red.shade300),
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
                    backgroundColor: Colors.red.shade900,
                    foregroundColor: Colors.white,
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
          style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: valueColor ?? Colors.white,
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
      backgroundColor: const Color(0xFF161920),
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
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: orderCodeController,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontSize: 18,
                ),
                decoration: InputDecoration(
                  labelText: 'Code Commande (ex : CS-7H9KZ)',
                  labelStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                  filled: true,
                  fillColor: const Color(0xFF0D0F12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFFCCFF00)),
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
                  color: Color(0xFFCCFF00),
                  fontFamily: 'monospace',
                  fontSize: 24,
                  letterSpacing: 6,
                  fontWeight: FontWeight.bold,
                ),
                decoration: InputDecoration(
                  labelText: 'Code à 6 chiffres sous le QR',
                  labelStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                  filled: true,
                  fillColor: const Color(0xFF0D0F12),
                  counterText: '',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFFCCFF00)),
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
                    backgroundColor: const Color(0xFFCCFF00),
                    foregroundColor: Colors.black,
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
      backgroundColor: const Color(0xFF0D0F12),
      appBar: AppBar(
        title: const Text(
          'Scanner de Retrait',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: const Color(0xFF161920),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
              color: _isTorchOn ? const Color(0xFFCCFF00) : Colors.white70,
            ),
            onPressed: () async {
              await _controller.toggleTorch();
              setState(() {
                _isTorchOn = !_isTorchOn;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch_rounded, color: Colors.white70),
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
                color: const Color(0xFF0D0F12),
                alignment: Alignment.center,
                padding: const EdgeInsets.all(24),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.camera_alt_outlined, size: 48, color: Colors.white38),
                    SizedBox(height: 12),
                    Text(
                      'Caméra non disponible sur cet aperçu',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Utilisez la saisie manuelle ci-dessous pour valider le code à 6 chiffres.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70, fontSize: 11),
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
              border: Border.all(color: const Color(0xFFCCFF00), width: 3),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFCCFF00).withOpacity(0.2),
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
                style: TextStyle(color: Colors.white, fontSize: 12),
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
                backgroundColor: const Color(0xFF161920),
                foregroundColor: const Color(0xFFCCFF00),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: const Color(0xFFCCFF00).withOpacity(0.4)),
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
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFCCFF00)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
