// 💡 Concept & Analogie : L'ardoise du restaurant, mais connectée : ce que le commerçant écrit est vraiment envoyé au catalogue ; sinon l'erreur du serveur s'affiche.
// 🔄 Comparaison React / Flutter : Équivalent de `OfferFormPage.jsx` : même contrat `createOfferSchema` (prix dans `pricing`, créneau sur une seule journée à Tunis).
// 🎯 À retenir pour la soutenance : "Aucun faux succès : la publication appelle POST /offers et le formulaire reste ouvert avec la vraie raison si le serveur refuse."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../services/campus_api.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/griddle.dart';
import 'ai_autofill_card.dart';

class OfferFormScreen extends StatefulWidget {
  const OfferFormScreen({super.key});

  @override
  State<OfferFormScreen> createState() => _OfferFormScreenState();
}

class _OfferFormScreenState extends State<OfferFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _originalPriceController = TextEditingController();
  final _pricePrimaryController = TextEditingController(); // prix réduit (fixe) ou prix de départ (dégressif)
  final _priceFloorController = TextEditingController(); // prix plancher (dégressif)
  final _quantityController = TextEditingController(text: '4');
  final _contentsController = TextEditingController();
  final _photoController = TextEditingController();

  String _category = 'SANDWICH';
  bool _isDutch = false;
  bool _isSurprise = false;
  bool _isSubmitting = false;
  String? _error;
  late TimeOfDay _pickupStart;
  late TimeOfDay _pickupEnd;

  static const _categories = {
    'SANDWICH': 'Sandwichs',
    'PLAT_CHAUD': 'Plats chauds',
    'PIZZA': 'Pizzas',
    'VIENNOISERIE': 'Viennoiseries',
    'PATISSERIE': 'Pâtisseries',
    'SALADE': 'Salades',
    'BOISSON': 'Boissons',
    'SNACK': 'Snacks',
    'MIXTE': 'Paniers mixtes',
  };

  /// Tunis est en UTC+1 toute l'année (pas d'heure d'été) : le créneau est toujours exprimé à cette heure.
  static const _tunisOffset = Duration(hours: 1);

  @override
  void initState() {
    super.initState();
    final nowTunis = DateTime.now().toUtc().add(_tunisOffset);
    _pickupStart = TimeOfDay(hour: nowTunis.hour, minute: nowTunis.minute);
    final endMinutes = (nowTunis.hour * 60 + nowTunis.minute + 120).clamp(0, 23 * 60 + 59);
    _pickupEnd = TimeOfDay(hour: endMinutes ~/ 60, minute: endMinutes % 60);
  }

  @override
  void dispose() {
    for (final c in [_titleController, _descController, _originalPriceController, _pricePrimaryController, _priceFloorController, _quantityController, _contentsController, _photoController]) {
      c.dispose();
    }
    super.dispose();
  }

  /// Saisie en dinars (7.500 ou 7,5) convertie en millimes entiers.
  static int? _toMillimes(String? raw) {
    final v = double.tryParse((raw ?? '').trim().replaceAll(',', '.'));
    if (v == null || v <= 0) return null;
    return (v * 1000).round();
  }

  static String _fromMillimes(num m) => (m / 1000).toStringAsFixed(3);

  DateTime _utcAtTunisTime(TimeOfDay t) {
    final nowTunis = DateTime.now().toUtc().add(_tunisOffset);
    return DateTime.utc(nowTunis.year, nowTunis.month, nowTunis.day, t.hour, t.minute).subtract(_tunisOffset);
  }

  Future<void> _pickTime(bool start) async {
    final picked = await showTimePicker(context: context, initialTime: start ? _pickupStart : _pickupEnd);
    if (picked != null) setState(() => start ? _pickupStart = picked : _pickupEnd = picked);
  }

  void _applyAutofill(Map<String, dynamic> s) {
    setState(() {
      _titleController.text = s['title'] as String? ?? _titleController.text;
      _descController.text = s['description'] as String? ?? _descController.text;
      final cat = s['category'] as String?;
      if (cat != null && _categories.containsKey(cat)) _category = cat;
      final original = s['originalPriceMillimes'];
      final discounted = s['discountedPriceMillimes'];
      if (original is num) _originalPriceController.text = _fromMillimes(original);
      _isDutch = s['pricingMode'] == 'DUTCH_AUCTION';
      if (discounted is num) {
        if (_isDutch) {
          _pricePrimaryController.text = original is num ? _fromMillimes(original) : '';
          _priceFloorController.text = _fromMillimes(discounted);
        } else {
          _pricePrimaryController.text = _fromMillimes(discounted);
        }
      }
      final qty = s['quantityTotal'];
      if (qty is num) _quantityController.text = '${qty.toInt()}';
      _isSurprise = s['isSurpriseBasket'] == true;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final original = _toMillimes(_originalPriceController.text)!;
    final primary = _toMillimes(_pricePrimaryController.text)!;
    final floor = _isDutch ? _toMillimes(_priceFloorController.text) : null;

    final start = _utcAtTunisTime(_pickupStart);
    final end = _utcAtTunisTime(_pickupEnd);
    if (!end.isAfter(start)) {
      setState(() => _error = 'L\'heure de fin doit être après l\'heure de début.');
      return;
    }
    if (end.difference(start) > const Duration(hours: 6)) {
      setState(() => _error = 'Le créneau de retrait ne peut pas dépasser 6 heures.');
      return;
    }

    final contents = _contentsController.text.split(RegExp(r'[,\n]')).map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    final body = <String, dynamic>{
      'title': _titleController.text.trim(),
      'description': _descController.text.trim(),
      'category': _category,
      'pricing': _isDutch
          ? {
              'mode': 'DUTCH_AUCTION',
              'originalPriceMillimes': original,
              'startPriceMillimes': primary,
              'floorPriceMillimes': floor,
              'decayStartAt': start.toIso8601String(),
              'roundingStepMillimes': 100,
            }
          : {
              'mode': 'FIXED',
              'originalPriceMillimes': original,
              'discountedPriceMillimes': primary,
              'roundingStepMillimes': 100,
            },
      'quantity': int.parse(_quantityController.text.trim()),
      'pickupStartAt': start.toIso8601String(),
      'pickupEndAt': end.toIso8601String(),
      'isSurpriseBasket': _isSurprise,
      if (_isSurprise && contents.isNotEmpty) 'surpriseContents': contents,
      if (_photoController.text.trim().isNotEmpty) 'photoUrl': _photoController.text.trim(),
    };

    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await CampusApi.shared.createOffer(body);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Offre publiée sur le catalogue.')));
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              Align(alignment: Alignment.centerLeft, child: GIconButton(icon: Icons.arrow_back, tooltip: 'Retour', onPressed: () => Navigator.maybePop(context))),
              const SizedBox(height: 14),
              const GPageHeader(eyebrow: 'Espace commerçant', title: 'Nouvelle offre', titleSize: 54, lead: 'Prix en dinars (ex. 7.500). Le créneau est à l\'heure de Tunis, sur la journée en cours.'),
              const SizedBox(height: 20),
              AiAutofillCard(onAutofill: _applyAutofill),
              const SizedBox(height: 22),
              Text('DÉTAILS', style: AppTheme.h3(20)),
              const SizedBox(height: 12),
              AppTextField(
                label: 'Titre',
                hint: 'Baguette farcie escalope',
                controller: _titleController,
                validator: (v) => (v == null || v.trim().length < 2) ? 'Au moins 2 caractères' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(label: 'Description', hint: 'Ingrédients, allergènes…', controller: _descController, maxLines: 3),
              const SizedBox(height: 16),
              Text('CATÉGORIE', style: AppTheme.label()),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final e in _categories.entries) GChip(e.value, selected: _category == e.key, onTap: () => setState(() => _category = e.key)),
                ],
              ),
              const SizedBox(height: 14),
              AppTextField(label: 'Photo (lien, facultatif)', hint: 'https://…', controller: _photoController, keyboardType: TextInputType.url, validator: (v) {
                final t = (v ?? '').trim();
                if (t.isEmpty) return null;
                final u = Uri.tryParse(t);
                return (u != null && u.hasScheme && u.host.isNotEmpty) ? null : 'Lien invalide';
              }),
              const SizedBox(height: 24),
              Text('TARIFICATION', style: AppTheme.h3(20)),
              const SizedBox(height: 12),
              GCard(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  children: [
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Enchère dégressive', style: AppTheme.body(17).copyWith(fontWeight: FontWeight.w700)),
                      subtitle: Text('Le prix baisse tout seul jusqu\'au plancher.', style: AppTheme.body(14, AppTheme.muted)),
                      value: _isDutch,
                      activeColor: AppTheme.red,
                      onChanged: (v) => setState(() => _isDutch = v),
                    ),
                    const SizedBox(height: 8),
                    AppTextField(
                      label: 'Prix d\'origine (TND)',
                      hint: '7.500',
                      controller: _originalPriceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) => _toMillimes(v) == null ? 'Montant invalide' : null,
                    ),
                    const SizedBox(height: 14),
                    AppTextField(
                      label: _isDutch ? 'Prix de départ (TND)' : 'Prix réduit (TND)',
                      hint: '3.500',
                      controller: _pricePrimaryController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        final m = _toMillimes(v);
                        if (m == null) return 'Montant invalide';
                        final o = _toMillimes(_originalPriceController.text);
                        if (!_isDutch && o != null && m >= o) return 'Doit être inférieur au prix d\'origine';
                        return null;
                      },
                    ),
                    if (_isDutch) ...[
                      const SizedBox(height: 14),
                      AppTextField(
                        label: 'Prix plancher (TND)',
                        hint: '2.000',
                        controller: _priceFloorController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        validator: (v) {
                          final m = _toMillimes(v);
                          if (m == null) return 'Montant invalide';
                          final s = _toMillimes(_pricePrimaryController.text);
                          if (s != null && m >= s) return 'Doit être inférieur au prix de départ';
                          return null;
                        },
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GCard(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  children: [
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Panier surprise', style: AppTheme.body(17).copyWith(fontWeight: FontWeight.w700)),
                      subtitle: Text('Le contenu n\'est dévoilé qu\'après la réservation.', style: AppTheme.body(14, AppTheme.muted)),
                      value: _isSurprise,
                      activeColor: AppTheme.red,
                      onChanged: (v) => setState(() => _isSurprise = v),
                    ),
                    if (_isSurprise) ...[
                      const SizedBox(height: 8),
                      AppTextField(label: 'Contenu (séparé par des virgules)', hint: '2 croissants, 1 pain au chocolat', controller: _contentsController, maxLines: 2),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text('STOCK ET RETRAIT', style: AppTheme.h3(20)),
              const SizedBox(height: 12),
              AppTextField(
                label: 'Portions disponibles',
                hint: '4',
                controller: _quantityController,
                keyboardType: TextInputType.number,
                validator: (v) {
                  final n = int.tryParse((v ?? '').trim());
                  return (n == null || n < 1 || n > 50) ? 'Entre 1 et 50' : null;
                },
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: _TimeTile(label: 'Début', time: _pickupStart, onTap: () => _pickTime(true))),
                  const SizedBox(width: 12),
                  Expanded(child: _TimeTile(label: 'Fin', time: _pickupEnd, onTap: () => _pickTime(false))),
                ],
              ),
              const SizedBox(height: 22),
              if (_error != null) ...[GNotice(_error!, icon: Icons.error_outline), const SizedBox(height: 14)],
              GButton('Publier l\'offre', icon: Icons.rocket_launch_outlined, loading: _isSubmitting, onPressed: _isSubmitting ? null : _submit),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimeTile extends StatelessWidget {
  final String label;
  final TimeOfDay time;
  final VoidCallback onTap;

  const _TimeTile({required this.label, required this.time, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final text = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: AppTheme.paperCard(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label.toUpperCase(), style: AppTheme.label()),
            Text(text, style: AppTheme.figure(40, AppTheme.red)),
          ],
        ),
      ),
    );
  }
}
