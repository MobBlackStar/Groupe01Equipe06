// 💡 Concept & Analogie : Comme le premier passage au bureau des inscriptions où le restaurateur présente sa carte professionnelle et son bail commercial, cet écran recueille les coordonnées de la boutique et vérifie qu'elle se trouve bien dans le rayon piétonnier des étudiants.
// 🔄 Comparaison React / Flutter : En Flutter, le calcul de la distance orthodromique de Haversine s'effectue directement dans une méthode de calcul locale réactive à chaque saisie ; en React, nous importons le même algorithme depuis `@shared/geo.js`.
// 🎯 À retenir pour la soutenance : "L'application mobile calcule en temps réel la distance à vol d'oiseau de l'ESSECT et affiche une alerte immédiate si le commerce dépasse le périmètre d'éligibilité de 3 000 mètres."

import 'dart:math';
import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../auth/validators.dart';

class MerchantOnboardingScreen extends StatefulWidget {
  const MerchantOnboardingScreen({super.key});

  @override
  State<MerchantOnboardingScreen> createState() => _MerchantOnboardingScreenState();
}

class _MerchantOnboardingScreenState extends State<MerchantOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _phoneController = TextEditingController(text: '+216');
  final _streetController = TextEditingController(text: 'Avenue Habib Bourguiba');
  final _hoursController = TextEditingController(text: '08:00 - 21:00');

  String _selectedType = 'FAST_FOOD';
  double _lat = 36.7885;
  double _lng = 10.1762;
  bool _isLoading = false;

  static const double essectLat = 36.7871;
  static const double essectLng = 10.1748;

  final List<Map<String, String>> _types = const [
    {'value': 'FAST_FOOD', 'label': '🍔 Sandwicherie & Fast-Food'},
    {'value': 'RESTAURANT', 'label': '🍽️ Restaurant Traditionnel'},
    {'value': 'CAFETERIA', 'label': '☕ Cafétéria & Salon de Thé'},
    {'value': 'BOULANGERIE', 'label': '🥖 Boulangerie Artisanale'},
    {'value': 'PATISSERIE', 'label': '🧁 Pâtisserie & Douceurs'},
  ];

  final List<Map<String, dynamic>> _presets = const [
    {'name': 'Avenue Habib Bourguiba', 'lat': 36.7885, 'lng': 10.1762},
    {'name': "Rue de l'ESSECT", 'lat': 36.7865, 'lng': 10.1739},
    {'name': 'Rue de la République', 'lat': 36.7892, 'lng': 10.1725},
    {'name': 'Avenue Taha Hussein', 'lat': 36.7848, 'lng': 10.1771},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _hoursController.dispose();
    super.dispose();
  }

  // Calcul Haversine en mètres
  int _calculateDistance() {
    const double earthRadius = 6371000;
    final dLat = (_lat - essectLat) * pi / 180;
    final dLng = (_lng - essectLng) * pi / 180;

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(essectLat * pi / 180) *
            cos(_lat * pi / 180) *
            sin(dLng / 2) *
            sin(dLng / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return (earthRadius * c).round();
  }

  int _calculateWalkingMinutes(int meters) {
    if (meters <= 0) return 0;
    final urbanMeters = meters * 1.3;
    final metersPerMinute = 5000 / 60;
    return max(1, (urbanMeters / metersPerMinute).round());
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final dist = _calculateDistance();
    if (dist > 3000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppTheme.red,
          content: Text("L'établissement est au-delà du rayon autorisé de 3 000 m de l'ESSECT"),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: AppTheme.biscuit,
        content: Text(
          'Dossier soumis avec succès ! Statut en attente d instruction.',
          style: TextStyle(color: AppTheme.red, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dist = _calculateDistance();
    final walkingMins = _calculateWalkingMinutes(dist);
    final isEligible = dist <= 3000;

    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        title: const Text('Adhésion Commerçant', style: TextStyle(fontWeight: FontWeight.bold)),
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
                const Text(
                  'ENREGISTRER VOTRE ÉTABLISSEMENT',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppTheme.red,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Rejoignez le réseau anti-gaspi de Montfleury',
                  style: TextStyle(fontSize: 14, color: AppTheme.muted),
                ),
                const SizedBox(height: 20),

                // Nom de l'enseigne
                AppTextField(
                  label: "Nom de l'Enseigne",
                  controller: _nameController,
                  validator: (val) {
                    if (val == null || val.trim().length < 2) {
                      return "Le nom de l'enseigne est obligatoire (min 2 car.)";
                    }
                    return null;
                  },
                  hintText: 'ex: Baguette & Baguette Montfleury',
                  prefixIcon: const Icon(Icons.storefront_outlined, color: AppTheme.muted),
                ),
                const SizedBox(height: 16),

                // Type d'établissement
                const Text(
                  'TYPE D ÉTABLISSEMENT',
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
                      value: _selectedType,
                      isExpanded: true,
                      dropdownColor: AppTheme.biscuit,
                      style: const TextStyle(color: AppTheme.ink, fontSize: 13),
                      items: _types.map((t) {
                        return DropdownMenuItem<String>(
                          value: t['value'],
                          child: Text(t['label']!),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedType = val);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Téléphone
                AppTextField(
                  label: 'Téléphone Professionnel',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  validator: Validators.validatePhone,
                  hintText: '+21671390111',
                  prefixIcon: const Icon(Icons.phone_outlined, color: AppTheme.muted),
                ),
                const SizedBox(height: 16),

                // Description
                AppTextField(
                  label: 'Description & Spécialités',
                  controller: _descController,
                  validator: (val) => val == null || val.trim().isEmpty ? 'La description est requise' : null,
                  hintText: 'Spécialités appréciées des étudiants...',
                  prefixIcon: const Icon(Icons.description_outlined, color: AppTheme.muted),
                ),
                const SizedBox(height: 20),

                // Emplacement Montfleury
                const Text(
                  'EMPLACEMENT GÉOGRAPHIQUE MONTFLEURY',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppTheme.muted,
                  ),
                ),
                const SizedBox(height: 8),

                // Presets rapides
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _presets.map((p) {
                    final isSel = _lat == p['lat'] && _lng == p['lng'];
                    return ChoiceChip(
                      label: Text(p['name']),
                      selected: isSel,
                      selectedColor: AppTheme.red,
                      labelStyle: TextStyle(
                        fontSize: 13,
                        color: isSel ? Colors.black : AppTheme.ink,
                        fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                      ),
                      backgroundColor: AppTheme.biscuit,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _streetController.text = p['name'];
                            _lat = p['lat'];
                            _lng = p['lng'];
                          });
                        }
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),

                AppTextField(
                  label: 'Adresse & Rue',
                  controller: _streetController,
                  prefixIcon: const Icon(Icons.location_on_outlined, color: AppTheme.muted),
                ),
                const SizedBox(height: 12),

                // Jauge de distance Haversine
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isEligible ? AppTheme.red.withOpacity(0.1) : AppTheme.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isEligible ? AppTheme.red.withOpacity(0.4) : AppTheme.red,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isEligible ? Icons.check_circle_outline : Icons.error_outline,
                        color: isEligible ? AppTheme.red : AppTheme.red,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Distance ESSECT : $dist m (~$walkingMins min à pied)',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: isEligible ? AppTheme.ink : AppTheme.red,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isEligible ? 'Éligible au réseau piéton (≤ 3 000 m)' : 'Hors périmètre autorisé',
                              style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                AppButton(
                  text: 'Déposer ma candidature ESSECT →',
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
}
