// 💡 Concept & Analogie : Hook d'accès dédié au profil étudiant ou utilisateur pour les écrans nécessitant les métriques et préférences individuelles.
// 🔄 Comparaison React / Flutter : Équivalent de `Provider.of<AuthService>(context).currentUser`.
// 🎯 À retenir pour la soutenance : "Ce hook encapsule useAuth() pour fournir un accès direct aux champs du profil utilisateur."
// Module : Hooks Personnalisés React

import { useAuth } from '../context/AuthContext.jsx';

/**
 * Hook personnalisé renvoyant le profil utilisateur et ses utilitaires.
 */
export function useUserProfile() {
  const { user, profile, role, loading, updateProfile, refreshProfile } = useAuth();

  return {
    user,
    profile,
    role,
    loading,
    updateProfile,
    refreshProfile,
  };
}
