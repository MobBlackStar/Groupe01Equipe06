// 💡 Concept & Analogie : Comme la salle d'attente confortable où l'on patiente pendant que l'agent instructeur examine les pièces justificatives, cet écran mobile informe le commerçant de l'état d'avancement de son agrément.
// 🔄 Comparaison React / Flutter : En Flutter, cet écran utilise un `RefreshIndicator` et des cartes avec bordures colorées selon le statut Firestore ; en React, il correspond au composant `PendingApprovalBanner`.
// 🎯 À retenir pour la soutenance : "Tant que le statut n'est pas `APPROVED`, l'accès aux fonctionnalités de publication d'offres est bloqué pour protéger la communauté étudiante."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../widgets/app_button.dart';

class PendingApprovalScreen extends StatefulWidget {
  final String status;
  final String? statusReason;

  const PendingApprovalScreen({
    super.key,
    this.status = 'PENDING',
    this.statusReason,
  });

  @override
  State<PendingApprovalScreen> createState() => _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends State<PendingApprovalScreen> {
  late String _currentStatus;
  late String? _currentReason;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.status;
    _currentReason = widget.statusReason;
  }

  void _toggleDemo() {
    setState(() {
      if (_currentStatus == 'PENDING') {
        _currentStatus = 'APPROVED';
        _currentReason = null;
      } else if (_currentStatus == 'APPROVED') {
        _currentStatus = 'REJECTED';
        _currentReason = 'Justificatif RNE illisible et distance > 3000m';
      } else {
        _currentStatus = 'PENDING';
        _currentReason = null;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    String statusTitle;
    String statusDesc;
    IconData statusIcon;

    if (_currentStatus == 'APPROVED') {
      statusColor = AppTheme.limeAccent;
      statusTitle = 'Établissement Agréé ✓';
      statusDesc = 'Félicitations ! Votre commerce est validé. Vous pouvez dès à présent publier des offres anti-gaspillage.';
      statusIcon = Icons.check_circle_outline;
    } else if (_currentStatus == 'REJECTED') {
      statusColor = AppTheme.redCritical;
      statusTitle = 'Dossier Non Retenu ✕';
      statusDesc = _currentReason ?? "Votre établissement ne respecte pas les critères d'éligibilité.";
      statusIcon = Icons.highlight_off;
    } else {
      statusColor = AppTheme.orangeUrgent;
      statusTitle = 'Dossier en Cours d Instruction ⏳';
      statusDesc = 'Votre demande est en cours d examen par la commission ESSECT. Validation moyenne sous 2 heures.';
      statusIcon = Icons.hourglass_top;
    }

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text('Statut de la Demande', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  shape: BoxShape.circle,
                  border: Border.all(color: statusColor, width: 2),
                ),
                child: Icon(statusIcon, color: statusColor, size: 48),
              ),
              const SizedBox(height: 24),

              Text(
                statusTitle,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: statusColor,
                ),
              ),
              const SizedBox(height: 12),

              Text(
                statusDesc,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.5),
              ),
              const SizedBox(height: 36),

              if (_currentStatus == 'APPROVED') ...[
                AppButton(
                  text: 'Accéder à mes Offres →',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Ouverture du catalogue commerçant')),
                    );
                  },
                ),
              ] else if (_currentStatus == 'REJECTED') ...[
                AppButton(
                  text: 'Corriger mon dossier',
                  variant: AppButtonVariant.danger,
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ] else ...[
                AppButton(
                  text: 'Actualiser le Statut',
                  variant: AppButtonVariant.secondary,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Statut vérifié : En attente')),
                    );
                  },
                ),
              ],
              const SizedBox(height: 16),

              // Bouton Démo Jury ESSECT
              TextButton(
                onPressed: _toggleDemo,
                child: Text(
                  '🎭 Basculer le statut pour la démo ($_currentStatus)',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
