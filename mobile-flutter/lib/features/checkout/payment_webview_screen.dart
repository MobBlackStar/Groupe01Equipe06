// 💡 Concept & Analogie : Comme une cabine de paiement sécurisée dans laquelle l'étudiant entre pour régler en ligne avant de revenir avec son reçu validé, cette WebView isole la session bancaire Konnect.
// 🔄 Comparaison React / Flutter : En React, la passerelle Konnect redirige le navigateur vers `/payment/return` ; en Flutter, la WebView intercepte cette URL de retour pour déclencher la vérification immédiate.
// 🎯 À retenir pour la soutenance : "La WebView intercepte les URLs de redirection de Konnect (succès ou échec) sans exposer les clés bancaires, et appelle POST /payments/konnect/verify pour synchroniser le statut de la commande."
// Module : Paiement & Konnect Mobile

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String payUrl;
  final String orderId;

  const PaymentWebViewScreen({
    super.key,
    required this.payUrl,
    required this.orderId,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _webViewController;
  bool _isLoading = true;
  bool _isVerifying = false;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  void _initWebView() {
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
  }

  bool _checkInterceptUrl(String url) {
    // Interception de l'URL de retour configurée lors de l'init Konnect
    // Exemple : {WEB_APP_URL}/payment/return?o={orderId} ou ?o={orderId}&failed=1
    if (url.contains('payment/return') || url.contains('o=${widget.orderId}')) {
      final uri = Uri.parse(url);
      final isFailed = uri.queryParameters['failed'] == '1' ||
          uri.queryParameters['status'] == 'failed' ||
          uri.queryParameters['status'] == 'canceled';

      if (isFailed) {
        _handlePaymentFailed();
      } else {
        _verifyPaymentOnBackend();
      }
      return true;
    }
    return false;
  }

  Future<void> _verifyPaymentOnBackend() async {
    if (_isVerifying) return;
    setState(() {
      _isVerifying = true;
    });

    try {
      await ApiClient.dio.post(
        Endpoints.verifyPayment,
        data: {'orderId': widget.orderId},
      );

      if (!mounted) return;
      // Succès : retour avec code confirmation true
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isVerifying = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vérification du paiement en attente : $e'),
          backgroundColor: Colors.amber.shade800,
        ),
      );
      Navigator.of(context).pop(false);
    }
  }

  void _handlePaymentFailed() {
    if (!mounted) return;
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
          WebViewWidget(controller: _webViewController),

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
