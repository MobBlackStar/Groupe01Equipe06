// 💡 Concept & Analogie : Flux temps réel Firestore pour l'application mobile (lecture seule des offres et des commandes).
// 🔄 Comparaison React / Flutter : Utilise les `Stream<QuerySnapshot>` de Flutter, équivalents des `onSnapshot` sous React.
// 🎯 À retenir pour la soutenance : "Ce service écoute les collections Firestore autorisées en lecture pour actualiser les listes sans rechargement manuel."
// Module : Infrastructure Mobile

import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreStreams {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static Stream<QuerySnapshot> activeOffers() {
    return _firestore
        .collection('offers')
        .where('status', isEqualTo: 'ACTIVE')
        .snapshots();
  }

  static Stream<QuerySnapshot> studentOrders(String studentId) {
    return _firestore
        .collection('orders')
        .where('studentId', isEqualTo: studentId)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }
}
