// 💡 Concept & Analogie : Le tableau de bord du commerçant est comme son comptoir digital : il visualise son agrément, ses statistiques clés et lance ses publications quotidiennes d'invendus en un geste.
// 🔄 Comparaison React / Flutter : En React, MerchantStorePage orchestre les formulaires et le banner d'approbation ; en Flutter, cet écran utilise un Scaffold sombre avec des tuiles d'actions rapides et un badge de statut réactif.
// 🎯 À retenir pour la soutenance : "Le dashboard commerçant donne une vue immédiate sur le statut d'approbation et permet un basculement rapide vers la création d'offres magiques assistées par IA."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../widgets/app_button.dart';
import 'pending_approval_screen.dart';
import 'merchant_onboarding_screen.dart';

class MerchantStoreScreen extends StatefulWidget {
  const MerchantStoreScreen({super.key});

  @override
  State<MerchantStoreScreen> createState() => _MerchantStoreScreenState();
}

class _MerchantStoreScreenState extends State<MerchantStoreScreen> {
  String _status = 'APPROVED'; // 'PENDING', 'APPROVED', 'REJECTED'
  String? _statusReason;

  // Mock store data (Montfleury preset)
  final Map<String, dynamic> _store = {
    'name': 'Chez Chaker Montfleury',
    'type': 'FAST_FOOD',
    'typeName': 'Fast Food',
    'address': '12 Rue Abou El Kacem Chebbi, Montfleury, Tunis',
    'distanceM': 180,
    'walkingMinutes': 2,
    'phone': '+216 71 390 123',
    'rating': 4.8,
    'offersActive': 3,
    'savedMeals': 142,
    'co2AvoidedKg': 355.0,
  };

  void _cycleStatus() {
    setState(() {
      if (_status == 'APPROVED') {
        _status = 'PENDING';
        _statusReason = null;
      } else if (_status == 'PENDING') {
        _status = 'REJECTED';
        _statusReason = 'Justificatif RNE expiré et adresse non conforme';
      } else {
        _status = 'APPROVED';
        _statusReason = null;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    String statusLabel;
    IconData statusIcon;

    if (_status == 'APPROVED') {
      statusColor = AppTheme.limeAccent;
      statusLabel = 'Agréé ESSECT ✓';
      statusIcon = Icons.verified;
    } else if (_status == 'REJECTED') {
      statusColor = AppTheme.redCritical;
      statusLabel = 'Dossier Refusé ✕';
      statusIcon = Icons.cancel;
    } else {
      statusColor = AppTheme.orangeUrgent;
      statusLabel = 'En attente de validation ⏳';
      statusIcon = Icons.hourglass_top;
    }

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text('Espace Commerçant', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Simuler changement de statut',
            icon: const Icon(Icons.sync_alt, color: AppTheme.limeAccent),
            onPressed: _cycleStatus,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Status Banner
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => PendingApprovalScreen(
                        status: _status,
                        statusReason: _statusReason,
                      ),
                    ),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: statusColor.withOpacity(0.5), width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Icon(statusIcon, color: statusColor, size: 28),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              statusLabel,
                              style: TextStyle(
                                color: statusColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _status == 'APPROVED'
                                  ? 'Votre commerce est actif et visible par les étudiants.'
                                  : _status == 'REJECTED'
                                      ? (_statusReason ?? 'Consultez le motif de refus.')
                                      : 'Votre dossier est en cours d instruction (sous 2h).',
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: Colors.white38),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // 2. Store Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(
                            color: AppTheme.limeAccent.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.limeAccent.withOpacity(0.3)),
                          ),
                          child: const Center(
                            child: Text('🏪', style: TextStyle(fontSize: 26)),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _store['name'] as String,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      _store['typeName'] as String,
                                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.star, color: Colors.amber, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${_store['rating']}',
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white10, height: 24),
                    Row(
                      children: [
                        const Icon(Icons.place, color: AppTheme.limeAccent, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${_store['address']} (${_store['distanceM']} m de l ESSECT • ~${_store['walkingMinutes']} min à pied)',
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.phone, color: Colors.white38, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          _store['phone'] as String,
                          style: const TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // 3. Stats Row
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard('Offres Actives', '${_store['offersActive']}', '⚡ En ligne', AppTheme.limeAccent),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard('Repas Sauvés', '${_store['savedMeals']}', '🌱 Anti-gaspi', Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard('CO₂ Évité', '${_store['co2AvoidedKg']} kg', '🌍 Impact vert', Colors.cyanAccent),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // 4. Quick Actions
              const Text(
                'Actions Rapides',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),

              AppButton(
                text: '✨ Publier une Offre (IA Magique)',
                icon: Icons.auto_awesome,
                backgroundColor: AppTheme.limeAccent,
                textColor: Colors.black,
                onPressed: _status == 'APPROVED'
                    ? () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Ouverture du formulaire de publication IA...'),
                            backgroundColor: AppTheme.surfaceCard,
                          ),
                        );
                      }
                    : null,
              ),

              const SizedBox(height: 12),

              AppButton(
                text: '📋 Gérer mon Catalogue d Offres',
                icon: Icons.inventory_2_outlined,
                backgroundColor: AppTheme.surfaceCard,
                textColor: Colors.white,
                isOutlined: true,
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Affichage du catalogue des offres'),
                      backgroundColor: AppTheme.surfaceCard,
                    ),
                  );
                },
              ),

              const SizedBox(height: 12),

              AppButton(
                text: '✏️ Modifier les Coordonnées de l Établissement',
                icon: Icons.edit_location_alt_outlined,
                backgroundColor: Colors.transparent,
                textColor: Colors.white70,
                isOutlined: true,
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MerchantOnboardingScreen(),
                    ),
                  );
                },
              ),

              const SizedBox(height: 30),

              // Sustainability Tip
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.06)),
                ),
                child: Row(
                  children: const [
                    Text('💡', style: TextStyle(fontSize: 22)),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Astuce ESSECT : Les offres à prix dégressif dynamique se vendent 2,4x plus vite entre 15h et 18h !',
                        style: TextStyle(color: Colors.white60, fontSize: 12),
                      ),
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

  Widget _buildStatCard(String label, String value, String sub, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 11)),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(sub, style: const TextStyle(color: Colors.white38, fontSize: 10)),
        ],
      ),
    );
  }
}
