// 💡 Concept & Analogie : Comme un badge d'identité universitaire porté en permanence autour du cou, ce contexte diffuse l'état d'authentification et le profil de l'utilisateur à tous les composants React de l'arbre.
// 🔄 Comparaison React / Flutter : En React, on utilise l'API `createContext` / `useContext` ; en Flutter, on utilise un `ChangeNotifierProvider` pour diffuser l'état de l'utilisateur.
// 🎯 À retenir pour la soutenance : "Ce contexte écoute les changements d'état Firebase Auth (`onIdTokenChanged`) et charge le profil complet enrichi des droits personnalisés (Claims)."
// Module : Structure & Routage / Intégration écrans : l'équipe UI

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onIdTokenChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const userRole = tokenResult.claims.role || null;
        setRole(userRole);

        try {
          const res = await apiClient.get(ENDPOINTS.ME);
          setProfile(res.data.user);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const value = {
    user,
    profile,
    role,
    loading,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l intérieur d un AuthProvider');
  }
  return context;
}
