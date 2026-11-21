// 💡 Concept & Analogie : Comme la mémoire tampon d'un serveur web qui conserve les réponses aux questions répétées pour soulager la base de données Firestore.
// 🔄 Comparaison React / Flutter : Réduit drastiquement le temps de réponse TTFB (Time To First Byte) pour le Web et le Mobile lors des accès répétés au catalogue et au radar 3D.
// 🎯 À retenir pour la soutenance : "Cache intelligent en mémoire de 30 secondes invalidé instantanément dès qu'une mutation (POST, PATCH, DELETE) survient."
// Module : Performance & Mise en cache

const cache = new Map();

export function clearReadCache() {
  cache.clear();
}

export function getReadCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

const CACHED_PATHS = new Set([
  '/api/v1/offers',
  '/api/v1/radar',
  '/api/v1/impact/global',
  '/api/v1/impact/filieres',
]);

const CACHE_TTL_MS = 30 * 1000; // 30 secondes

export function readCacheMiddleware(req, res, next) {
  // Désactivé sous environnement de test pour ne pas fausser les suites d'assertions
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const method = req.method.toUpperCase();

  // Pour toute mutation réussie (POST, PATCH, DELETE, PUT), vider le cache immédiatement
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        clearReadCache();
      }
    });
    return next();
  }

  // Pour les requêtes GET publiques ciblées
  if (method === 'GET') {
    const rawPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
    if (CACHED_PATHS.has(rawPath)) {
      const cacheKey = req.originalUrl || req.url;
      const cached = cache.get(cacheKey);
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.send(cached.body);
      }

      // Intercepter la réponse pour mise en cache
      const originalSend = res.send.bind(res);
      res.send = (body) => {
        if (res.statusCode === 200) {
          cache.set(cacheKey, {
            body,
            expiresAt: now + CACHE_TTL_MS,
          });
          res.setHeader('X-Cache', 'MISS');
        }
        return originalSend(body);
      };
    }
  }

  return next();
}
