// 💡 Concept & Analogie : Comme un badge d'identité universitaire porté en permanence autour du cou, ce contexte diffuse l'état d'authentification et le profil de l'utilisateur à tous les composants React de l'arbre.
// 🔄 Comparaison React / Flutter : En React, on utilise l'API `createContext` / `useContext` ; en Flutter, on utilise un `ChangeNotifierProvider` pour diffuser l'état de l'utilisateur.
// 🎯 À retenir pour la soutenance : "Ce contexte écoute les changements d'état Firebase Auth (`onIdTokenChanged`) et charge le profil complet enrichi des droits personnalisés (Claims)."
// Module : Structure & Routage / Intégration écrans : l'équipe UI

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onIdTokenChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';
import { demoAccounts } from '../mocks/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronisation Firebase Auth
  useEffect(() => {
    // Vérification préalable d'une session de démonstration locale
    const savedDemo = localStorage.getItem('campussave_demo_session');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser({ uid: parsed.uid || 'demo-uid', email: parsed.email, displayName: parsed.displayName });
        setProfile(parsed);
        setRole(parsed.role);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('campussave_demo_session');
      }
    }

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const userRole = tokenResult.claims.role || null;
          setRole(userRole);

          const res = await apiClient.get(ENDPOINTS.ME);
          setProfile(res.data.user);
        } catch {
          // Si le profil Firestore n'est pas encore créé (en cours d'onboarding)
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

  /**
   * Connexion avec email et mot de passe réels via Firebase Auth
   */
  const login = async (email, password) => {
    localStorage.removeItem('campussave_demo_session');
    return await signInWithEmailAndPassword(auth, email, password);
  };

  /**
   * Connexion 1-clic pour le kit de démonstration (Étudiant, Commerçant, Administrateur)
   */
  const loginDemo = async (type) => {
    const demo = demoAccounts[type];
    if (!demo) return;

    try {
      // Tentative de connexion via Firebase Auth
      await signInWithEmailAndPassword(auth, demo.email, demo.password);
    } catch {
      // Mode secours démonstration locale (en cas d'absence de réseau ou d'émulateur non démarré)
      const simulatedProfile = {
        uid: `demo-${type}-id`,
        email: demo.email,
        displayName: demo.displayName,
        role: demo.role,
        filiereId: demo.filiereId || null,
        phone: demo.phone || '+21698000000',
        ecoPoints: demo.ecoPoints || 0,
        totalMoneySavedMillimes: demo.totalMoneySavedMillimes || 0,
        totalCo2SavedGrams: demo.totalCo2SavedGrams || 0,
        totalMealsRescued: demo.totalMealsRescued || 0,
      };
      localStorage.setItem('campussave_demo_session', JSON.stringify(simulatedProfile));
      setUser({ uid: simulatedProfile.uid, email: simulatedProfile.email, displayName: simulatedProfile.displayName });
      setProfile(simulatedProfile);
      setRole(demo.role);
    }
  };

  /**
   * Rafraîchit les Custom Claims et le profil Firestore après l'enregistrement
   */
  const refreshProfile = async () => {
    if (auth.currentUser) {
      const tokenResult = await auth.currentUser.getIdTokenResult(true);
      const userRole = tokenResult.claims.role || null;
      setRole(userRole);
      try {
        const res = await apiClient.get(ENDPOINTS.ME);
        setProfile(res.data.user);
        return res.data;
      } catch (err) {
        console.error('Erreur rafraîchissement profil', err);
      }
    }
  };

  /**
   * Déconnexion sécurisée
   */
  const logout = async () => {
    localStorage.removeItem('campussave_demo_session');
    try {
      await fbSignOut(auth);
    } catch {
      // Ignorer si non connecté à Firebase
    }
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const value = {
    user,
    profile,
    role,
    loading,
    login,
    loginDemo,
    logout,
    refreshProfile,
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
