// 💡 Concept & Analogie : Comme une cabine de paiement sécurisée dans laquelle l'étudiant entre pour régler en ligne avant de revenir avec son reçu validé, cette WebView isole la session bancaire Konnect.
// 🔄 Comparaison React / Flutter : En React, la passerelle Konnect redirige le navigateur vers `/payment/return` ; en Flutter, la WebView intercepte cette URL de retour pour déclencher la vérification immédiate.
// 🎯 À retenir pour la soutenance : "La WebView intercepte les URLs de redirection de Konnect (succès ou échec) sans exposer les clés bancaires, et appelle POST /payments/konnect/verify pour synchroniser le statut de la commande."
// Module : Paiement & Konnect Mobile

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/campus_api.dart';

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
        ..setBackgroundColor(const Color(0xFF0D0F12))
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
            backgroundColor: Color(0xFF34D399),
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
      SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
    );
    Navigator.of(context).pop(false);
  }

  void _handlePaymentFailed() {
    if (!mounted || _isVerifying) return;
    _isVerifying = true; // onPageStarted + onNavigationRequest peuvent tous deux intercepter la même URL

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Paiement annulé ou non complété sur la passerelle Konnect.'),
        backgroundColor: Colors.redAccent,
      ),
    );
    Navigator.of(context).pop(false);
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D0F12),
        appBar: AppBar(
          title: const Text(
            'Paiement Konnect (Aperçu Web)',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          backgroundColor: const Color(0xFF161920),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: () => Navigator.of(context).pop(false),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.payment_rounded, size: 64, color: Color(0xFFCCFF00)),
                const SizedBox(height: 16),
                const Text(
                  'Simulation Passerelle Konnect',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 8),
                Text(
                  'Règlement sécurisé pour la commande : ${widget.orderId}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: Colors.white70),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _isVerifying ? null : _handlePaymentSuccess,
                  icon: const Icon(Icons.check_circle_rounded),
                  label: Text(_isVerifying ? 'Validation...' : 'Valider le Règlement (1-Clic Démo)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFCCFF00),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0D0F12),
      appBar: AppBar(
        title: const Text(
          'Paiement Sécurisé Konnect',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF161920),
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
              color: const Color(0xFF0D0F12).withOpacity(0.85),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFCCFF00)),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _isVerifying
                          ? 'Validation de votre règlement...'
                          : 'Chargement de la passerelle bancaire...',
                      style: const TextStyle(
                        color: Colors.white,
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
