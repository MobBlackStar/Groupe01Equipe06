// 💡 Concept & Analogie : Le guichet d'inscription du commerçant : il remplit son dossier, l'application calcule sa distance à l'ESSECT et le serveur enregistre la demande.
// 🔄 Comparaison React / Flutter : Équivalent de `MerchantOnboardingPage.jsx` : même contrat `createMerchantSchema` et même règle des 3 000 m (Haversine).
// 🎯 À retenir pour la soutenance : "Le dossier est réellement envoyé (POST /merchants) ; le commerce reste « en attente » jusqu'à la validation d'un administrateur."

import 'dart:math';

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/domain/geo.dart';
import '../../services/campus_api.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/griddle.dart';
import '../../widgets/map_pin_picker.dart';

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
  final _streetController = TextEditingController();
  final _coordsController = TextEditingController();
  final _hoursController = TextEditingController(text: '08:00 - 21:00');

  String _selectedType = 'FAST_FOOD';
  bool _isLoading = false;
  String? _error;
  ({double lat, double lng})? _coords = (lat: kEssectLat, lng: kEssectLng);

  static const _types = {
    'FAST_FOOD': 'Fast-food',
    'RESTAURANT': 'Restaurant',
    'CAFETERIA': 'Cafétéria',
    'BOULANGERIE': 'Boulangerie',
    'PATISSERIE': 'Pâtisserie',
  };

  @override
  void initState() {
    super.initState();
    _coordsController.text = '$kEssectLat, $kEssectLng';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _coordsController.dispose();
    _hoursController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final c = _coords;
    if (c == null) return;
    if (distanceFromEssectM(c.lat, c.lng) > kMaxMerchantDistanceM) {
      setState(() => _error = 'Le commerce doit se trouver à moins de 3 000 m de l\'ESSECT.');
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await CampusApi.shared.createMerchant({
        'name': _nameController.text.trim(),
        'type': _selectedType,
        'description': _descController.text.trim(),
        'openingHours': _hoursController.text.trim(),
        'phone': _phoneController.text.trim(),
        'address': {'street': _streetController.text.trim(), 'area': 'Montfleury', 'city': 'Tunis'},
        'location': {'lat': c.lat, 'lng': c.lng},
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Dossier envoyé : en attente de validation.')));
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _coords;
    final dist = c == null ? null : distanceFromEssectM(c.lat, c.lng);
    final walking = dist == null ? null : max(1, (dist * 1.3 / (5000 / 60)).round());
    final eligible = dist != null && dist <= kMaxMerchantDistanceM;

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
              const GPageHeader(eyebrow: 'Devenir partenaire', title: 'Ma boutique', titleSize: 54, lead: 'Votre dossier est examiné par l\'administration avant la mise en ligne de vos offres.'),
              const SizedBox(height: 22),
              AppTextField(
                label: 'Nom du commerce',
                hint: 'Chez Chaker',
                controller: _nameController,
                validator: (v) => (v == null || v.trim().length < 2) ? 'Au moins 2 caractères' : null,
              ),
              const SizedBox(height: 16),
              Text('TYPE D\'ÉTABLISSEMENT', style: AppTheme.label()),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [for (final e in _types.entries) GChip(e.value, selected: _selectedType == e.key, onTap: () => setState(() => _selectedType = e.key))],
              ),
              const SizedBox(height: 16),
              AppTextField(label: 'Description (facultatif)', hint: 'Spécialités, horaires…', controller: _descController, maxLines: 3),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Téléphone',
                hint: '+21698123456',
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                validator: (v) => RegExp(r'^\+216[2-9]\d{7}$').hasMatch((v ?? '').trim()) ? null : 'Format attendu : +216XXXXXXXX',
              ),
              const SizedBox(height: 14),
              AppTextField(label: 'Horaires de service', hint: '08:00 - 21:00', controller: _hoursController),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Adresse (rue)',
                hint: 'Rue Abou El Kacem Chebbi',
                controller: _streetController,
                validator: (v) => (v == null || v.trim().length < 3) ? 'Adresse requise' : null,
              ),
              const SizedBox(height: 14),
              MapPinPicker(
                initialLat: c?.lat ?? kEssectLat,
                initialLng: c?.lng ?? kEssectLng,
                onLocationChanged: (lat, lng, _, __) {
                  setState(() {
                    _coords = (lat: lat, lng: lng);
                    _coordsController.text = '$lat, $lng';
                  });
                },
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Coordonnées GPS ou lien Google Maps',
                hint: '36.7875, 10.1758',
                helperText: 'Utilisez GPS ci-dessus, choisissez une rue ou collez un lien Google Maps.',
                controller: _coordsController,
                keyboardType: TextInputType.text,
                onChanged: (v) {
                  final parsed = parseCoords(v);
                  if (parsed != null) {
                    setState(() => _coords = parsed);
                  } else {
                    setState(() => _coords = null);
                  }
                },
                validator: (v) => parseCoords(v ?? '') == null ? 'Coordonnées invalides' : null,
              ),
              if (dist != null) ...[
                const SizedBox(height: 14),
                GCard(
                  color: eligible ? const Color(0xFFDDEFD9) : AppTheme.red,
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(eligible ? Icons.check_circle_outline : Icons.block, color: eligible ? AppTheme.leaf : AppTheme.cream),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          eligible ? '$dist m de l\'ESSECT · $walking min à pied. Zone éligible.' : '$dist m de l\'ESSECT : au-delà du rayon de 3 000 m.',
                          style: AppTheme.body(16, eligible ? AppTheme.ink : AppTheme.cream).copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 22),
              if (_error != null) ...[GNotice(_error!, icon: Icons.error_outline), const SizedBox(height: 14)],
              GButton('Envoyer mon dossier', icon: Icons.send_outlined, loading: _isLoading, onPressed: _isLoading ? null : _submit),
            ],
          ),
        ),
      ),
    );
  }
}
