// 💡 Concept & Analogie : Comme le tiroir de rangement ergonomique qui glisse depuis le bas de l'écran tactile, ce volet permet d'ajuster finement les critères de recherche sans quitter la vue des résultats.
// 🔄 Comparaison React / Flutter : En Flutter, il s'ouvre via `showModalBottomSheet` ; en React, il correspond à `FilterPanel.jsx`.
// 🎯 À retenir pour la soutenance : "Une expérience mobile fluide grâce à une feuille de filtres modale optimisée pour l'usage à une main sur smartphone."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../widgets/griddle.dart';

const int kMobileMaxBudgetUnlimited = 20000;

class FilterBottomSheet extends StatefulWidget {
  final String selectedCategory;
  final String selectedMerchant;
  final List<({String name, int count})> merchants;
  final int maxPriceMillimes;
  final bool surpriseOnly;
  final String sortBy;
  final Function({
    required String category,
    required String merchant,
    required int maxPriceMillimes,
    required bool surpriseOnly,
    required String sortBy,
  }) onApply;

  const FilterBottomSheet({
    super.key,
    required this.selectedCategory,
    this.selectedMerchant = 'ALL',
    this.merchants = const [],
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
  late String _merchant;
  late double _maxPrice;
  late bool _surpriseOnly;
  late String _sortBy;

  static const List<Map<String, String>> _categories = [
    {'id': 'ALL', 'label': 'Toutes catégories'},
    {'id': 'SANDWICH', 'label': 'Sandwichs'},
    {'id': 'PLAT_CHAUD', 'label': 'Plats chauds'},
    {'id': 'PIZZA', 'label': 'Pizzas'},
    {'id': 'VIENNOISERIE', 'label': 'Viennoiseries'},
    {'id': 'PATISSERIE', 'label': 'Pâtisseries'},
    {'id': 'SALADE', 'label': 'Salades'},
    {'id': 'SNACK', 'label': 'Snacks & frites'},
    {'id': 'BOISSON', 'label': 'Boissons'},
    {'id': 'MIXTE', 'label': 'Paniers mixtes'},
  ];

  @override
  void initState() {
    super.initState();
    _category = widget.selectedCategory;
    _merchant = widget.selectedMerchant;
    _maxPrice = widget.maxPriceMillimes.clamp(1000, kMobileMaxBudgetUnlimited).toDouble();
    _surpriseOnly = widget.surpriseOnly;
    _sortBy = widget.sortBy;
  }

  @override
  Widget build(BuildContext context) {
    final isUnlimited = _maxPrice.toInt() >= kMobileMaxBudgetUnlimited;

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.cream,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: AppTheme.ink, width: 2),
          left: BorderSide(color: AppTheme.ink, width: 2),
          right: BorderSide(color: AppTheme.ink, width: 2),
        ),
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
                        _merchant = 'ALL';
                        _maxPrice = kMobileMaxBudgetUnlimited.toDouble();
                        _surpriseOnly = false;
                        _sortBy = 'distance';
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 18),

              if (widget.merchants.isNotEmpty) ...[
                Text('ÉTABLISSEMENT', style: AppTheme.label()),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    GChip('Tous', selected: _merchant == 'ALL', onTap: () => setState(() => _merchant = 'ALL')),
                    for (final m in widget.merchants)
                      GChip(
                        '${m.name} (${m.count})',
                        selected: _merchant == m.name,
                        onTap: () => setState(() => _merchant = _merchant == m.name ? 'ALL' : m.name),
                      ),
                  ],
                ),
                const SizedBox(height: 22),
              ],

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
                  Text(
                    isUnlimited ? 'Tout budget' : Money.formatTND(_maxPrice.toInt()),
                    style: AppTheme.figure(34, isUnlimited ? AppTheme.ink : AppTheme.red),
                  ),
                ],
              ),
              Slider(
                value: _maxPrice,
                min: 1000,
                max: kMobileMaxBudgetUnlimited.toDouble(),
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
                    merchant: _merchant,
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
