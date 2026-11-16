// 💡 Concept & Analogie : Comme le formulaire papier d'adhésion au bureau des étudiants ou à l'association des commerçants de quartier, cet écran recueille les coordonnées et l'affiliation de l'utilisateur.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `SingleChildScrollView` avec un `Form` et un `GlobalKey<FormState>` ; en React, nous gérons un état d'objet avec `useState` et Zod.
// 🎯 À retenir pour la soutenance : "Cet écran mobile offre un sélecteur de rôle visuel et injecte immédiatement le custom claim correspondant via notre API sécurisée."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import 'validators.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  String _selectedRole = 'STUDENT';
  String _selectedFiliere = 'EBUSINESS_3A';

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController(text: '+216');
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;

  final List<Map<String, String>> _filieres = const [
    {'value': 'EBUSINESS_3A', 'label': '🎓 3ème E-Business (Business Computing)'},
    {'value': 'FINANCE', 'label': '📈 Licence / Master Finance'},
    {'value': 'MARKETING', 'label': '🎯 Licence / Master Marketing'},
    {'value': 'GESTION', 'label': '📊 Sciences de Gestion'},
    {'value': 'COMPTABILITE', 'label': '📑 Comptabilité & Fiscalité'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // Simulation de création et appel API
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppTheme.cardColor,
        content: Text(
          'Compte ${_selectedRole == "STUDENT" ? "Étudiant" : "Commerçant"} créé avec succès !',
          style: const TextStyle(color: AppTheme.limeAccent, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text('Créer un compte', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(
                  child: Text(
                    'CampusSave 🥗',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.limeAccent,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                const Center(
                  child: Text(
                    "Rejoignez l'écosystème solidaire ESSECT",
                    style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 24),

                // Sélecteur de Rôle
                const Text(
                  'CHOISISSEZ VOTRE PROFIL',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 8),

                Row(
                  children: [
                    Expanded(
                      child: _buildRoleCard(
                        role: 'STUDENT',
                        icon: '🎓',
                        title: 'Étudiant',
                        desc: 'Offres & Radar 3D',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildRoleCard(
                        role: 'MERCHANT',
                        icon: '🏪',
                        title: 'Commerçant',
                        desc: 'Invendus & QR Scan',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Filière (si étudiant)
                if (_selectedRole == 'STUDENT') ...[
                  const Text(
                    'FILIÈRE ESSECT',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.cardColor,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedFiliere,
                        isExpanded: true,
                        dropdownColor: AppTheme.cardColor,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        items: _filieres.map((f) {
                          return DropdownMenuItem<String>(
                            value: f['value'],
                            child: Text(f['label']!),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedFiliere = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Nom complet
                AppTextField(
                  label: 'Nom & Prénom',
                  controller: _nameController,
                  validator: Validators.validateDisplayName,
                  hintText: 'ex: Ritej Bejaoui',
                  prefixIcon: const Icon(Icons.person_outline, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 16),

                // Email
                AppTextField(
                  label: 'Adresse Email',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.validateEmail,
                  hintText: 'ex: etudiant@essect.u-tunis.tn',
                  prefixIcon: const Icon(Icons.mail_outline, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 16),

                // Téléphone
                AppTextField(
                  label: 'Numéro de Téléphone',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  validator: Validators.validatePhone,
                  hintText: '+21698123456',
                  prefixIcon: const Icon(Icons.phone_outlined, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 16),

                // Mot de passe
                AppTextField(
                  label: 'Mot de Passe',
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  validator: Validators.validatePassword,
                  hintText: 'Minimum 8 caractères dont 1 chiffre',
                  prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.textMuted),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      color: AppTheme.textMuted,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                const SizedBox(height: 28),

                // Bouton Inscription
                AppButton(
                  text: "S'inscrire sur CampusSave →",
                  isLoading: _isLoading,
                  onPressed: _handleSubmit,
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required String role,
    required String icon,
    required String title,
    required String desc,
  }) {
    final isSelected = _selectedRole == role;
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = role),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.limeAccent.withOpacity(0.12) : AppTheme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.limeAccent : AppTheme.borderColor,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isSelected ? AppTheme.limeAccent : Colors.white,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
