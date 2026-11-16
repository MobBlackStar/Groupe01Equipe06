// 💡 Concept & Analogie : Schémas Zod validant le texte d'entrée transmis au moteur IA de pré-remplissage d'offres.
// 🔄 Comparaison React / Flutter : Valide les saisies textuelles de l'assistant IA sur Web et Mobile.
// 🎯 À retenir pour la soutenance : "Ce schéma Zod protège le point d'accès IA contre les charges textuelles vides ou démesurées."
// Module : Intelligence Artificielle & Automatisation

import { z } from 'zod';

export const offerAutofillSchema = z.object({
  text: z.string().min(3, 'Veuillez fournir au moins 3 caractères de description').max(500),
});
