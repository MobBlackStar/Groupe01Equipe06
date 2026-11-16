// 💡 Concept & Analogie : Comme le tiroir de rangement ergonomique qui glisse depuis le bas de l'écran tactile, ce volet permet d'ajuster finement les critères de recherche sans quitter la vue des résultats.
// 🔄 Comparaison React / Flutter : En Flutter, il s'ouvre via `showModalBottomSheet` avec un `StatefulBuilder` pour mettre à jour les curseurs en direct ; en React, il correspond à `FilterPanel.jsx`.
// 🎯 À retenir pour la soutenance : "Une expérience mobile fluide grâce à une feuille de filtres modale optimisée pour l'usage à une main sur smartphone."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../widgets/app_button.dart';

class FilterBottomSheet extends StatefulWidget {
  final String selectedCategory;
  final int maxPriceMillimes;
  final bool surpriseOnly;
  final String sortBy;
  final Function({
    required String category,
    required int maxPriceMillimes,
    required bool surpriseOnly,
    required String sortBy,
  }) onApply;

  const FilterBottomSheet({
    super.key,
    required this.selectedCategory,
    required this.maxPriceMillimes,
    required this.surpriseOnly,
    required this.sortBy,
    required this.onApply,
  });

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late String _category;
  late double _maxPrice;
  late bool _surpriseOnly;
  late String _sortBy;

  final List<Map<String, String>> _categories = [
    {'id': 'ALL', 'label': 'Tous', 'icon': '🍽️'},
    {'id': 'SANDWICH', 'label': 'Sandwiches', 'icon': '🥪'},
    {'id': 'PLAT_CHAUD', 'label': 'Plats Chauds', 'icon': '🍲'},
    {'id': 'PIZZA', 'label': 'Pizzas', 'icon': '🍕'},
    {'id': 'VIENNOISERIE', 'label': 'Viennoiseries', 'icon': '🥐'},
    {'id': 'PATISSERIE', 'label': 'Pâtisseries', 'icon': '🧁'},
    {'id': 'SALADE', 'label': 'Salades', 'icon': '🥗'},
    {'id': 'MIXTE', 'label': 'Paniers Mixtes', 'icon': '🎁'},
  ];

  @override
  void initState() {
    super.initState();
    _category = widget.selectedCategory;
    _maxPrice = widget.maxPriceMillimes.toDouble();
    _surpriseOnly = widget.surpriseOnly;
    _sortBy = widget.sortBy;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.darkBackground,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Poignée de glissement
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Titre et réinitialiser
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filtres de recherche',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _category = 'ALL';
                        _maxPrice = 15000;
                        _surpriseOnly = false;
                        _sortBy = 'distance';
                      });
                    },
                    child: const Text('Réinitialiser', style: TextStyle(color: AppTheme.limeAccent, fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // 1. Catégories
              const Text('Catégories', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _categories.map((c) {
                  final isSelected = _category == c['id'];
                  return ChoiceChip(
                    label: Text('${c['icon']} ${c['label']}'),
                    selected: isSelected,
                    onSelected: (val) {
                      if (val) setState(() => _category = c['id']!);
                    },
                    selectedColor: AppTheme.limeAccent,
                    backgroundColor: AppTheme.surfaceCard,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.black : Colors.white,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // 2. Budget Maximum
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Budget Maximum', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                  Text(
                    Money.formatTND(_maxPrice.toInt()),
                    style: const TextStyle(color: AppTheme.limeAccent, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Slider(
                value: _maxPrice,
                min: 1000,
                max: 20000,
                divisions: 19,
                activeColor: AppTheme.limeAccent,
                inactiveColor: Colors.white12,
                onChanged: (val) => setState(() => _maxPrice = val),
              ),
              const SizedBox(height: 12),

              // 3. Tri
              const Text('Trier par', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(
                children: [
                  _buildSortOption('distance', '📍 Proximité'),
                  const SizedBox(width: 8),
                  _buildSortOption('price', '💰 Prix bas'),
                  const SizedBox(width: 8),
                  _buildSortOption('ending', '⏳ Urgence'),
                ],
              ),
              const SizedBox(height: 16),

              // 4. Panier Surprise Switch
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('🎁 Paniers Surprise uniquement', style: TextStyle(color: Colors.white, fontSize: 13)),
                value: _surpriseOnly,
                activeColor: AppTheme.limeAccent,
                onChanged: (val) => setState(() => _surpriseOnly = val),
              ),
              const SizedBox(height: 20),

              // Bouton Appliquer
              AppButton(
                text: 'Appliquer les filtres',
                backgroundColor: AppTheme.limeAccent,
                textColor: Colors.black,
                onPressed: () {
                  widget.onApply(
                    category: _category,
                    maxPriceMillimes: _maxPrice.toInt(),
                    surpriseOnly: _surpriseOnly,
                    sortBy: _sortBy,
                  );
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSortOption(String id, String label) {
    final isSelected = _sortBy == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _sortBy = id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.limeAccent : AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? AppTheme.limeAccent : Colors.white10),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.black : Colors.white70,
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
