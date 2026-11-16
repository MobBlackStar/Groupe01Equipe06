// 💡 Concept & Analogie : Comme une radio branchée en permanence sur les fréquences de la base de données, ce service fournit des flux réactifs Stream<T> pour mettre à jour instantanément les interfaces Flutter.
// 🔄 Comparaison React / Flutter : Équivalent exact des hooks personnalisés `useOrder`, `useMyOrders` et `useMerchantOrders` sous React.
// 🎯 À retenir pour la soutenance : "Toutes les lectures mobiles passent par ces flux déclaratifs StreamBuilder, assurant une synchronisation temps réel sans aucun polling."
// Module : Services & Flux Temps Réel Mobile

import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreStreams {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Écoute en continu le catalogue des offres actives
  static Stream<QuerySnapshot<Map<String, dynamic>>> activeOffers() {
    return _firestore
        .collection('offers')
        .where('status', isEqualTo: 'ACTIVE')
        .snapshots();
  }

  /// Écoute en continu une commande unique (utilisé sur l'écran du Living Ticket)
  static Stream<DocumentSnapshot<Map<String, dynamic>>> order(String orderId) {
    return _firestore.collection('orders').doc(orderId).snapshots();
  }

  /// Écoute les commandes passées par l'étudiant connecté
  static Stream<QuerySnapshot<Map<String, dynamic>>> myOrders(String studentId) {
    return _firestore
        .collection('orders')
        .where('studentId', isEqualTo: studentId)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  /// Alias de rétrocompatibilité pour studentOrders
  static Stream<QuerySnapshot<Map<String, dynamic>>> studentOrders(String studentId) {
    return myOrders(studentId);
  }

  /// Écoute les commandes destinées à l'établissement commerçant
  static Stream<QuerySnapshot<Map<String, dynamic>>> merchantOrders(String merchantId) {
    return _firestore
        .collection('orders')
        .where('merchantId', isEqualTo: merchantId)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  /// Écoute le document de l'établissement commerçant (notamment pour l'état d'approbation)
  static Stream<DocumentSnapshot<Map<String, dynamic>>> merchant(String merchantId) {
    return _firestore.collection('merchants').doc(merchantId).snapshots();
  }
}
