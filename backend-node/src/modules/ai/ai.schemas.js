// 💡 Concept & Analogie : Schémas Zod validant le texte d'entrée transmis au moteur IA de pré-remplissage d'offres.
// 🔄 Comparaison React / Flutter : Valide les saisies textuelles de l'assistant IA sur Web et Mobile.
// 🎯 À retenir pour la soutenance : "Ce schéma Zod protège le point d'accès IA contre les charges textuelles vides ou démesurées."
// Module : Intelligence Artificielle & Automatisation

import { z } from 'zod';

// Contrat du plan : { rawNote (3..500), closingTime? "HH:mm" }. `text` reste accepté (ancien nom) pour la rétro-compatibilité.
export const offerAutofillSchema = z
  .object({
    rawNote: z.string().trim().min(3, 'Veuillez fournir au moins 3 caractères de description').max(500).optional(),
    text: z.string().trim().min(3, 'Veuillez fournir au moins 3 caractères de description').max(500).optional(),
    closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:mm').optional(),
  })
  .refine((d) => Boolean(d.rawNote || d.text), { message: 'La note (rawNote) est obligatoire', path: ['rawNote'] })
  .transform((d) => ({ text: d.rawNote || d.text, closingTime: d.closingTime }));
