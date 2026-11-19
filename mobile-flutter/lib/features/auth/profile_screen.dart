// 💡 Concept & Analogie : Comme la carte d'étudiant qui affiche votre vrai nom, votre solde de points et un bouton pour quitter, cet écran lit le profil connecté et ne montre rien d'inventé.
// 🔄 Comparaison React / Flutter : Équivalent de la page profil du site : les données viennent de `AuthService.profile` (Provider), comme `useAuth()` côté React.
// 🎯 À retenir pour la soutenance : "Le profil n'affiche que des données réelles (nom, e-mail, EcoPoints, palier) ; la déconnexion appelle vraiment AuthService.signOut()."

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/theme.dart';
import '../../services/auth_service.dart';
import '../../widgets/griddle.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static String _roleLabel(String role) {
    switch (role.toUpperCase()) {
      case 'MERCHANT':
        return 'Commerçant';
      case 'ADMIN':
        return 'Administrateur';
      default:
        return 'Étudiant';
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final profile = auth.profile;

    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            Align(alignment: Alignment.centerLeft, child: GIconButton(icon: Icons.arrow_back, tooltip: 'Retour', onPressed: () => Navigator.maybePop(context))),
            const SizedBox(height: 14),
            const GPageHeader(eyebrow: 'Mon compte', title: 'Mon profil', titleSize: 58),
            const SizedBox(height: 22),
            if (profile == null)
              const GEmpty(icon: Icons.person_off_outlined, title: 'Non connecté', message: 'Connectez-vous pour voir votre profil.')
            else ...[
              GCard(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: AppTheme.mustard, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
                      child: Text(
                        profile.displayName.isNotEmpty ? profile.displayName.trim()[0].toUpperCase() : '?',
                        style: AppTheme.figure(40),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(profile.displayName, style: AppTheme.h3(22), maxLines: 2, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 2),
                          Text(profile.email, style: AppTheme.body(15, AppTheme.muted), overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 8),
                          GPill(_roleLabel(profile.role), color: AppTheme.red),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (profile.role.toUpperCase() == 'STUDENT') ...[const SizedBox(height: 14), _PointsCard(points: profile.ecoPoints)],
              if ((profile.phone ?? '').isNotEmpty) ...[
                const SizedBox(height: 14),
                GCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      const Icon(Icons.phone_outlined, color: AppTheme.red),
                      const SizedBox(width: 12),
                      Text(profile.phone!, style: AppTheme.mono(16).copyWith(fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ],
            ],
            const SizedBox(height: 28),
            GButton(
              'Se déconnecter',
              icon: Icons.logout,
              variant: GVariant.ink,
              onPressed: () async {
                final nav = Navigator.of(context);
                await context.read<AuthService>().signOut();
                nav.popUntil((route) => route.isFirst);
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Points et progression vers le prochain coupon (ALG-LOYALTY : 1 tampon = 20 points, coupon -20 % tous les 100 points).
class _PointsCard extends StatelessWidget {
  final int points;
  const _PointsCard({required this.points});

  @override
  Widget build(BuildContext context) {
    final inCycle = points % 100;
    final remaining = 100 - inCycle;
    return GCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(child: Text('ECOPOINTS', style: AppTheme.label())),
              Text('$points', style: AppTheme.figure(48, AppTheme.red)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: Container(
              decoration: BoxDecoration(border: Border.all(color: AppTheme.ink, width: 2), borderRadius: BorderRadius.circular(999)),
              child: LinearProgressIndicator(value: inCycle / 100, minHeight: 12, backgroundColor: AppTheme.cream, valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.mustard)),
            ),
          ),
          const SizedBox(height: 8),
          Text('Encore $remaining points pour un coupon -20 %', style: AppTheme.body(15, AppTheme.muted)),
        ],
      ),
    );
  }
}
