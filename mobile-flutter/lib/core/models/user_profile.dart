// 💡 Concept & Analogie : Modèle de données immuable représentant le profil utilisateur dans l'application mobile.
// 🔄 Comparaison React / Flutter : En React, les objets JSON sont consommés directement ; Flutter impose un typage strict avec désérialisation explicite (`fromJson`).
// 🎯 À retenir pour la soutenance : "Ce modèle Dart garantit le typage fort et l'intégrité des champs du profil utilisateur reçus depuis l'API REST."
// Module : Modèles de Données Mobile

class UserProfile {
  final String uid;
  final String email;
  final String role;
  final String displayName;
  final String? phone;
  final String? filiereId;
  final String? avatarUrl;
  final Map<String, bool> notificationPrefs;
  final int ecoPoints;
  final List<String> badges;
  final int totalMoneySavedMillimes;
  final int totalCo2SavedGrams;
  final int totalMealsRescued;
  final bool disabled;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserProfile({
    required this.uid,
    required this.email,
    required this.role,
    required this.displayName,
    this.phone,
    this.filiereId,
    this.avatarUrl,
    this.notificationPrefs = const {'push': true, 'email': true},
    this.ecoPoints = 0,
    this.badges = const [],
    this.totalMoneySavedMillimes = 0,
    this.totalCo2SavedGrams = 0,
    this.totalMealsRescued = 0,
    this.disabled = false,
    this.createdAt,
    this.updatedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      uid: json['uid'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'STUDENT',
      displayName: json['displayName'] as String? ?? 'Étudiant ESSECT',
      phone: json['phone'] as String?,
      filiereId: json['filiereId'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      notificationPrefs: {
        'push': (json['notificationPrefs'] is Map ? (json['notificationPrefs'] as Map)['push'] : null) != false,
        'email': (json['notificationPrefs'] is Map ? (json['notificationPrefs'] as Map)['email'] : null) != false,
      },
      ecoPoints: (json['ecoPoints'] as num?)?.toInt() ?? 0,
      badges: (json['badges'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      totalMoneySavedMillimes: (json['totalMoneySavedMillimes'] as num?)?.toInt() ?? 0,
      totalCo2SavedGrams: (json['totalCo2SavedGrams'] as num?)?.toInt() ?? 0,
      totalMealsRescued: (json['totalMealsRescued'] as num?)?.toInt() ?? 0,
      disabled: json['disabled'] as bool? ?? false,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'role': role,
      'displayName': displayName,
      'phone': phone,
      'filiereId': filiereId,
      'avatarUrl': avatarUrl,
      'notificationPrefs': notificationPrefs,
      'ecoPoints': ecoPoints,
      'badges': badges,
      'totalMoneySavedMillimes': totalMoneySavedMillimes,
      'totalCo2SavedGrams': totalCo2SavedGrams,
      'totalMealsRescued': totalMealsRescued,
      'disabled': disabled,
    };
  }

  UserProfile copyWith({
    String? displayName,
    String? phone,
    String? filiereId,
    String? avatarUrl,
    int? ecoPoints,
  }) {
    return UserProfile(
      uid: uid,
      email: email,
      role: role,
      displayName: displayName ?? this.displayName,
      phone: phone ?? this.phone,
      filiereId: filiereId ?? this.filiereId,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      notificationPrefs: notificationPrefs,
      ecoPoints: ecoPoints ?? this.ecoPoints,
      badges: badges,
      totalMoneySavedMillimes: totalMoneySavedMillimes,
      totalCo2SavedGrams: totalCo2SavedGrams,
      totalMealsRescued: totalMealsRescued,
      disabled: disabled,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
