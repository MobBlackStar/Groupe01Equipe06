// 💡 Concept & Analogie : Le comptoir que l'on réaménage : nom, horaires, adresse et position de la boutique, enregistrés pour de vrai.
// 🔄 Comparaison React / Flutter : Équivalent du formulaire de `MerchantStorePage.jsx` : `PATCH /merchants/me` (le statut d'agrément reste protégé côté serveur).
// 🎯 À retenir pour la soutenance : "Toutes les informations de la fiche sont modifiables, adresse et position comprises ; la règle des 3 km est vérifiée à l'écran puis par le serveur."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/domain/geo.dart';
import '../../services/campus_api.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/griddle.dart';
import '../../widgets/map_pin_picker.dart';

class MerchantStoreEditScreen extends StatefulWidget {
  final Map<String, dynamic> store;

  const MerchantStoreEditScreen({super.key, required this.store});

  @override
  State<MerchantStoreEditScreen> createState() => _MerchantStoreEditScreenState();
}

class _MerchantStoreEditScreenState extends State<MerchantStoreEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _description;
  late final TextEditingController _phone;
  late final TextEditingController _street;
  late final TextEditingController _hours;
  late final TextEditingController _logo;
  late final TextEditingController _coords;
  late String _type;
  ({double lat, double lng})? _point;
  bool _saving = false;
  String? _error;

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
    final s = widget.store;
    final address = s['address'] is Map ? Map<String, dynamic>.from(s['address'] as Map) : const <String, dynamic>{};
    final loc = s['location'] is Map ? Map<String, dynamic>.from(s['location'] as Map) : const <String, dynamic>{};
    _name = TextEditingController(text: (s['name'] ?? '').toString());
    _description = TextEditingController(text: (s['description'] ?? '').toString());
    _phone = TextEditingController(text: (s['phone'] ?? '+216').toString());
    _street = TextEditingController(text: (address['street'] ?? '').toString());
    _hours = TextEditingController(text: (s['openingHours'] ?? '08:00 - 21:00').toString());
    _logo = TextEditingController(text: (s['logoUrl'] ?? '').toString());
    final lat = (loc['lat'] as num?)?.toDouble();
    final lng = (loc['lng'] as num?)?.toDouble();
    _coords = TextEditingController(text: lat != null && lng != null ? '$lat, $lng' : '');
    _point = (lat != null && lng != null) ? (lat: lat, lng: lng) : null;
    _type = _types.containsKey(s['type']) ? s['type'].toString() : 'FAST_FOOD';
  }

  @override
  void dispose() {
    for (final c in [_name, _description, _phone, _street, _hours, _logo, _coords]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final p = _point;
    if (p == null) return;
    if (distanceFromEssectM(p.lat, p.lng) > kMaxMerchantDistanceM) {
      setState(() => _error = 'Le commerce doit se trouver à moins de 3 000 m de l\'ESSECT.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final address = widget.store['address'] is Map ? Map<String, dynamic>.from(widget.store['address'] as Map) : const <String, dynamic>{};
      await CampusApi.shared.updateMyMerchant({
        'name': _name.text.trim(),
        'type': _type,
        'description': _description.text.trim(),
        'phone': _phone.text.trim(),
        'openingHours': _hours.text.trim(),
        'address': {'street': _street.text.trim(), 'area': address['area'] ?? 'Montfleury', 'city': address['city'] ?? 'Tunis'},
        'location': {'lat': p.lat, 'lng': p.lng},
        if (_logo.text.trim().isNotEmpty) 'logoUrl': _logo.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Boutique mise à jour.')));
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _point;
    final dist = p == null ? null : distanceFromEssectM(p.lat, p.lng);
    final eligible = dist != null && dist <= kMaxMerchantDistanceM;

    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            children: [
              Align(alignment: Alignment.centerLeft, child: GIconButton(icon: Icons.arrow_back, tooltip: 'Retour', onPressed: () => Navigator.maybePop(context))),
              const SizedBox(height: 14),
              const GPageHeader(eyebrow: 'Espace commerçant', title: 'Ma boutique', titleSize: 54, lead: 'Le statut d\'agrément ne change pas : seule l\'administration le modifie.'),
              const SizedBox(height: 22),
              AppTextField(label: 'Nom de l\'enseigne', controller: _name, validator: (v) => (v == null || v.trim().length < 2) ? 'Au moins 2 caractères' : null),
              const SizedBox(height: 16),
              Text('TYPE D\'ÉTABLISSEMENT', style: AppTheme.label()),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: [for (final e in _types.entries) GChip(e.value, selected: _type == e.key, onTap: () => setState(() => _type = e.key))]),
              const SizedBox(height: 16),
              AppTextField(label: 'Description', controller: _description, maxLines: 3),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Téléphone',
                controller: _phone,
                keyboardType: TextInputType.phone,
                validator: (v) => RegExp(r'^\+216[2-9]\d{7}$').hasMatch((v ?? '').trim()) ? null : 'Format attendu : +216XXXXXXXX',
              ),
              const SizedBox(height: 14),
              AppTextField(label: 'Horaires de service', hint: '08:00 - 21:00', controller: _hours, validator: (v) => (v ?? '').trim().length > 80 ? '80 caractères maximum' : null),
              const SizedBox(height: 14),
              AppTextField(label: 'Adresse (rue)', controller: _street, validator: (v) => (v == null || v.trim().length < 3) ? 'Adresse requise' : null),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Logo (lien, facultatif)',
                hint: 'https://…',
                controller: _logo,
                keyboardType: TextInputType.url,
                validator: (v) {
                  final t = (v ?? '').trim();
                  if (t.isEmpty) return null;
                  final u = Uri.tryParse(t);
                  return (u != null && u.hasScheme && u.host.isNotEmpty) ? null : 'Lien invalide';
                },
              ),
              const SizedBox(height: 14),
              MapPinPicker(
                initialLat: p?.lat ?? kEssectLat,
                initialLng: p?.lng ?? kEssectLng,
                onLocationChanged: (lat, lng, _, __) {
                  setState(() {
                    _point = (lat: lat, lng: lng);
                    _coords.text = '$lat, $lng';
                  });
                },
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Coordonnées GPS ou lien Google Maps',
                hint: '36.7875, 10.1758',
                helperText: 'Utilisez GPS ci-dessus, choisissez une rue ou collez un lien Google Maps.',
                controller: _coords,
                onChanged: (v) => setState(() => _point = parseCoords(v)),
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
                          eligible ? '$dist m de l\'ESSECT · ${walkingMinutesFor(dist)} min à pied. Zone éligible.' : '$dist m de l\'ESSECT : au-delà du rayon de 3 000 m.',
                          style: AppTheme.body(16, eligible ? AppTheme.ink : AppTheme.cream).copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 22),
              if (_error != null) ...[GNotice(_error!, icon: Icons.error_outline), const SizedBox(height: 14)],
              GButton('Enregistrer', icon: Icons.save_outlined, loading: _saving, onPressed: _saving ? null : _save),
            ],
          ),
        ),
      ),
    );
  }
}
