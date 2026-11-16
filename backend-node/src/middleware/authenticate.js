// 💡 Concept & Analogie : Comme un vigile à l'entrée d'un club qui vérifie l'authenticité d'une pièce d'identité avec une lampe UV, ce middleware valide le jeton JWT Firebase Bearer et vérifie qu'il n'a pas été révoqué.
// 🔄 Comparaison React / Flutter : React stocke le token Firebase et l'injecte via un intercepteur Axios ; Flutter fait de même avec un intercepteur Dio `Bearer ${token}`.
// 🎯 À retenir pour la soutenance : "Nous vérifions systématiquement la validité et la non-révocation des jetons ID Firebase avec `verifyIdToken(token, true)` pour bloquer immédiatement tout utilisateur suspendu."
// Module : Architecture & Sécurité

import { auth } from '../config/firebase.js';
import { AppError } from '../utils/AppError.js';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentification requise', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split('Bearer ')[1];
    // Le second paramètre true force la vérification de révocation
    const decodedToken = await auth.verifyIdToken(token, true);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || null,
      ...decodedToken,
    };

    next();
  } catch (error) {
    if (error.code === 'auth/id-token-revoked') {
      return next(new AppError('Session révoquée, veuillez vous reconnecter', 401, 'TOKEN_REVOKED'));
    }
    return next(new AppError('Jeton d authentification invalide ou expiré', 401, 'INVALID_TOKEN'));
  }
}
