// 💡 Concept & Analogie : Le pupitre de publication d'offres est comme la craie sur l'ardoise du restaurant, modernisée pour diffuser instantanément les promotions anti-gaspillage sur les smartphones des étudiants voisins.
// 🔄 Comparaison React / Flutter : En Flutter, ce formulaire utilise un `SingleChildScrollView` avec des `TextFormField` et des commutateurs `SwitchListTile` ; en React, il correspond à `OfferFormPage.jsx`.
// 🎯 À retenir pour la soutenance : "Le commerçant peut basculer entre prix fixe ou enchère dégressive Smart Decay et activer le mode Panier Surprise en un simple glissement de bouton."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import 'ai_autofill_card.dart';

class OfferFormScreen extends StatefulWidget {
  const OfferFormScreen({super.key});

  @override
  State<OfferFormScreen> createState() => _OfferFormScreenState();
}

class _OfferFormScreenState extends State<OfferFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController(text: 'Makloub Escalope Panée');
  final _descController = TextEditingController(
      text: 'Makloub artisanal croustillant préparé le midi, frites fraîches et fromage.');
  final _originalPriceController = TextEditingController(text: '7500');
  final _targetPriceController = TextEditingController(text: '3500');
  final _quantityController = TextEditingController(text: '4');

  String _category = 'SANDWICH';
  bool _isDutch = true;
  bool _isSurprise = false;
  String _selectedPhoto = '🥪';
  bool _isSubmitting = false;

  final List<String> _categories = [
    'SANDWICH',
    'PLAT_CHAUD',
    'PIZZA',
    'VIENNOISERIE',
    'PATISSERIE',
    'SALADE',
    'SNACK',
    'MIXTE',
  ];

  final List<Map<String, String>> _photoPresets = [
    {'emoji': '🥪', 'name': 'Sandwich'},
    {'emoji': '🥖', 'name': 'Baguette'},
    {'emoji': '🍲', 'name': 'Plat Chaud'},
    {'emoji': '🍕', 'name': 'Pizza'},
    {'emoji': '🥐', 'name': 'Viennoiserie'},
    {'emoji': '🧁', 'name': 'Pâtisserie'},
    {'emoji': '🎁', 'name': 'Surprise'},
  ];

  void _applyAutofill(Map<String, dynamic> data) {
    setState(() {
      _titleController.text = data['title'] as String? ?? _titleController.text;
      _descController.text = data['description'] as String? ?? _descController.text;
      _category = data['category'] as String? ?? _category;
      _originalPriceController.text = '${data['originalPriceMillimes'] ?? 6000}';
      _targetPriceController.text = '${data['targetPriceMillimes'] ?? 3000}';
      _quantityController.text = '${data['quantity'] ?? 3}';
      _isSurprise = data['isSurpriseBasket'] as bool? ?? _isSurprise;
    });
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(milliseconds: 700));

    if (mounted) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 Offre anti-gaspillage publiée avec succès !'),
          backgroundColor: AppTheme.limeAccent,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _originalPriceController.dispose();
    _targetPriceController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text('Nouvelle Offre Anti-Gaspi', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Assistant IA
                AiAutofillCard(onAutofill: _applyAutofill),
                const SizedBox(height: 24),

                const Text(
                  'Détails de l Offre',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),

                // Titre
                AppTextField(
                  label: 'Titre de l offre',
                  hint: 'Ex: Baguette farcie escalope',
                  controller: _titleController,
                  validator: (v) => (v == null || v.isEmpty) ? 'Le titre est obligatoire' : null,
                ),
                const SizedBox(height: 14),

                // Description
                AppTextField(
                  label: 'Description détaillée',
                  hint: 'Ingrédients, allergènes...',
                  controller: _descController,
                  maxLines: 2,
                ),
                const SizedBox(height: 14),

                // Catégorie
                const Text('Catégorie', style: TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _category,
                      isExpanded: true,
                      dropdownColor: AppTheme.surfaceCard,
                      items: _categories.map((c) {
                        return DropdownMenuItem(
                          value: c,
                          child: Text(c, style: const TextStyle(color: Colors.white, fontSize: 13)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _category = val);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Illustration rapide
                const Text('Visuel rapide', style: TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: _photoPresets.map((p) {
                    final isSel = _selectedPhoto == p['emoji'];
                    return GestureDetector(
                      onTap: () => setState(() => _selectedPhoto = p['emoji']!),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isSel ? AppTheme.limeAccent.withOpacity(0.2) : AppTheme.surfaceCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSel ? AppTheme.limeAccent : Colors.white10,
                          ),
                        ),
                        child: Text(p['emoji']!, style: const TextStyle(fontSize: 22)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Tarification & Smart Decay
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text(
                          '⚡ Enchère Dégressive (Smart Decay)',
                          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'Le prix baisse automatiquement vers le plancher jusqu à fermeture.',
                          style: TextStyle(color: Colors.white60, fontSize: 11),
                        ),
                        value: _isDutch,
                        activeColor: AppTheme.limeAccent,
                        onChanged: (val) => setState(() => _isDutch = val),
                      ),
                      const Divider(color: Colors.white10),
                      Row(
                        children: [
                          Expanded(
                            child: AppTextField(
                              label: 'Prix initial (millimes)',
                              hint: '7500',
                              controller: _originalPriceController,
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: AppTextField(
                              label: _isDutch ? 'Prix plancher (min)' : 'Prix réduit',
                              hint: '3500',
                              controller: _targetPriceController,
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Panier Surprise Toggle
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text(
                      '🎁 Panier Surprise (Mystery Box)',
                      style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    subtitle: const Text(
                      'Idéal pour écouler des assortiments variés avec note de rareté.',
                      style: TextStyle(color: Colors.white60, fontSize: 11),
                    ),
                    value: _isSurprise,
                    activeColor: Colors.amber,
                    onChanged: (val) => setState(() => _isSurprise = val),
                  ),
                ),
                const SizedBox(height: 16),

                // Quantité
                AppTextField(
                  label: 'Nombre de portions disponibles',
                  hint: '4',
                  controller: _quantityController,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 30),

                // Bouton Publication
                AppButton(
                  text: _isSubmitting ? 'Publication...' : '🚀 Publier l Offre Anti-Gaspi',
                  backgroundColor: AppTheme.limeAccent,
                  textColor: Colors.black,
                  onPressed: _isSubmitting ? null : _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
