// 💡 Concept & Analogie : Comme une cabine de paiement sécurisée dans laquelle l'étudiant entre pour régler en ligne avant de revenir avec son reçu validé, cette WebView isole la session bancaire Konnect.
// 🔄 Comparaison React / Flutter : En React, la passerelle Konnect redirige le navigateur vers `/payment/return` ; en Flutter, la WebView intercepte cette URL de retour pour déclencher la vérification immédiate.
// 🎯 À retenir pour la soutenance : "La WebView intercepte les URLs de redirection de Konnect (succès ou échec) sans exposer les clés bancaires, et appelle POST /payments/konnect/verify pour synchroniser le statut de la commande."
// Module : Paiement & Konnect Mobile

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/campus_api.dart';

import '../../app/theme.dart';
import '../../widgets/griddle.dart';
class PaymentWebViewScreen extends StatefulWidget {
  final String payUrl;
  final String orderId;

  /// Référence renvoyée par `POST /payments/konnect/init` ; transmise à la vérification seulement si présente.
  final String? paymentRef;

  const PaymentWebViewScreen({
    super.key,
    required this.payUrl,
    required this.orderId,
    this.paymentRef,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  WebViewController? _webViewController;
  bool _isLoading = true;
  bool _isVerifying = false;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _initWebView();
    } else {
      _isLoading = false;
    }
  }

  void _initWebView() {
    try {
      _webViewController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(AppTheme.cream)
        ..setNavigationDelegate(
          NavigationDelegate(
            onProgress: (progress) {
              if (progress == 100 && mounted) {
                setState(() {
                  _isLoading = false;
                });
              }
            },
            onPageStarted: (url) {
              if (mounted) {
                setState(() {
                  _isLoading = true;
                });
              }
              _checkInterceptUrl(url);
            },
            onPageFinished: (url) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                });
              }
            },
            onNavigationRequest: (request) {
              final isIntercepted = _checkInterceptUrl(request.url);
              if (isIntercepted) {
                return NavigationDecision.prevent;
              }
              return NavigationDecision.navigate;
            },
          ),
        )
        ..loadRequest(Uri.parse(widget.payUrl));
    } catch (_) {
      _isLoading = false;
    }
  }

  bool _checkInterceptUrl(String url) {
    if (url.contains('payment/return') || url.contains('o=${widget.orderId}')) {
      final uri = Uri.parse(url);
      final isFailed = uri.queryParameters['failed'] == '1' || url.contains('failed=1');

      if (isFailed) {
        _handlePaymentFailed();
      } else {
        _handlePaymentSuccess();
      }
      return true;
    }
    return false;
  }

  /// Retour de passerelle : le serveur reste seul juge. `confirmed:false` ou une erreur ne sont JAMAIS un succès.
  Future<void> _handlePaymentSuccess() async {
    if (_isVerifying) return;
    setState(() {
      _isVerifying = true;
    });

    try {
      final confirmed = await CampusApi.shared.verifyPayment(widget.orderId, paymentRef: widget.paymentRef);
      if (!mounted) return;
      if (confirmed) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Paiement validé avec succès ! Votre Living Ticket est prêt.'),
            backgroundColor: AppTheme.leaf,
          ),
        );
        Navigator.of(context).pop(true);
      } else {
        _failVerification("Le paiement n'est pas encore confirmé par la passerelle.");
      }
    } catch (e) {
      if (!mounted) return;
      _failVerification(e.toString());
    }
  }

  void _failVerification(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppTheme.red),
    );
    Navigator.of(context).pop(false);
  }

  void _handlePaymentFailed() {
    if (!mounted || _isVerifying) return;
    _isVerifying = true; // onPageStarted + onNavigationRequest peuvent tous deux intercepter la même URL

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Paiement annulé ou non complété sur la passerelle Konnect.'),
        backgroundColor: AppTheme.red,
      ),
    );
    Navigator.of(context).pop(false);
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return Scaffold(
        backgroundColor: AppTheme.cream,
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            children: [
              Align(alignment: Alignment.centerLeft, child: GIconButton(icon: Icons.close, tooltip: 'Fermer', onPressed: () => Navigator.of(context).pop(false))),
              const SizedBox(height: 14),
              const GPageHeader(eyebrow: 'Aperçu web · Konnect', title: 'Paiement', titleSize: 58, lead: 'La passerelle réelle s\'ouvre dans l\'application mobile. Ici, la validation est simulée pour la démonstration.'),
              const SizedBox(height: 22),
              GCard(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    const Icon(Icons.lock_outline, color: AppTheme.red, size: 30),
                    const SizedBox(width: 14),
                    Expanded(child: Text('Commande ${widget.orderId}', style: AppTheme.mono(14).copyWith(fontWeight: FontWeight.w700))),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              GButton(_isVerifying ? 'Validation…' : 'Valider le règlement (démo)', icon: Icons.check_circle_outline, loading: _isVerifying, onPressed: _isVerifying ? null : _handlePaymentSuccess),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        title: const Text(
          'Paiement Sécurisé Konnect',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppTheme.biscuit,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(false),
        ),
      ),
      body: Stack(
        children: [
          if (_webViewController != null)
            WebViewWidget(controller: _webViewController!),

          if (_isLoading || _isVerifying)
            Container(
              color: AppTheme.cream.withOpacity(0.85),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.red),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _isVerifying
                          ? 'Validation de votre règlement...'
                          : 'Chargement de la passerelle bancaire...',
                      style: const TextStyle(
                        color: AppTheme.ink,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
