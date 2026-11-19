// 💡 Concept & Analogie : Configuration d'environnement mobile injectée à la compilation via `--dart-define`.
// 🔄 Comparaison React / Flutter : Équivalent de `env.js` en Node et `import.meta.env` sous Vite.
// 🎯 À retenir pour la soutenance : "Nous injectons les URLs d'API au build via `--dart-define` sans coder d'adresses IP en dur dans le code source."
// Module : Infrastructure Mobile

class Env {
  /// Adresse de l'API (backend Node.js hébergé). Au build : `--dart-define=API_BASE_URL=https://<hôte>/api/v1`.
  /// La valeur par défaut ne sert qu'au développement sur la même machine (web / bureau) ; un émulateur Android
  /// doit recevoir `http://10.0.2.2:4000/api/v1` explicitement.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api/v1',
  );

  /// Adresse du site web hébergé (ex. GitHub Pages) : le radar 3D WebGL s'affiche dans une WebView sur
  /// `<WEB_APP_URL>/app/radar?embed=1`. Au build : `--dart-define=WEB_APP_URL=https://<utilisateur>.github.io/<dépôt>`.
  /// Vide (défaut) : aucune adresse devinée, le radar reste sur la carte 2D native.
  static const String webAppUrl = String.fromEnvironment('WEB_APP_URL', defaultValue: '');

  /// La vue 3D n'est proposée que si le site web est configuré.
  static bool get hasWebApp => webAppUrl.trim().isNotEmpty;

  static const String mapStyleUrl = String.fromEnvironment(
    'MAP_STYLE_URL',
    defaultValue: 'https://tiles.openfreemap.org/styles/liberty',
  );

  static const bool useMocks = bool.fromEnvironment(
    'USE_MOCKS',
    defaultValue: false,
  );
}
