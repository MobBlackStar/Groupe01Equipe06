// 💡 Concept & Analogie : Comme le sous-chef de cuisine qui note rapidement les restes du service sur un calepin et les organise en plats au menu, cet assistant transforme une dictée brute en fiche produit prête à vendre.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `TextEditingController` avec un indicateur d'activité `CircularProgressIndicator` ; en React, ce composant correspond à `AiAutoFillBox.jsx`.
// 🎯 À retenir pour la soutenance : "L'assistant IA permet aux restaurateurs débordés de Montfleury de publier leurs invendus en moins de 15 secondes d'une seule main."

import 'package:flutter/material.dart';
import '../../app/theme.dart';

class AiAutofillCard extends StatefulWidget {
  final Function(Map<String, dynamic> data) onAutofill;

  const AiAutofillCard({
    super.key,
    required this.onAutofill,
  });

  @override
  State<AiAutofillCard> createState() => _AiAutofillCardState();
}

class _AiAutofillCardState extends State<AiAutofillCard> {
  final _textController = TextEditingController();
  bool _isLoading = false;

  void _runAutofill() async {
    final note = _textController.text.trim();
    if (note.isEmpty) return;

    setState(() => _isLoading = true);

    // Simulation de l'analyse IA / Parseur tunisien
    await Future.delayed(const Duration(milliseconds: 600));

    final lower = note.toLowerCase();
    String category = 'SANDWICH';
    String title = 'Plat artisanal du jour';
    int original = 6500;
    int target = 3500;
    int qty = 3;
    bool isSurprise = false;

    if (lower.contains('makloub')) {
      title = 'Makloub artisanal croustillant';
      category = 'SANDWICH';
      original = 7000;
      target = 3500;
    } else if (lower.contains('chapati')) {
      title = 'Chapati traditionnel tunisien';
      category = 'SANDWICH';
      original = 5000;
      target = 2500;
    } else if (lower.contains('croissant') || lower.contains('chocolat')) {
      title = 'Panier Viennoiseries dorées';
      category = 'VIENNOISERIE';
      original = 5500;
      target = 2200;
      isSurprise = true;
    } else if (lower.contains('pizza')) {
      title = 'Pizza italienne au feu de bois';
      category = 'PIZZA';
      original = 9000;
      target = 4500;
    }

    if (lower.contains('+') || lower.contains(' et ')) {
      isSurprise = true;
      title = 'Panier Surprise Anti-Gaspi';
    }

    // Extraction quantité
    final numMatch = RegExp(r'(\d+)').firstMatch(note);
    if (numMatch != null) {
      qty = int.tryParse(numMatch.group(1) ?? '3') ?? 3;
    }

    if (mounted) {
      setState(() => _isLoading = false);
      widget.onAutofill({
        'title': title,
        'description': 'Offre fraîchement préparée aujourd hui, à récupérer avant la fermeture.',
        'category': category,
        'originalPriceMillimes': original,
        'targetPriceMillimes': target,
        'quantity': qty,
        'isSurpriseBasket': isSurprise,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✨ Formulaire pré-rempli par l IA avec succès !'),
          backgroundColor: AppTheme.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.biscuit,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.red.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Text('✨', style: TextStyle(fontSize: 18)),
              SizedBox(width: 8),
              Text(
                'Assistant IA Magique',
                style: TextStyle(
                  color: AppTheme.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Tapez ce qu il vous reste en cuisine (ex: "4 makloub escalope, fermeture 17h") :',
            style: TextStyle(color: AppTheme.muted, fontSize: 13),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _textController,
            style: const TextStyle(color: AppTheme.ink, fontSize: 13),
            decoration: InputDecoration(
              hintText: '4 chapati thon + 2 briks...',
              hintStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
              filled: true,
              fillColor: AppTheme.cream,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.sand),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.sand),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.red),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _runAutofill,
              icon: _isLoading
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                    )
                  : const Icon(Icons.auto_awesome, size: 16, color: AppTheme.cream),
              label: Text(
                _isLoading ? 'Analyse en cours...' : 'Remplissage Magique IA',
                style: const TextStyle(color: AppTheme.cream, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.red,
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
