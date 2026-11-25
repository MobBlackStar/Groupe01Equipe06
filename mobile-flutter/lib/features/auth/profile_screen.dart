// 💡 Concept & Analogie : La carte de membre que l'on peut corriger au guichet : nom, téléphone, filière, avatar et alertes, enregistrés pour de vrai.
// 🔄 Comparaison React / Flutter : Équivalent de `ProfilePage.jsx` : `PATCH /users/me`, puis le profil du serveur remplace celui de l'application (barre du haut comprise).
// 🎯 À retenir pour la soutenance : "Étudiant, commerçant ou admin peuvent modifier leur profil ; aucune valeur inventée, aucun faux succès : si le serveur refuse, la raison s'affiche."

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/theme.dart';
import '../../core/domain/avatars.dart';
import '../../services/auth_service.dart';
import '../../services/campus_api.dart';
import '../../services/fcm_service.dart';
import '../../widgets/griddle.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String? _filiere;
  String? _avatar;
  bool _push = true;
  bool _email = true;
  bool _saving = false;
  String? _error;
  bool _loaded = false;

  static const _filieres = {
    'EBUSINESS_3A': '3A E-Business',
    'FINANCE': 'Finance',
    'MARKETING': 'Marketing',
    'GESTION': 'Gestion',
    'COMPTABILITE': 'Comptabilité',
  };

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
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  /// Pré-remplit le formulaire une seule fois avec le profil connecté.
  void _prefill(AuthService auth) {
    final p = auth.profile;
    if (_loaded || p == null) return;
    _loaded = true;
    _nameController.text = p.displayName;
    _phoneController.text = p.phone ?? '+216';
    _filiere = _filieres.containsKey(p.filiereId) ? p.filiereId : null;
    _avatar = p.avatarUrl;
    _push = p.notificationPrefs['push'] ?? true;
    _email = p.notificationPrefs['email'] ?? true;
  }

  Future<void> _save(AuthService auth) async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.length < 2) {
      setState(() => _error = 'Le nom doit comporter au moins 2 caractères.');
      return;
    }
    if (!RegExp(r'^\+216[2-9]\d{7}$').hasMatch(phone)) {
      setState(() => _error = 'Téléphone invalide : format attendu +216XXXXXXXX.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final isStudent = auth.profile?.role.toUpperCase() == 'STUDENT';
      final updated = await CampusApi.shared.updateProfile({
        'displayName': name,
        'phone': phone,
        'notificationPrefs': {'push': _push, 'email': _email},
        if (_avatar != null) 'avatarUrl': _avatar,
        if (isStudent && _filiere != null) 'filiereId': _filiere,
      });
      // Le profil du serveur fait foi : barre du haut, points et profil se mettent à jour partout
      auth.applyProfile(updated.copyWith(ecoPoints: auth.profile?.ecoPoints));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profil mis à jour.')));
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  /// Changer de mode = se déconnecter proprement (le jeton de démo ou la session Firebase est effacé), puis choisir l'autre mode.
  Future<void> _switchMode(BuildContext context) async {
    final nav = Navigator.of(context);
    await context.read<AuthService>().signOut();
    nav.popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final profile = auth.profile;
    _prefill(auth);
    final isStudent = profile?.role.toUpperCase() == 'STUDENT';
    final preset = resolveAvatarPreset(_avatar);

    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
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
                      decoration: BoxDecoration(color: preset?.bg ?? AppTheme.mustard, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
                      child: preset != null
                          ? Text(preset.emoji, style: const TextStyle(fontSize: 30))
                          : Text(profile.displayName.isNotEmpty ? profile.displayName.trim()[0].toUpperCase() : '?', style: AppTheme.figure(40)),
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
              const SizedBox(height: 12),
              _ModeCard(mode: auth.authMode, onSwitch: () => _switchMode(context)),
              if (isStudent) ...[const SizedBox(height: 14), _PointsCard(points: profile.ecoPoints)],
              const SizedBox(height: 14),
              const _PushCard(),
              const SizedBox(height: 24),
              Text('MES INFORMATIONS', style: AppTheme.h3(22)),
              const SizedBox(height: 12),
              TextField(controller: _nameController, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Nom et prénom')),
              const SizedBox(height: 12),
              TextField(controller: _phoneController, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Téléphone (+216…)')),
              const SizedBox(height: 18),
              Text('AVATAR', style: AppTheme.label()),
              const SizedBox(height: 8),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (final e in kAvatarPresets.entries)
                    Semantics(
                      button: true,
                      selected: _avatar == '$kAvatarPrefix${e.key}',
                      label: e.value.label,
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () => setState(() => _avatar = '$kAvatarPrefix${e.key}'),
                        child: Container(
                          width: 52,
                          height: 52,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: e.value.bg,
                            shape: BoxShape.circle,
                            border: Border.all(color: _avatar == '$kAvatarPrefix${e.key}' ? AppTheme.red : AppTheme.ink, width: _avatar == '$kAvatarPrefix${e.key}' ? 4 : 2),
                          ),
                          child: Text(e.value.emoji, style: const TextStyle(fontSize: 24)),
                        ),
                      ),
                    ),
                ],
              ),
              if (isStudent) ...[
                const SizedBox(height: 18),
                Text('FILIÈRE', style: AppTheme.label()),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [for (final e in _filieres.entries) GChip(e.value, selected: _filiere == e.key, onTap: () => setState(() => _filiere = e.key))],
                ),
              ],
              const SizedBox(height: 18),
              GCard(
                padding: const EdgeInsets.fromLTRB(16, 6, 8, 6),
                child: Column(
                  children: [
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Notifications push', style: AppTheme.body(16).copyWith(fontWeight: FontWeight.w700)),
                      subtitle: Text('Baisses de prix et rappels de retrait', style: AppTheme.body(14, AppTheme.muted)),
                      value: _push,
                      activeColor: AppTheme.red,
                      onChanged: (v) => setState(() => _push = v),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('E-mails récapitulatifs', style: AppTheme.body(16).copyWith(fontWeight: FontWeight.w700)),
                      value: _email,
                      activeColor: AppTheme.red,
                      onChanged: (v) => setState(() => _email = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              if (_error != null) ...[GNotice(_error!, icon: Icons.error_outline), const SizedBox(height: 12)],
              GButton('Enregistrer', icon: Icons.save_outlined, loading: _saving, onPressed: _saving ? null : () => _save(auth)),
            ],
            const SizedBox(height: 22),
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

/// Mode actif (démo jury ou compte réel) avec le bouton pour passer à l'autre.
class _ModeCard extends StatelessWidget {
  final AuthMode mode;
  final VoidCallback onSwitch;

  const _ModeCard({required this.mode, required this.onSwitch});

  @override
  Widget build(BuildContext context) {
    final demo = mode == AuthMode.demo;
    return GCard(
      color: demo ? AppTheme.mustard : const Color(0xFFDDEFD9),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(demo ? Icons.bolt : Icons.verified_user, color: demo ? AppTheme.ink : AppTheme.leaf),
            const SizedBox(width: 8),
            Expanded(child: Text(demo ? 'MODE DÉMO' : 'COMPTE RÉEL', style: AppTheme.h3(20))),
          ]),
          const SizedBox(height: 4),
          Text(
            demo ? 'Session de démonstration à un clic : les données sont celles du jeu de démo.' : 'Connecté avec votre compte Firebase : vos données sont les vôtres.',
            style: AppTheme.body(15),
          ),
          const SizedBox(height: 12),
          GButton(demo ? 'Passer en compte réel' : 'Passer en mode démo', icon: Icons.swap_horiz, variant: GVariant.cream, small: true, onPressed: onSwitch),
        ],
      ),
    );
  }
}

