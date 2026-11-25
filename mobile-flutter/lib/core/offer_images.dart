// Catalogue unifié des 14 tags photo culinaires CampusSave (miroir exact de shared/dishPhotos.js)

class OfferImages {
  static const Map<String, String> dishPhotoUrls = {
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    'makloub': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    'chapati': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    'baguette': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'tacos': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
    'frites': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
    'brik': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    'salade': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'plat_chaud': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
    'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    'patisserie': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    'boisson': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    'surprise': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  };

  static const Map<String, String> categoryDefaultImages = {
    'SANDWICH': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
    'PLAT_CHAUD': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
    'PIZZA': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'PATISSERIE': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    'VIENNOISERIE': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    'SALADE': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'BOISSON': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    'SNACK': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
    'MIXTE': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  };

  static RegExp _kw(String expr) => RegExp(
        '(?:^|[^a-zA-Z\\u00C0-\\u017F0-9])(?:$expr)(?=\$|[^a-zA-Z\\u00C0-\\u017F0-9])',
        caseSensitive: false,
      );

  static final List<MapEntry<RegExp, String>> _keywordRules = [
    MapEntry(_kw('cheeseburgers?|burgers?|smash'), dishPhotoUrls['burger']!),
    MapEntry(_kw('tacos?|burritos?'), dishPhotoUrls['tacos']!),
    MapEntry(_kw('chapatis?|mahdia|ml[ae]wis?'), dishPhotoUrls['chapati']!),
    MapEntry(_kw('makloubs?|chawarmas?|shawarmas?|wraps?|kaskrouts?'), dishPhotoUrls['makloub']!),
    MapEntry(_kw('baguettes?(?:\\s+farci(?:es?|s)?)?'), dishPhotoUrls['baguette']!),
    MapEntry(_kw('margherita'), 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('pizzas?|calzones?'), dishPhotoUrls['pizza']!),
    MapEntry(_kw('briks?'), dishPhotoUrls['brik']!),
    MapEntry(_kw('frites?|fries|nuggets?|fricass[eé]e?s?'), dishPhotoUrls['frites']!),
    MapEntry(_kw('croissants?'), dishPhotoUrls['croissant']!),
    MapEntry(_kw('pains?\\s+au\\s+chocolat|chocolatines?|viennoiseries?|brioches?'), 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('tartes?|millefeuilles?|citron\\s+mering'), 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('g[aâ]teaux?|gateaux?|p[aâ]tisseries?|patisseries?|cheesecakes?|baklavas?|makroudhs?|bambalounis?|[eé]clairs?|cookies?|biscuits?|desserts?|brownies?'), dishPhotoUrls['patisserie']!),
    MapEntry(_kw('salades?|salads?|bowls?|c[eé]sar'), dishPhotoUrls['salade']!),
    MapEntry(_kw('couscous|kosksi|riz'), 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('p[aâ]tes|pasta|spaghettis?|lasagnes?|maqarouna|penne'), 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('ojja|l[ae]bl[ae]bi|kaftejis?|plats?\\s+chauds?|tajines?|mijot[eé]s?'), dishPhotoUrls['plat_chaud']!),
    MapEntry(_kw('omelettes?'), 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('eggs?|oeufs?|œufs?|adham'), 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('caf[eé]s?|coffees?|espressos?|cappuccinos?|lattes?'), 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('boissons?|jus|limonades?|sodas?|smoothies?|th[eé]s?|drinks?|citronnade'), dishPhotoUrls['boisson']!),
    MapEntry(_kw('sandwichs?|sandwiches|paninis?'), 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80'),
    MapEntry(_kw('panier\\s*surprise|mystery\\s*box|coffrets?|assortiments?'), dishPhotoUrls['surprise']!),
  ];

  static String resolve({
    String? photoTag,
    required String category,
    String title = '',
    String rawNote = '',
    String contents = '',
    bool isSurpriseBasket = false,
  }) {
    for (final candidate in [rawNote, title]) {
      final text = candidate.trim();
      if (text.isEmpty) continue;
      for (final rule in _keywordRules) {
        if (rule.key.hasMatch(text)) return rule.value;
      }
    }

    if (photoTag != null && dishPhotoUrls.containsKey(photoTag)) {
      return dishPhotoUrls[photoTag]!;
    }

    if (contents.trim().isNotEmpty) {
      for (final rule in _keywordRules) {
        if (rule.key.hasMatch(contents.trim())) return rule.value;
      }
    }

    return categoryDefaultImages[category.toUpperCase()] ??
        (isSurpriseBasket ? dishPhotoUrls['surprise']! : dishPhotoUrls['plat_chaud']!);
  }
}
