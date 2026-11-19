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
import '../../widgets/griddle.dart';
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

  static const _sheetShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    side: BorderSide(color: AppTheme.ink, width: 2),
  );

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
      backgroundColor: AppTheme.cream,
      shape: _sheetShape,
      builder: (context) {
        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(22, 24, 22, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(color: AppTheme.leaf, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
                      child: const Icon(Icons.check, color: AppTheme.cream, size: 32),
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: Text('RETRAIT VALIDÉ', style: AppTheme.display(42))),
                  ],
                ),
                const SizedBox(height: 6),
                Text('Vous pouvez remettre la commande à l\'étudiant.', style: AppTheme.body(16, AppTheme.muted)),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: AppTheme.paperCard(),
                  child: Column(
                    children: [
                      _buildReceiptRow('N° commande', order['orderCode'] ?? 'CS-?????', isBold: true),
                      const Divider(color: AppTheme.ink, height: 22),
                      _buildReceiptRow('Étudiant', order['studentSnapshot']?['displayName'] ?? 'Étudiant ESSECT'),
                      const Divider(color: AppTheme.ink, height: 22),
                      _buildReceiptRow('Portions', '${order['quantity'] ?? 1}', valueColor: AppTheme.red),
                      const Divider(color: AppTheme.ink, height: 22),
                      _buildReceiptRow('Points attribués', '+$pointsAwarded', valueColor: AppTheme.leaf),
                      if (isSurprise && reveal != null) ...[
                        const Divider(color: AppTheme.ink, height: 22),
                        Align(alignment: Alignment.centerLeft, child: Text('CONTENU DU PANIER SURPRISE', style: AppTheme.label())),
                        const SizedBox(height: 6),
                        ...(reveal['items'] as List<dynamic>? ?? []).map((item) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(
                              children: [
                                Expanded(child: Text('• ${item['name']}', style: AppTheme.body(15, AppTheme.muted))),
                                Text('x${item['qty']}', style: AppTheme.mono(14, AppTheme.red).copyWith(fontWeight: FontWeight.w700)),
                              ],
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                GButton(
                  'Scanner la suivante',
                  icon: Icons.qr_code_scanner,
                  onPressed: () {
                    Navigator.of(context).pop();
                    _restartScanner();
                  },
                ),
              ],
            ),
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
      backgroundColor: AppTheme.cream,
      shape: _sheetShape,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 24, 22, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(color: AppTheme.red, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
                      child: const Icon(Icons.close, color: AppTheme.cream, size: 32),
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: Text('BILLET REFUSÉ', style: AppTheme.display(42))),
                  ],
                ),
                const SizedBox(height: 10),
                Text(errorMessage, style: AppTheme.body(17).copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 20),
                GButton(
                  'Réessayer',
                  icon: Icons.refresh,
                  onPressed: () {
                    Navigator.of(context).pop();
                    _restartScanner();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Row(
      children: [
        Expanded(child: Text(label, style: AppTheme.body(15, AppTheme.muted))),
        Text(
          value,
          style: AppTheme.mono(15, valueColor ?? AppTheme.ink).copyWith(fontWeight: isBold ? FontWeight.w800 : FontWeight.w600),
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
      backgroundColor: AppTheme.cream,
      shape: _sheetShape,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(22, 22, 22, MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text('SAISIE DE SECOURS', style: AppTheme.display(38))),
                  GIconButton(icon: Icons.close, tooltip: 'Fermer', onPressed: () => Navigator.of(context).pop()),
                ],
              ),
              const SizedBox(height: 14),
              TextField(
                controller: orderCodeController,
                textCapitalization: TextCapitalization.characters,
                style: AppTheme.mono(18).copyWith(fontWeight: FontWeight.w700),
                decoration: const InputDecoration(labelText: 'Code commande (ex : CS-7H9KZ)'),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: code6Controller,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: AppTheme.mono(26, AppTheme.red).copyWith(letterSpacing: 6, fontWeight: FontWeight.w800),
                decoration: const InputDecoration(labelText: 'Code à 6 chiffres sous le QR', counterText: ''),
              ),
              const SizedBox(height: 18),
              GButton(
                'Valider le retrait',
                icon: Icons.check,
                onPressed: () {
                  _validateManualCode(orderCodeController.text, code6Controller.text);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GScreenBody(
      eyebrow: 'Espace commerçant',
      title: 'Scanner',
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GIconButton(
            icon: _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
            tooltip: 'Lampe',
            onPressed: () async {
              await _controller.toggleTorch();
              setState(() {
                _isTorchOn = !_isTorchOn;
              });
            },
          ),
          const SizedBox(width: 8),
          GIconButton(icon: Icons.cameraswitch_rounded, tooltip: 'Changer de caméra', onPressed: () => _controller.switchCamera()),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
        child: Column(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.ink,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: AppTheme.ink, width: 2),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  alignment: Alignment.center,
                  fit: StackFit.expand,
                  children: [
                    // Vue caméra MobileScanner avec repli défensif pour le Web et Desktop
                    MobileScanner(
                      controller: _controller,
                      onDetect: _onDetect,
                      // Le viseur n'apparaît que si la caméra fonctionne (sinon il recouvrirait le message d'erreur)
                      overlayBuilder: (context, constraints) => Center(
                        child: Container(
                          width: 230,
                          height: 230,
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.mustard, width: 4),
                            borderRadius: BorderRadius.circular(28),
                          ),
                        ),
                      ),
                      errorBuilder: (context, error, child) {
                        return Container(
                          color: AppTheme.biscuit,
                          alignment: Alignment.center,
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.videocam_off_outlined, size: 48, color: AppTheme.ink),
                              const SizedBox(height: 12),
                              Text('CAMÉRA INDISPONIBLE', style: AppTheme.h3(22)),
                              const SizedBox(height: 6),
                              Text('Utilisez la saisie de secours pour valider le code à 6 chiffres.', textAlign: TextAlign.center, style: AppTheme.body(15, AppTheme.muted)),
                            ],
                          ),
                        );
                      },
                    ),
                    Positioned(
                      bottom: 16,
                      left: 16,
                      right: 16,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(color: AppTheme.ink, borderRadius: BorderRadius.circular(999), border: Border.all(color: AppTheme.cream, width: 1.5)),
                          child: Text('Pointez vers le Living Ticket', style: AppTheme.body(14, AppTheme.cream).copyWith(fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ),
                    if (_isProcessing)
                      Container(
                        color: AppTheme.ink.withOpacity(0.6),
                        child: const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppTheme.mustard))),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            GButton('Saisie de secours (6 chiffres)', icon: Icons.keyboard_rounded, variant: GVariant.cream, onPressed: _openManualDialog),
          ],
        ),
      ),
    );
  }
}
