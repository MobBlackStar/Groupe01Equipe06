// 💡 Concept & Analogie : Comme le tiroir de rangement ergonomique qui glisse depuis le bas de l'écran tactile, ce volet permet d'ajuster finement les critères de recherche sans quitter la vue des résultats.
// 🔄 Comparaison React / Flutter : En Flutter, il s'ouvre via `showModalBottomSheet` avec un `StatefulBuilder` pour mettre à jour les curseurs en direct ; en React, il correspond à `FilterPanel.jsx`.
// 🎯 À retenir pour la soutenance : "Une expérience mobile fluide grâce à une feuille de filtres modale optimisée pour l'usage à une main sur smartphone."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../widgets/griddle.dart';

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
        color: AppTheme.cream,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: AppTheme.ink, width: 2), left: BorderSide(color: AppTheme.ink, width: 2), right: BorderSide(color: AppTheme.ink, width: 2)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(color: AppTheme.ink, borderRadius: BorderRadius.circular(3)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: Text('FILTRES', style: AppTheme.display(44))),
                  GButton(
                    'Réinitialiser',
                    variant: GVariant.cream,
                    small: true,
                    expand: false,
                    onPressed: () {
                      setState(() {
                        _category = 'ALL';
                        _maxPrice = 15000;
                        _surpriseOnly = false;
                        _sortBy = 'distance';
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 18),

              Text('CATÉGORIE', style: AppTheme.label()),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _categories
                    .map((c) => GChip('${c['label']}', selected: _category == c['id'], onTap: () => setState(() => _category = c['id']!)))
                    .toList(),
              ),
              const SizedBox(height: 22),

              Row(
                children: [
                  Expanded(child: Text('BUDGET MAXIMUM', style: AppTheme.label())),
                  Text(Money.formatTND(_maxPrice.toInt()), style: AppTheme.figure(34, AppTheme.red)),
                ],
              ),
              Slider(
                value: _maxPrice,
                min: 1000,
                max: 20000,
                divisions: 19,
                activeColor: AppTheme.red,
                inactiveColor: AppTheme.sand,
                onChanged: (val) => setState(() => _maxPrice = val),
              ),
              const SizedBox(height: 10),

              Text('TRIER PAR', style: AppTheme.label()),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  GChip('Proximité', icon: Icons.place_outlined, selected: _sortBy == 'distance', onTap: () => setState(() => _sortBy = 'distance')),
                  GChip('Prix bas', icon: Icons.sell_outlined, selected: _sortBy == 'price', onTap: () => setState(() => _sortBy = 'price')),
                  GChip('Urgence', icon: Icons.timer_outlined, selected: _sortBy == 'ending', onTap: () => setState(() => _sortBy = 'ending')),
                ],
              ),
              const SizedBox(height: 18),

              GCard(
                padding: const EdgeInsets.fromLTRB(16, 6, 8, 6),
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text('Paniers surprise uniquement', style: AppTheme.body(16).copyWith(fontWeight: FontWeight.w700)),
                  value: _surpriseOnly,
                  activeColor: AppTheme.red,
                  onChanged: (val) => setState(() => _surpriseOnly = val),
                ),
              ),
              const SizedBox(height: 20),

              GButton(
                'Appliquer les filtres',
                icon: Icons.check,
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
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
