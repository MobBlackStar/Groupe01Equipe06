// 💡 Concept & Analogie : Comme un diagnostic médical précis qui indique la maladie et la posologie plutôt qu'un vague "le patient ne va pas bien", `AppError` encapsule le code HTTP, le code d'erreur applicatif et les détails.
// 🔄 Comparaison React / Flutter : Permet de renvoyer une réponse structurée que les applications clientes peuvent traduire en messages utilisateurs pertinents.
// 🎯 À retenir pour la soutenance : "Nous avons étendu la classe standard Error pour gérer de manière homogène les codes d'erreur et les statuts HTTP à travers toute l'application."
// Module : Architecture & Infrastructure

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
