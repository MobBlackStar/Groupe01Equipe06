// 💡 Concept & Analogie : Comme le hall d'accueil de la cafétéria de l'ESSECT affichant les offres de sauvetage disponibles à la sortie des amphis.
// 🔄 Comparaison React / Flutter : En Flutter, cet écran utilise un `RefreshIndicator` et une `ListView` ou `GridView` avec slivers ; en React, il correspond à `BrowsePage.jsx`.
// 🎯 À retenir pour la soutenance : "L'écran d'exploration mobile offre une fluidité native avec actualisation au tirage (pull-to-refresh) et synchronisation des prix à la seconde."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/config/env.dart';
import '../../core/models/offer_model.dart';
import '../../services/campus_api.dart';
import '../../widgets/offer_card.dart';
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
  int _maxPriceMillimes = 15000;
  bool _surpriseOnly = false;
  String _sortBy = 'distance';

  // Catalogue réel chargé depuis `GET /offers` (identifiants réels, requis pour réserver)
  List<OfferModel> _allOffers = [];
  bool _isLoading = true;
  String? _loadError;

  // Offres de démonstration hors-ligne : utilisées uniquement avec --dart-define=USE_MOCKS=true
  final List<OfferModel> _demoOffers = [
    OfferModel(
      id: 'off-1',
      merchantId: 'm1',
      merchantName: 'Baguette & Baguette Montfleury',
      title: 'Baguette Farcie Escalope Panée & Fromage',
      description: 'Baguette chaude garnie d escalope panée croustillante, frites et fromage fondant.',
      category: 'SANDWICH',
      pricingType: 'DUTCH',
      originalPriceMillimes: 7800,
      targetPriceMillimes: 3800,
      quantity: 4,
      remainingQuantity: 4,
      pickupStartAt: DateTime.now().subtract(const Duration(minutes: 20)),
      pickupEndAt: DateTime.now().add(const Duration(minutes: 40)),
      photoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    ),
    OfferModel(
      id: 'off-2',
      merchantId: 'm2',
      merchantName: "Cafétéria L'Étoile du Savoir",
      title: 'Panier Surprise Viennoiseries du Matin',
      description: '4 croissants au beurre et pains au chocolat cuits ce matin sur place.',
      category: 'MIXTE',
      pricingType: 'FIXED',
      originalPriceMillimes: 6000,
      targetPriceMillimes: 2500,
      quantity: 5,
      remainingQuantity: 5,
      pickupStartAt: DateTime.now().subtract(const Duration(minutes: 60)),
      pickupEndAt: DateTime.now().add(const Duration(minutes: 90)),
      isSurpriseBasket: true,
      photoUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    ),
    OfferModel(
      id: 'off-3',
      merchantId: 'm3',
      merchantName: 'Restaurant Le Dôme Montfleury',
      title: 'Ojja Royale aux Merguez & Œuf',
      description: 'Plat tunisien mijoté à base de tomates fraîches, merguez et œuf coulant.',
      category: 'PLAT_CHAUD',
      pricingType: 'DUTCH',
      originalPriceMillimes: 8500,
      targetPriceMillimes: 4500,
      quantity: 3,
      remainingQuantity: 3,
      pickupStartAt: DateTime.now().subtract(const Duration(minutes: 15)),
      pickupEndAt: DateTime.now().add(const Duration(minutes: 25)),
      photoUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80',
    ),
    OfferModel(
      id: 'off-4',
      merchantId: 'm4',
      merchantName: 'Pâtisserie Masmoudi',
      title: 'Assortiment Pâtisserie Traditionnelle',
      description: 'Sélection artisanale de douceurs tunisiennes (makroudh, baklawa).',
      category: 'PATISSERIE',
      pricingType: 'FIXED',
      originalPriceMillimes: 12000,
      targetPriceMillimes: 5500,
      quantity: 2,
      remainingQuantity: 2,
      pickupStartAt: DateTime.now().subtract(const Duration(minutes: 30)),
      pickupEndAt: DateTime.now().add(const Duration(minutes: 120)),
      isSurpriseBasket: true,
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    ),
    OfferModel(
      id: 'off-5',
      merchantId: 'm5',
      merchantName: 'Pizzeria Bella Napoli Montfleury',
      title: 'Pizza Calzone Soufflée au Thon',
      description: 'Calzone garnie de thon, mozzarella et olives noires.',
      category: 'PIZZA',
      pricingType: 'DUTCH',
      originalPriceMillimes: 9000,
      targetPriceMillimes: 4500,
      quantity: 4,
      remainingQuantity: 4,
      pickupStartAt: DateTime.now().subtract(const Duration(minutes: 10)),
      pickupEndAt: DateTime.now().add(const Duration(minutes: 15)),
      photoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadOffers();
  }

  Future<void> _loadOffers() async {
    if (Env.useMocks) {
      setState(() {
        _allOffers = _demoOffers;
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

  void _openFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterBottomSheet(
        selectedCategory: _selectedCategory,
        maxPriceMillimes: _maxPriceMillimes,
        surpriseOnly: _surpriseOnly,
        sortBy: _sortBy,
        onApply: ({required category, required maxPriceMillimes, required surpriseOnly, required sortBy}) {
          setState(() {
            _selectedCategory = category;
            _maxPriceMillimes = maxPriceMillimes;
            _surpriseOnly = surpriseOnly;
            _sortBy = sortBy;
          });
        },
      ),
    );
  }

  List<OfferModel> get _filteredOffers {
    final q = _searchController.text.trim().toLowerCase();
    return _allOffers.where((offer) {
      if (q.isNotEmpty) {
        final matchTitle = offer.title.toLowerCase().contains(q);
        final matchMerchant = (offer.merchantName ?? '').toLowerCase().contains(q);
        if (!matchTitle && !matchMerchant) return false;
      }
      if (_selectedCategory != 'ALL' && offer.category != _selectedCategory) {
        return false;
      }
      if (_surpriseOnly && !offer.isSurpriseBasket) {
        return false;
      }
      if (offer.targetPriceMillimes > _maxPriceMillimes) {
        return false;
      }
      return true;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final offers = _filteredOffers;

    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        title: const Text('CampusSave • ESSECT', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune, color: AppTheme.red),
            onPressed: _openFilters,
            tooltip: 'Filtres de recherche',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Barre de recherche avec icône filtres
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() {}),
                      style: const TextStyle(color: AppTheme.ink, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Rechercher un plat, sandwich, commerce...',
                        hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
                        prefixIcon: const Icon(Icons.search, color: AppTheme.muted, size: 20),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, color: AppTheme.muted, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {});
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: AppTheme.biscuit,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppTheme.sand),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppTheme.sand),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppTheme.red),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. Bannière Campus
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.red.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Text('📍', style: TextStyle(fontSize: 14)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Autour de l ESSECT Montfleury • ${offers.length} offre(s) en ligne',
                        style: const TextStyle(color: AppTheme.red, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // 3. Grille des offres
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadOffers,
                color: AppTheme.red,
                backgroundColor: AppTheme.biscuit,
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.red))
                    : offers.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          const SizedBox(height: 80),
                          Column(
                            children: [
                              Text(_loadError != null ? '⚠️' : '🔍', style: const TextStyle(fontSize: 48)),
                              const SizedBox(height: 12),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 24),
                                child: Text(
                                  _loadError ?? 'Aucune offre ne correspond à votre recherche',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                                ),
                              ),
                              if (_loadError != null)
                                TextButton(
                                  onPressed: () {
                                    setState(() => _isLoading = true);
                                    _loadOffers();
                                  },
                                  child: const Text('Réessayer', style: TextStyle(color: AppTheme.red)),
                                ),
                            ],
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: offers.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final offer = offers[index];
                          final distances = [180, 120, 350, 420, 520];
                          final dist = distances[index % distances.length];

                          return OfferCard(
                            offer: offer,
                            distanceFromEssectM: dist,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => OfferDetailScreen(
                                    offer: offer,
                                    distanceFromEssectM: dist,
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
