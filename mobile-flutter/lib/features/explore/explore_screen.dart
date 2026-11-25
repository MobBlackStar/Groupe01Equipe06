// 💡 Concept & Analogie : Comme le hall d'accueil de la cafétéria de l'ESSECT affichant les offres de sauvetage disponibles à la sortie des amphis.
// 🔄 Comparaison React / Flutter : En Flutter, cet écran utilise un `RefreshIndicator` et des filtres unifiés identiques à `BrowsePage.jsx` ; recherche, commerce, catégories, budget et tri fonctionnent ensemble.
// 🎯 À retenir pour la soutenance : "L'écran d'exploration mobile offre une fluidité native avec filtrage multi-critères par commerce, catégorie, budget et tri en temps réel."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/config/env.dart';
import '../../core/domain/money.dart';
import '../../core/domain/pricing.dart';
import '../../core/models/offer_model.dart';
import '../../core/time/server_clock.dart';
import '../../services/campus_api.dart';
import '../../widgets/offer_card.dart';
import '../../widgets/griddle.dart';
import 'filter_bottom_sheet.dart';
import 'offer_detail_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final _searchController = TextEditingController();

  String _selectedCategory = 'ALL';
  String _selectedMerchant = 'ALL';
  int _maxPriceMillimes = kMobileMaxBudgetUnlimited;
  bool _surpriseOnly = false;
  String _sortBy = 'distance';

  // Catalogue réel chargé depuis `GET /offers` (identifiants réels, requis pour réserver)
  List<OfferModel> _allOffers = [];
  bool _isLoading = true;
  String? _loadError;

  static const Map<String, String> _categoryLabels = {
    'ALL': 'Toutes catégories',
    'SANDWICH': 'Sandwichs',
    'PLAT_CHAUD': 'Plats chauds',
    'PIZZA': 'Pizzas',
    'VIENNOISERIE': 'Viennoiseries',
    'PATISSERIE': 'Pâtisseries',
    'SALADE': 'Salades',
    'SNACK': 'Snacks & frites',
    'BOISSON': 'Boissons',
    'MIXTE': 'Paniers mixtes',
  };

  static const List<String> _categoryOrder = [
    'ALL',
    'SANDWICH',
    'PLAT_CHAUD',
    'PIZZA',
    'VIENNOISERIE',
    'PATISSERIE',
    'SALADE',
    'SNACK',
    'BOISSON',
    'MIXTE',
  ];

  @override
  void initState() {
    super.initState();
    _loadOffers();
  }

  Future<void> _loadOffers() async {
    if (Env.useMocks) {
      setState(() {
        _allOffers = const [];
        _isLoading = false;
        _loadError = null;
      });
      return;
    }
    try {
      final offers = await CampusApi.shared.fetchOffers();
      if (!mounted) return;
      setState(() {
        _allOffers = offers;
        _isLoading = false;
        _loadError = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _loadError = e.toString();
      });
    }
  }

  int _unitPriceFor(OfferModel offer, int nowMs) {
    final isDutch = offer.pricingType == 'DUTCH' || offer.pricingType == Pricing.modeDutchAuction;
    final computed = Pricing.computeUnitPrice(
      mode: isDutch ? Pricing.modeDutchAuction : Pricing.modeFixed,
      discountedPriceMillimes: offer.targetPriceMillimes,
      startPriceMillimes: offer.startPriceMillimes ?? offer.originalPriceMillimes,
      floorPriceMillimes: offer.targetPriceMillimes,
      decayStartMs: offer.pickupStartAt.millisecondsSinceEpoch,
      pickupEndMs: offer.pickupEndAt.millisecondsSinceEpoch,
      roundingStepMillimes: offer.stepMillimes,
      nowMs: nowMs,
    );
    if (computed > 0) return computed;
    if (offer.currentPriceMillimes != null && offer.currentPriceMillimes! > 0) return offer.currentPriceMillimes!;
    if (offer.targetPriceMillimes > 0) return offer.targetPriceMillimes;
    return offer.startPriceMillimes ?? offer.originalPriceMillimes;
  }

  List<({String name, int count})> get _merchantList {
    final counts = <String, int>{};
    for (final o in _allOffers) {
      final name = (o.merchantName ?? '').trim();
      if (name.isEmpty) continue;
      counts[name] = (counts[name] ?? 0) + 1;
    }
    final list = counts.entries.map((e) => (name: e.key, count: e.value)).toList();
    list.sort((a, b) {
      final c = b.count.compareTo(a.count);
      return c != 0 ? c : a.name.compareTo(b.name);
    });
    return list;
  }

  void _openMerchantPicker() {
    final merchants = _merchantList;
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.cream,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        side: BorderSide(color: AppTheme.ink, width: 2),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(color: AppTheme.ink, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 14),
              Text('ÉTABLISSEMENTS', style: AppTheme.display(36)),
              const SizedBox(height: 12),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    ListTile(
                      leading: const Icon(Icons.storefront_outlined, color: AppTheme.red),
                      title: Text('Tous les restaurants (${_allOffers.length})', style: AppTheme.body(16).copyWith(fontWeight: FontWeight.bold)),
                      trailing: _selectedMerchant == 'ALL' ? const Icon(Icons.check_circle, color: AppTheme.red) : null,
                      onTap: () {
                        setState(() => _selectedMerchant = 'ALL');
                        Navigator.pop(ctx);
                      },
                    ),
                    const Divider(),
                    for (final m in merchants)
                      ListTile(
                        leading: const Icon(Icons.restaurant, color: AppTheme.ink),
                        title: Text('${m.name} (${m.count})', style: AppTheme.body(15).copyWith(fontWeight: _selectedMerchant == m.name ? FontWeight.bold : FontWeight.w500)),
                        trailing: _selectedMerchant == m.name ? const Icon(Icons.check_circle, color: AppTheme.red) : null,
                        onTap: () {
                          setState(() => _selectedMerchant = m.name);
                          Navigator.pop(ctx);
                        },
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterBottomSheet(
        selectedCategory: _selectedCategory,
        selectedMerchant: _selectedMerchant,
        merchants: _merchantList,
        maxPriceMillimes: _maxPriceMillimes,
        surpriseOnly: _surpriseOnly,
        sortBy: _sortBy,
        onApply: ({required category, required merchant, required maxPriceMillimes, required surpriseOnly, required sortBy}) {
          setState(() {
            _selectedCategory = category;
            _selectedMerchant = merchant;
            _maxPriceMillimes = maxPriceMillimes;
            _surpriseOnly = surpriseOnly;
            _sortBy = sortBy;
          });
        },
      ),
    );
  }

  void _resetAllFilters() {
    setState(() {
      _searchController.clear();
      _selectedCategory = 'ALL';
      _selectedMerchant = 'ALL';
      _maxPriceMillimes = kMobileMaxBudgetUnlimited;
      _surpriseOnly = false;
      _sortBy = 'distance';
    });
  }

  bool _matchesNonCategory(OfferModel offer, int nowMs) {
    final q = _searchController.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      final matchTitle = offer.title.toLowerCase().contains(q);
      final matchMerchant = (offer.merchantName ?? '').toLowerCase().contains(q);
      final matchDesc = offer.description.toLowerCase().contains(q);
      if (!matchTitle && !matchMerchant && !matchDesc) return false;
    }
    if (_selectedMerchant != 'ALL' && (offer.merchantName ?? '').toLowerCase() != _selectedMerchant.toLowerCase()) {
      return false;
    }
    if (_surpriseOnly && !offer.isSurpriseBasket) {
      return false;
    }
    if (_maxPriceMillimes < kMobileMaxBudgetUnlimited) {
      if (_unitPriceFor(offer, nowMs) > _maxPriceMillimes) return false;
    }
    return true;
  }

  List<OfferModel> get _filteredOffers {
    final nowMs = ServerClock.serverNowMs;
    final list = _allOffers.where((offer) {
      if (_selectedCategory != 'ALL' && offer.category != _selectedCategory) return false;
      return _matchesNonCategory(offer, nowMs);
    }).toList();

    list.sort((a, b) {
      switch (_sortBy) {
        case 'price':
          return _unitPriceFor(a, nowMs).compareTo(_unitPriceFor(b, nowMs));
        case 'ending':
          return a.pickupEndAt.millisecondsSinceEpoch.compareTo(b.pickupEndAt.millisecondsSinceEpoch);
        case 'distance':
        default:
          return (a.distanceFromEssectM ?? 999999).compareTo(b.distanceFromEssectM ?? 999999);
      }
    });
    return list;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _labelOf(String category) {
    final known = _categoryLabels[category];
    if (known != null) return known;
    final lower = category.toLowerCase().replaceAll('_', ' ');
    return lower.isEmpty ? category : lower[0].toUpperCase() + lower.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final nowMs = ServerClock.serverNowMs;
    final offers = _filteredOffers;
    final merchants = _merchantList;

    // Compteurs de catégories dynamiques selon les autres filtres (même logique que Web BrowsePage)
    final catCounts = <String, int>{};
    int totalMatchedByNonCat = 0;
    for (final o in _allOffers) {
      if (_matchesNonCategory(o, nowMs)) {
        totalMatchedByNonCat++;
        catCounts[o.category] = (catCounts[o.category] ?? 0) + 1;
      }
    }

    final categories = <String>[
      'ALL',
      ..._categoryOrder.where((c) => c != 'ALL' && ((catCounts[c] ?? 0) > 0 || _selectedCategory == c)),
      ...catCounts.keys.where((c) => !_categoryOrder.contains(c)),
    ];

    final activeFilters = (_selectedCategory != 'ALL' ? 1 : 0) +
        (_selectedMerchant != 'ALL' ? 1 : 0) +
        (_surpriseOnly ? 1 : 0) +
        (_maxPriceMillimes < kMobileMaxBudgetUnlimited ? 1 : 0) +
        (_sortBy != 'distance' ? 1 : 0);

    return GPage(
      onRefresh: _loadOffers,
      header: const GPageHeader(eyebrow: 'Autour de l\'ESSECT · Montfleury', title: 'Offres du moment', titleSize: 58),
      children: [
        // Recherche + bouton tiroir filtres
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                style: AppTheme.body(16),
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Plat, sandwich, restaurant…',
                  prefixIcon: const Icon(Icons.search, color: AppTheme.ink),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close, color: AppTheme.ink, size: 20),
                          tooltip: 'Effacer la recherche',
                          onPressed: () {
                            _searchController.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),
            ),
            const SizedBox(width: 10),
            GIconButton(
              icon: Icons.tune,
              tooltip: activeFilters > 0 ? 'Filtres ($activeFilters actifs)' : 'Filtres de recherche',
              onPressed: _openFilters,
              color: activeFilters > 0 ? AppTheme.mustard : AppTheme.cream,
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Sélecteur d'établissement (parité exacte avec Web)
        if (merchants.isNotEmpty)
          InkWell(
            onTap: _openMerchantPicker,
            borderRadius: BorderRadius.circular(999),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: _selectedMerchant != 'ALL' ? const Color(0xFFFFF5F5) : AppTheme.paper,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: _selectedMerchant != 'ALL' ? AppTheme.red : AppTheme.ink,
                  width: 2,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.storefront_outlined,
                    size: 20,
                    color: _selectedMerchant != 'ALL' ? AppTheme.red : AppTheme.muted,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _selectedMerchant == 'ALL'
                          ? 'Tous les restaurants (${_allOffers.length})'
                          : _selectedMerchant,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.body(15, _selectedMerchant != 'ALL' ? AppTheme.red : AppTheme.ink)
                          .copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  Icon(
                    Icons.keyboard_arrow_down,
                    color: _selectedMerchant != 'ALL' ? AppTheme.red : AppTheme.ink,
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 12),

        // Catégories avec décompte dynamique
        if (categories.length > 1)
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final c = categories[index];
                final count = c == 'ALL' ? totalMatchedByNonCat : (catCounts[c] ?? 0);
                final label = count > 0 ? '${_labelOf(c)} ($count)' : _labelOf(c);
                return GChip(
                  label,
                  selected: _selectedCategory == c,
                  onTap: () => setState(() => _selectedCategory = _selectedCategory == c && c != 'ALL' ? 'ALL' : c),
                );
              },
            ),
          ),

        // Rappel des filtres actifs + suppression en 1 clic
        if (activeFilters > 0) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (_selectedMerchant != 'ALL')
                GChip('🏪 $_selectedMerchant ×', selected: true, onTap: () => setState(() => _selectedMerchant = 'ALL')),
              if (_selectedCategory != 'ALL')
                GChip('${_labelOf(_selectedCategory)} ×', selected: true, onTap: () => setState(() => _selectedCategory = 'ALL')),
              if (_maxPriceMillimes < kMobileMaxBudgetUnlimited)
                GChip('≤ ${Money.formatTND(_maxPriceMillimes)} ×', selected: true, onTap: () => setState(() => _maxPriceMillimes = kMobileMaxBudgetUnlimited)),
              if (_surpriseOnly)
                GChip('✨ Mystères ×', selected: true, onTap: () => setState(() => _surpriseOnly = false)),
              GChip('Effacer tout', selected: false, onTap: _resetAllFilters),
            ],
          ),
        ],
        const SizedBox(height: 18),

        GSectionTitle(offers.length == 1 ? '1 offre en ligne' : '${offers.length} offres en ligne'),
        const SizedBox(height: 14),

        if (_isLoading)
          Column(children: const [GSkeletonCard(), SizedBox(height: 16), GSkeletonCard()])
        else if (offers.isEmpty)
          GEmpty(
            icon: _loadError != null ? Icons.cloud_off : Icons.search_off,
            title: _loadError != null ? 'Connexion impossible' : 'Rien pour le moment',
            message: _loadError ?? 'Aucune offre ne correspond à votre recherche. Essayez d\'élargir les filtres.',
            actionLabel: _loadError != null ? 'Réessayer' : (activeFilters > 0 || _searchController.text.isNotEmpty ? 'Effacer les filtres' : null),
            onAction: _loadError != null
                ? () {
                    setState(() => _isLoading = true);
                    _loadOffers();
                  }
                : _resetAllFilters,
          )
        else
          for (var index = 0; index < offers.length; index++) ...[
            () {
              final offer = offers[index];
              final dist = offer.distanceFromEssectM;
              return OfferCard(
                offer: offer,
                distanceFromEssectM: dist,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => OfferDetailScreen(offer: offer, distanceFromEssectM: dist)),
                  );
                },
              );
            }(),
            const SizedBox(height: 16),
          ],
      ],
    );
  }
}