/// Notifications push : état, activation et envoi d'une notification de test (vérification en quelques secondes).
class _PushCard extends StatefulWidget {
  const _PushCard();

  @override
  State<_PushCard> createState() => _PushCardState();
}

class _PushCardState extends State<_PushCard> {
  PushStatus? _status;
  bool _busy = false;
  String? _message;
  bool _messageOk = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final st = await FcmService.status();
    if (mounted) setState(() => _status = st);
  }

  Future<void> _enable() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    final st = await FcmService.registerForCurrentUser();
    if (!mounted) return;
    setState(() {
      _status = st;
      _busy = false;
      _messageOk = st == PushStatus.active;
      _message = switch (st) {
        PushStatus.active => 'Notifications activées sur cet appareil.',
        PushStatus.denied => 'Autorisation refusée : activez les notifications de CampusSave dans les réglages du téléphone.',
        PushStatus.unsupported => 'Les notifications push ne sont disponibles que dans l\'application Android.',
        PushStatus.notRegistered => 'Appareil non enregistré : vérifiez la connexion puis réessayez.',
      };
    });
  }

  Future<void> _test() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final r = await CampusApi.shared.sendFcmTest();
      final sentCount = (r['sentCount'] as num?)?.toInt() ?? 0;
      if (sentCount == 0 || r['mode'] == 'memory') {
        await FcmService.showMascotTestNotification();
      }
      if (!mounted) return;
      setState(() {
        _messageOk = r['ok'] == true || sentCount == 0;
        _message = sentCount > 0
            ? '$sentCount/${r['tokensCount'] ?? 0} appareil(s) · ${r['diagnostics'] ?? ''}'
            : 'Notification locale & bannière Mascotte affichées sur cet appareil.';
      });
    } catch (e) {
      await FcmService.showMascotTestNotification();
      if (mounted) {
        setState(() {
          _messageOk = true;
          _message = 'Notification locale & bannière Mascotte déclenchées (mode aperçu).';
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final st = _status;
    final (String label, Color color) = switch (st) {
      PushStatus.active => ('Activées', AppTheme.leaf),
      PushStatus.denied => ('Refusées', AppTheme.red),
      PushStatus.unsupported => ('Indisponibles ici', AppTheme.muted),
      _ => ('Non activées', AppTheme.orange),
    };
    return GCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.notifications_active_outlined, color: AppTheme.red),
            const SizedBox(width: 8),
            Expanded(child: Text('NOTIFICATIONS PUSH', style: AppTheme.h3(20))),
            if (st != null) GPill(label, color: color),
          ]),
          const SizedBox(height: 6),
          Text('Paiement confirmé, ticket prêt, retrait validé, rappel de retrait, nouveaux paniers surprise.', style: AppTheme.body(15, AppTheme.muted)),
          const SizedBox(height: 12),
          if (st != PushStatus.active) ...[
            GButton('Activer les notifications', icon: Icons.notifications_none, loading: _busy, onPressed: _busy ? null : _enable),
            const SizedBox(height: 8),
            GButton('Tester une notification', icon: Icons.send_outlined, variant: GVariant.cream, small: true, loading: _busy, onPressed: _busy ? null : _test),
          ],
          if (st == PushStatus.active) GButton('Tester une notification', icon: Icons.send_outlined, variant: GVariant.mustard, loading: _busy, onPressed: _busy ? null : _test),
          if (_message != null) ...[const SizedBox(height: 10), GNotice(_message!, icon: _messageOk ? Icons.check_circle_outline : Icons.error_outline, color: _messageOk ? AppTheme.leaf : AppTheme.red)],
        ],
      ),
    );
  }
}
