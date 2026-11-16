// 💡 Concept & Analogie : Modèle représentant un commerce partenaire géolocalisé autour de l'ESSECT Montfleury.
// 🔄 Comparaison React / Flutter : Utilisé pour l'affichage des fiches commerces et le radar Flutter (`flutter_map`).
// 🎯 À retenir pour la soutenance : "Ce modèle intègre la distance piétonne calculée et les coordonnées GPS pour le guidage des étudiants."
// Module : Modèles de Données Mobile

class MerchantModel {
  final String id;
  final String name;
  final String type;
  final String description;
  final String? phone;
  final String? street;
  final String? area;
  final String? city;
  final double lat;
  final double lng;
  final String? geohash;
  final int distanceFromEssectM;
  final int walkingMinutes;
  final String status;
  final String? coverImageUrl;

  const MerchantModel({
    required this.id,
    required this.name,
    required this.type,
    required this.description,
    this.phone,
    this.street,
    this.area,
    this.city,
    required this.lat,
    required this.lng,
    this.geohash,
    this.distanceFromEssectM = 0,
    this.walkingMinutes = 0,
    this.status = 'APPROVED',
    this.coverImageUrl,
  });

  factory MerchantModel.fromJson(Map<String, dynamic> json) {
    final address = json['address'] as Map<String, dynamic>?;
    final location = json['location'] as Map<String, dynamic>?;

    return MerchantModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Commerce Montfleury',
      type: json['type'] as String? ?? 'FAST_FOOD',
      description: json['description'] as String? ?? '',
      phone: json['phone'] as String?,
      street: address?['street'] as String?,
      area: address?['area'] as String? ?? 'Montfleury',
      city: address?['city'] as String? ?? 'Tunis',
      lat: (location?['lat'] as num?)?.toDouble() ?? 36.7885,
      lng: (location?['lng'] as num?)?.toDouble() ?? 10.1762,
      geohash: location?['geohash'] as String?,
      distanceFromEssectM: (json['distanceFromEssectM'] as num?)?.toInt() ?? 0,
      walkingMinutes: (json['walkingMinutes'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'APPROVED',
      coverImageUrl: json['coverImageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'description': description,
      'phone': phone,
      'address': {
        'street': street,
        'area': area,
        'city': city,
      },
      'location': {
        'lat': lat,
        'lng': lng,
        'geohash': geohash,
      },
      'distanceFromEssectM': distanceFromEssectM,
      'walkingMinutes': walkingMinutes,
      'status': status,
      'coverImageUrl': coverImageUrl,
    };
  }
}
