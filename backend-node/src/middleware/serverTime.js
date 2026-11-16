// 💡 Concept & Analogie : Comme une horloge centrale dans une gare ferroviaire sur laquelle tous les passagers règlent leur montre, ce middleware injecte le temps serveur dans les réponses HTTP pour synchroniser les clients.
// 🔄 Comparaison React / Flutter : React et Flutter calculent le décalage (offset = serverTime - localTime) pour ajuster leurs comptes à rebours locaux sans risque de triche sur l'heure de l'appareil.
// 🎯 À retenir pour la soutenance : "Nous injectons systématiquement l'horodatage serveur pour que les algorithmes de dégressivité de prix et d'expiration soient synchronisés à la milliseconde près."
// Module : Architecture & Infrastructure

export function serverTimeMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      body.serverTime = Date.now();
    }
    return originalJson(body);
  };

  next();
}
