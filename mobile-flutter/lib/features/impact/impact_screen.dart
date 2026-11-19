// 💡 Concept & Analogie : Le thermomètre géant d'une campagne de solidarité : il lit les vrais totaux du campus, rien n'est écrit en dur.
// 🔄 Comparaison React / Flutter : Équivalent de la page publique `/impact` du site ; mêmes endpoints `/impact/global` et `/impact/filieres`.
// 🎯 À retenir pour la soutenance : "L'écran d'impact affiche les chiffres renvoyés par l'API publique (repas, CO₂, équivalences EPA, classement des filières)."

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/theme.dart';
import '../../services/auth_service.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';

class ImpactScreen extends StatefulWidget {
  const ImpactScreen({super.key});

  @override
  State<ImpactScreen> createState() => _ImpactScreenState();
}

class _ImpactScreenState extends State<ImpactScreen> {
  Map<String, dynamic>? _global;
  List<Map<String, dynamic>> _filieres = const [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final global = await CampusApi.shared.fetchGlobalImpact();
      final filieres = await CampusApi.shared.fetchFilieresImpact();
      if (!mounted) return;
      setState(() {
        _global = global;
        _filieres = filieres;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  static num _n(dynamic v) => v is num ? v : 0;

  static String _int(num v) {
    final s = v.round().toString();
    final b = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(' ');
      b.write(s[i]);
    }
    return b.toString();
  }

  static String _kg(num grams) => '${_int(grams / 1000)} kg';

  @override
  Widget build(BuildContext context) {
    final myFiliere = context.watch<AuthService>().profile?.filiereId;

    // Ouvert depuis le bilan (pile de navigation) ou par la route `/impact` : un bouton retour s'ajoute quand c'est possible.
    return Scaffold(
        backgroundColor: AppTheme.cream,
        body: SafeArea(
            child: GScreenBody(
          eyebrow: 'Campus ESSECT',
          title: 'Impact',
          trailing: Navigator.canPop(context)
              ? GIconButton(
                  icon: Icons.arrow_back,
                  tooltip: 'Retour',
                  onPressed: () => Navigator.maybePop(context))
              : null,
          child: RefreshIndicator(
            color: AppTheme.red,
            onRefresh: _load,
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.red))
                : _error != null
                    ? ListView(
                        padding: const EdgeInsets.all(20),
                        children: [
                          GEmpty(
                              icon: Icons.cloud_off_outlined,
                              title: 'Impact indisponible',
                              message: _error!,
                              actionLabel: 'Réessayer',
                              onAction: _load)
                        ],
                      )
                    : _content(myFiliere),
          ),
        )));
  }

  Widget _content(String? myFiliere) {
    final g =
        Map<String, dynamic>.from((_global?['global'] as Map?) ?? const {});
    final eq = Map<String, dynamic>.from(
        (_global?['equivalences'] as Map?) ?? const {});
    final meals = _n(g['mealsRescued']);
    final food = _n(g['foodSavedGrams']);
    final co2 = _n(g['co2SavedGrams']);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        GCard(
          ink: true,
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('SOLIDARITÉ & CLIMAT',
                  style: AppTheme.label(AppTheme.mustard)),
              const SizedBox(height: 6),
              Text(_int(meals), style: AppTheme.figure(88, AppTheme.cream)),
              Text('REPAS SAUVÉS', style: AppTheme.h3(22, AppTheme.cream)),
              const SizedBox(height: 8),
              Text(
                  'Soit ${_kg(food)} de nourriture sauvée et ${_kg(co2)} de CO₂e évités sur le campus.',
                  style: AppTheme.body(16, AppTheme.cream)),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const GSectionTitle('Équivalences concrètes'),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
                child: GStat(
                    label: 'Charges smartphone',
                    value: _int(_n(eq['smartphonesCharged'])),
                    icon: Icons.smartphone)),
            const SizedBox(width: 12),
            Expanded(
                child: GStat(
                    label: 'Km de voiture évités',
                    value: _int(_n(eq['kmCarAvoided'])),
                    icon: Icons.directions_car_outlined,
                    valueColor: AppTheme.red)),
          ],
        ),
        const SizedBox(height: 24),
        const GSectionTitle('Challenge inter-filières'),
        const SizedBox(height: 12),
        if (_filieres.isEmpty)
          const GEmpty(
              icon: Icons.emoji_events_outlined,
              title: 'Pas encore de classement',
              message:
                  'Les filières apparaîtront dès les premiers repas sauvés.')
        else
          for (var i = 0; i < _filieres.length; i++) ...[
            _FiliereRow(
                rank: i + 1,
                data: _filieres[i],
                isMine: _filieres[i]['filiereId'] == myFiliere),
            const SizedBox(height: 10),
          ],
      ],
    );
  }
}

class _FiliereRow extends StatelessWidget {
  final int rank;
  final Map<String, dynamic> data;
  final bool isMine;

  const _FiliereRow(
      {required this.rank, required this.data, required this.isMine});

  @override
  Widget build(BuildContext context) {
    final label = (data['label'] ?? data['filiereId'] ?? '').toString();
    final meals = _ImpactScreenState._n(data['mealsRescued']);
    final pts = _ImpactScreenState._n(data['ecoPointsTotal']);
    final co2 = _ImpactScreenState._n(data['co2SavedGrams']);
    return GCard(
      color: isMine ? AppTheme.mustard : null,
      padding: const EdgeInsets.fromLTRB(14, 12, 16, 12),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
                color: rank == 1 ? AppTheme.red : AppTheme.ink,
                shape: BoxShape.circle),
            child: Text('$rank', style: AppTheme.figure(30, AppTheme.cream)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: AppTheme.h3(18),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Wrap(
                  spacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                        '${_ImpactScreenState._int(meals)} repas · ${_ImpactScreenState._int(pts)} pts',
                        style: AppTheme.body(
                            14, isMine ? AppTheme.ink : AppTheme.muted)),
                    if (isMine) const GPill('Vous', color: AppTheme.red),
                  ],
                ),
              ],
            ),
          ),
          Text(_ImpactScreenState._kg(co2),
              style: AppTheme.figure(28, isMine ? AppTheme.ink : AppTheme.red)),
        ],
      ),
    );
  }
}
