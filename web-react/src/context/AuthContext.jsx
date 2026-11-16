// 💡 Concept & Analogie : Comme un badge d'identité universitaire porté en permanence autour du cou, ce contexte diffuse l'état d'authentification et le profil de l'utilisateur à tous les composants React de l'arbre.
// 🔄 Comparaison React / Flutter : En React, on utilise l'API `createContext` / `useContext` ; en Flutter, on utilise un `ChangeNotifierProvider` pour diffuser l'état de l'utilisateur.
// 🎯 À retenir pour la soutenance : "Ce contexte écoute les changements d'état Firebase Auth (`onIdTokenChanged`) et bascule instantanément sur les sessions de démo locale si Firebase n'est pas configuré."
// Module : Structure & Routage / Intégration écrans : l'équipe UI

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onIdTokenChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase.js';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';
import { demoAccounts } from '../mocks/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronisation Session Démo / Firebase Auth
  useEffect(() => {
    // 1. Vérification préalable d'une session de démonstration locale
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

    const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

    // 2. Si mode mocks activé ou Firebase non configuré, terminer le chargement immédiatement
    if (useMocks || !auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // 3. Écoute Firebase Auth
    try {
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
            setProfile(null);
          }
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Échec écoute onIdTokenChanged :', err.message);
      setLoading(false);
    }
  }, []);

  /**
   * Connexion avec email et mot de passe réels ou démo
   */
  const login = async (email, password) => {
    localStorage.removeItem('campussave_demo_session');

    if (!auth || !isFirebaseConfigured) {
      const foundDemoKey = Object.keys(demoAccounts).find((k) => demoAccounts[k].email === email);
      if (foundDemoKey) {
        return loginDemo(foundDemoKey);
      }
      const fallbackProfile = {
        uid: `demo-user-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role: 'STUDENT',
        filiereId: 'EBUSINESS_3A',
        ecoPoints: 90,
        totalMoneySavedMillimes: 18000,
        totalCo2SavedGrams: 4000,
        totalMealsRescued: 4,
      };
      localStorage.setItem('campussave_demo_session', JSON.stringify(fallbackProfile));
      setUser({ uid: fallbackProfile.uid, email: fallbackProfile.email, displayName: fallbackProfile.displayName });
      setProfile(fallbackProfile);
      setRole('STUDENT');
      setLoading(false);
      return { user: fallbackProfile };
    }

    return await signInWithEmailAndPassword(auth, email, password);
  };

  /**
   * Connexion 1-clic pour le kit de démonstration (Étudiant, Commerçant, Administrateur)
   */
  const loginDemo = async (type) => {
    const demo = demoAccounts[type];
    if (!demo) return;

    const simulatedProfile = {
      uid: demo.uid || `demo-${type}-id`,
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
    setLoading(false);

    if (auth && isFirebaseConfigured) {
      try {
        await signInWithEmailAndPassword(auth, demo.email, demo.password);
      } catch {
        // Ignorer l'erreur réseau Firebase en mode démo
      }
    }
  };

  /**
   * Rafraîchit les Custom Claims et le profil
   */
  const refreshProfile = async () => {
    if (auth?.currentUser) {
      try {
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        const userRole = tokenResult.claims.role || null;
        setRole(userRole);
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
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch {}
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
