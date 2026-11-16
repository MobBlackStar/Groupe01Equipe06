// 💡 Concept & Analogie : Écran d'accueil et d'authentification mobile offrant une saisie sécurisée et un accès démo immédiat.
// 🔄 Comparaison React / Flutter : Équivalent Flutter de `LoginPage.jsx` avec champs Material natifs et validation inline.
// 🎯 À retenir pour la soutenance : "Cet écran propose une validation inline autonome sans dépendances externes et deux boutons 1-clic pour tester instantanément les espaces Étudiant et Commerçant sur smartphone."
// Module : Authentification & Sécurité Mobile

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  final AuthService authService;

  const LoginScreen({super.key, required this.authService});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // Validation email inline
  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'L adresse email est obligatoire';
    }
    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Format d email invalide (ex: etudiant@essect.u-tunis.tn)';
    }
    return null;
  }

  // Validation mot de passe inline
  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Le mot de passe est obligatoire';
    }
    if (value.length < 6) {
      return 'Le mot de passe doit comporter au moins 6 caractères';
    }
    return null;
  }

  Future<void> _handleLogin() async {
    setState(() => _errorMessage = null);

    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      await widget.authService.signInWithEmailAndPassword(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (mounted) {
        final role = widget.authService.role;
        if (role == 'MERCHANT') {
          context.go('/merchant');
        } else {
          context.go('/student');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Identifiants invalides ou compte inexistant';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _handleDemoLogin(String roleType) async {
    setState(() {
      _errorMessage = null;
      _isSubmitting = true;
    });

    try {
      await widget.authService.signInDemo(roleType);
      if (mounted) {
        if (roleType.toUpperCase() == 'MERCHANT') {
          context.go('/merchant');
        } else {
          context.go('/student');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Échec de la connexion démo';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const campusLime = Color(0xFFCCFF00);
    const campusDark = Color(0xFF0D0F12);
    const campusCard = Color(0xFF16191E);
    const campusBorder = Color(0xFF22272E);

    return Scaffold(
      backgroundColor: campusDark,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo et titre
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: campusLime,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: campusLime.withValues(alpha: 0.3),
                          blurRadius: 18,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'CS',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  RichText(
                    text: const TextSpan(
                      text: 'Campus',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                      children: [
                        TextSpan(
                          text: 'Save',
                          style: TextStyle(color: campusLime),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Anti-gaspillage & Solidarité à l ESSECT Montfleury',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Carte de Connexion
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: campusCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: campusBorder),
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Connexion',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),

                          if (_errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.red.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.5)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _errorMessage!,
                                      style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],

                          // Champ Email
                          const Text(
                            'EMAIL UNIVERSITAIRE',
                            style: TextStyle(
                              color: Colors.white54,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _emailController,
                            validator: _validateEmail,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              hintText: 'etudiant@essect.u-tunis.tn',
                              hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
                              filled: true,
                              fillColor: campusDark,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: campusBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: campusBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: campusLime),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Champ Mot de passe
                          const Text(
                            'MOT DE PASSE',
                            style: TextStyle(
                              color: Colors.white54,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _passwordController,
                            validator: _validatePassword,
                            obscureText: _obscurePassword,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: InputDecoration(
                              hintText: '••••••••',
                              hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
                              filled: true,
                              fillColor: campusDark,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                  color: Colors.white38,
                                  size: 18,
                                ),
                                onPressed: () {
                                  setState(() => _obscurePassword = !_obscurePassword);
                                },
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: campusBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: campusBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: campusLime),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Bouton Se Connecter
                          ElevatedButton(
                            onPressed: _isSubmitting ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: campusLime,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                            child: _isSubmitting
                                ? const SizedBox(
                                    height: 18,
                                    width: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.black,
                                    ),
                                  )
                                : const Text(
                                    'Se connecter',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Section Kit de Démonstration 1-Clic
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: campusCard.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: campusBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Row(
                          children: [
                            Text('⚡', style: TextStyle(fontSize: 14)),
                            SizedBox(width: 6),
                            Text(
                              'KIT DE DÉMONSTRATION ESSECT',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _isSubmitting ? null : () => _handleDemoLogin('student'),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: campusBorder),
                                  backgroundColor: campusDark,
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                child: const Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('🎓', style: TextStyle(fontSize: 16)),
                                    SizedBox(height: 2),
                                    Text(
                                      'Étudiant',
                                      style: TextStyle(color: campusLime, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                    Text(
                                      'Yassine (EBUS)',
                                      style: TextStyle(color: Colors.white38, fontSize: 9),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _isSubmitting ? null : () => _handleDemoLogin('merchant'),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: campusBorder),
                                  backgroundColor: campusDark,
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                child: const Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('🏪', style: TextStyle(fontSize: 16)),
                                    SizedBox(height: 2),
                                    Text(
                                      'Commerçant',
                                      style: TextStyle(color: campusLime, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                    Text(
                                      'Baguette & Bag.',
                                      style: TextStyle(color: Colors.white38, fontSize: 9),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
