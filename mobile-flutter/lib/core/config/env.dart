// 💡 Concept & Analogie : Configuration d'environnement mobile injectée à la compilation via `--dart-define`.
// 🔄 Comparaison React / Flutter : Équivalent de `env.js` en Node et `import.meta.env` sous Vite.
// 🎯 À retenir pour la soutenance : "Nous injectons les URLs d'API au build via `--dart-define` sans coder d'adresses IP en dur dans le code source."
// Module : Infrastructure Mobile

class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );

  static const String mapStyleUrl = String.fromEnvironment(
    'MAP_STYLE_URL',
    defaultValue: 'https://tiles.openfreemap.org/styles/liberty',
  );

  static const bool useMocks = bool.fromEnvironment(
    'USE_MOCKS',
    defaultValue: false,
  );
}
