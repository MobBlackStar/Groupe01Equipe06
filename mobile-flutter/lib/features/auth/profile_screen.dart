// 💡 Concept & Analogie : Comme la carte d'adhérent biométrique dans un club éco-responsable, cet écran résume le statut de l'utilisateur, ses badges écologiques et ses préférences d'alertes push.
// 🔄 Comparaison React / Flutter : En Flutter, les bascules d'alertes utilisent `SwitchListTile` avec la couleur `AppTheme.red` ; en React, nous utilisons des checkboxes HTML personnalisées.
// 🎯 À retenir pour la soutenance : "Cet écran mobile permet aux étudiants de suivre leur jauge d'ÉcoPoints en direct tout en personnalisant leurs canaux de notifications FCM."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import 'validators.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController(text: 'Ritej Bejaoui');
  final _phoneController = TextEditingController(text: '+21698123456');
  String _selectedFiliere = 'EBUSINESS_3A';

  bool _pushNotifications = true;
  bool _emailReceipts = true;
  bool _isSaving = false;

  final int _ecoPoints = 240;

  final List<Map<String, String>> _filieres = const [
    {'value': 'EBUSINESS_3A', 'label': '🎓 3ème E-Business'},
    {'value': 'FINANCE', 'label': '📈 Finance'},
    {'value': 'MARKETING', 'label': '🎯 Marketing'},
    {'value': 'GESTION', 'label': '📊 Gestion'},
    {'value': 'COMPTABILITE', 'label': '📑 Comptabilité'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    await Future.delayed(const Duration(milliseconds: 900));

    if (!mounted) return;
    setState(() => _isSaving = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: AppTheme.biscuit,
        content: Text(
          'Profil mis à jour avec succès !',
          style: TextStyle(color: AppTheme.red, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        title: const Text('Mon Profil', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // En-tête Profil avec Avatar
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppTheme.ink),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          color: AppTheme.cream,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.red.withOpacity(0.5)),
                        ),
                        child: const Center(
                          child: Text('🎓', style: TextStyle(fontSize: 28)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'Ritej Bejaoui',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.ink,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.red.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: AppTheme.red.withOpacity(0.4)),
                                  ),
                                  child: const Text(
                                    'ÉTUDIANTE',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.red,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'donyesbejaoui27@gmail.com',
                              style: TextStyle(fontSize: 13, color: AppTheme.muted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Carte Jauge ÉcoPoints & Palier
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppTheme.ink),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            '🌿 Palier Pousse',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.red,
                            ),
                          ),
                          Text(
                            '$_ecoPoints ÉcoPoints',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.ink,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: const LinearProgressIndicator(
                          value: 240 / 300,
                          minHeight: 10,
                          backgroundColor: AppTheme.cream,
                          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.red),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Plus que 60 points pour atteindre le palier ARBRE 🌳',
                        style: TextStyle(fontSize: 13, color: AppTheme.muted),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Formulaire Coordonnées
                AppTextField(
                  label: 'Nom & Prénom',
                  controller: _nameController,
                  validator: Validators.validateDisplayName,
                  prefixIcon: const Icon(Icons.person_outline, color: AppTheme.muted),
                ),
                const SizedBox(height: 16),

                AppTextField(
                  label: 'Téléphone Mobile',
                  controller: _phoneController,
                  validator: Validators.validatePhone,
                  prefixIcon: const Icon(Icons.phone_outlined, color: AppTheme.muted),
                ),
                const SizedBox(height: 16),

                const Text(
                  'FILIÈRE ESSECT',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppTheme.muted,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.ink),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedFiliere,
                      isExpanded: true,
                      dropdownColor: AppTheme.biscuit,
                      style: const TextStyle(color: AppTheme.ink, fontSize: 13),
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
                const SizedBox(height: 20),

                // Préférences Notifications
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppTheme.ink),
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        activeColor: AppTheme.red,
                        title: const Text('Notifications Push', style: TextStyle(fontSize: 13, color: AppTheme.ink)),
                        subtitle: const Text('Alertes offres dégressives en temps réel', style: TextStyle(fontSize: 13, color: AppTheme.muted)),
                        value: _pushNotifications,
                        onChanged: (val) => setState(() => _pushNotifications = val),
                      ),
                      const Divider(height: 1, color: AppTheme.ink),
                      SwitchListTile(
                        activeColor: AppTheme.red,
                        title: const Text('Justificatifs par Email', style: TextStyle(fontSize: 13, color: AppTheme.ink)),
                        subtitle: const Text('Reçus de paiement et billets QR', style: TextStyle(fontSize: 13, color: AppTheme.muted)),
                        value: _emailReceipts,
                        onChanged: (val) => setState(() => _emailReceipts = val),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Bouton Enregistrer
                AppButton(
                  text: 'Enregistrer les Modifications',
                  isLoading: _isSaving,
                  onPressed: _handleSave,
                ),
                const SizedBox(height: 12),

                // Bouton Déconnexion
                AppButton(
                  text: 'Se Déconnecter',
                  variant: AppButtonVariant.danger,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Déconnexion effectuée')),
                    );
                  },
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
