// 💡 Concept & Analogie : Le sous-chef qui note les restes du service sur un calepin et les range dans le formulaire ; ici c'est le serveur (IA ou analyseur de secours) qui fait le tri.
// 🔄 Comparaison React / Flutter : Équivalent de `AiAutoFillBox.jsx` : même endpoint `POST /ai/offer-autofill`, même contrat `{ suggestion, source }`.
// 🎯 À retenir pour la soutenance : "Le pré-remplissage appelle réellement l'API ; si elle échoue, l'erreur est affichée, jamais un faux résultat."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';

class AiAutofillCard extends StatefulWidget {
  final void Function(Map<String, dynamic> suggestion) onAutofill;

  const AiAutofillCard({super.key, required this.onAutofill});

  @override
  State<AiAutofillCard> createState() => _AiAutofillCardState();
}

class _AiAutofillCardState extends State<AiAutofillCard> {
  final _textController = TextEditingController();
  bool _isLoading = false;
  String? _error;
  String? _source;

  static const _examples = [
    '4 makloub escalope + 3 brik, fermeture 17h',
    '3 baguettes farcies croustillantes, ferme à 19h30',
  ];

  Future<void> _runAutofill([String? overrideNote]) async {
    final note = (overrideNote ?? _textController.text).trim();
    if (note.length < 3) {
      setState(() => _error = 'Décrivez vos invendus en au moins 3 caractères.');
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await CampusApi.shared.offerAutofill(note);
      final suggestion = res['suggestion'] ?? res['offer'];
      if (suggestion is! Map) throw Exception('Réponse inattendue du serveur');
      if (!mounted) return;
      setState(() => _source = res['source'] == 'ai' ? 'Intelligence artificielle' : 'Analyseur du serveur');
      widget.onAutofill(Map<String, dynamic>.from(suggestion));
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GCard(
      color: AppTheme.mustard,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GPill('IA', color: AppTheme.ink),
              const SizedBox(width: 10),
              Expanded(child: Text('L\'IA REMPLIT LE FORMULAIRE', style: AppTheme.h3(20))),
            ],
          ),
          const SizedBox(height: 8),
          Text('Écrivez vos invendus comme en cuisine, par exemple « 4 makloub escalope, fermeture 17h ».', style: AppTheme.body(15)),
          const SizedBox(height: 12),
          TextField(
            controller: _textController,
            style: AppTheme.body(16),
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _isLoading ? null : _runAutofill(),
            decoration: const InputDecoration(hintText: '4 chapati thon + 2 briks, fermeture 18h'),
          ),
          const SizedBox(height: 12),
          GButton('Remplir avec l\'IA', icon: Icons.auto_awesome, variant: GVariant.ink, loading: _isLoading, onPressed: _isLoading ? null : () => _runAutofill()),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: _examples
                .map(
                  (ex) => ActionChip(
                    label: Text(ex, style: const TextStyle(fontSize: 13)),
                    backgroundColor: AppTheme.cream,
                    onPressed: _isLoading
                        ? null
                        : () {
                            _textController.text = ex;
                            _runAutofill(ex);
                          },
                  ),
                )
                .toList(),
          ),
          if (_source != null) ...[const SizedBox(height: 10), Text('Source : $_source', style: AppTheme.label())],
          if (_error != null) ...[const SizedBox(height: 10), GNotice(_error!, icon: Icons.error_outline)],
        ],
      ),
    );
  }
}
