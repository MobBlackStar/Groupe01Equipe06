// 💡 Concept & Analogie : Comme un badge d'identité universitaire porté en permanence autour du cou, ce contexte diffuse l'état d'authentification et le profil de l'utilisateur à tous les composants React de l'arbre.
// 🔄 Comparaison React / Flutter : En React, on utilise l'API `createContext` / `useContext` ; en Flutter, on utilise un `ChangeNotifierProvider` pour diffuser l'état de l'utilisateur.
// 🎯 À retenir pour la soutenance : "Ce contexte écoute les changements d'état Firebase Auth (`onIdTokenChanged`), protège les sessions démo contre l'écrasement asynchrone et fournit l'intégralité du contrat d'authentification."
// Module : Structure & Routage / Intégration écrans : l'équipe UI

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase.js';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';
import { demoAccounts } from '../mocks/index.js';
import { ROLES } from '@shared/constants.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronisation initiale Session Démo / Firebase Auth
  useEffect(() => {
    let isMounted = true;

    // 1. Restauration prioritaire d'une session de démonstration locale
    const savedDemo = localStorage.getItem('campussave_demo_session');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser({ uid: parsed.uid || 'demo-uid', email: parsed.email, displayName: parsed.displayName });
        setProfile(parsed);
        setRole(parsed.role || ROLES.STUDENT);
        if (parsed.role === ROLES.MERCHANT) {
          setMerchant({
            id: parsed.merchantId || 'merch-01',
            name: parsed.displayName,
            status: 'APPROVED',
            type: 'FAST_FOOD',
            location: { lat: 36.7885, lng: 10.1762 },
          });
        }
        setLoading(false);
      } catch {
        localStorage.removeItem('campussave_demo_session');
      }
    }

    const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

    // 2. Si mode mocks activé ou Firebase non configuré, terminer le chargement immédiatement
    if (useMocks || !auth || !isFirebaseConfigured) {
      if (isMounted) setLoading(false);
      return;
    }

    // 3. Écoute Firebase Auth sécurisée (ne jamais écraser une session démo locale avec un null asynchrone)
    try {
      const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        const currentDemo = localStorage.getItem('campussave_demo_session');

        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            const tokenResult = await firebaseUser.getIdTokenResult(true);
            const userRole = tokenResult.claims.role || null;
            setRole(userRole);

            const res = await apiClient.get(ENDPOINTS.ME);
            if (isMounted && res.data?.user) {
              setProfile(res.data.user);
              if (res.data.merchant) {
                setMerchant(res.data.merchant);
              }
              if (!userRole && res.data.user.role) {
                setRole(res.data.user.role);
              }
            }
          } catch {
            // Repli gracieux si l'appel /users/me échoue
            if (isMounted) {
              setProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              });
            }
          }
        } else if (!currentDemo) {
          // Uniquement si AUCUNE session de démonstration locale n'est active
          setUser(null);
          setProfile(null);
          setRole(null);
          setMerchant(null);
        }

        setLoading(false);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('Échec écoute onIdTokenChanged :', err.message);
      if (isMounted) setLoading(false);
    }
  }, []);

  /**
   * Connexion 1-clic pour le kit de démonstration (Étudiant, Commerçant, Administrateur)
   */
  const loginDemo = useCallback(async (typeOrRole) => {
    setError(null);
    const key = String(typeOrRole || 'student').toLowerCase();
    const normalizedKey = key.includes('merchant') ? 'merchant' : (key.includes('admin') ? 'admin' : 'student');
    const demo = demoAccounts[normalizedKey] || demoAccounts.student;

    let token = 'test-token:student-yassine:STUDENT:etudiant@essect.u-tunis.tn';
    let merchantData = null;

    if (demo.role === ROLES.MERCHANT) {
      token = 'test-token:m-baguette:MERCHANT:commercant@baguette.tn';
      merchantData = {
        id: demo.merchantId || 'merch-01',
        name: demo.displayName,
        status: 'APPROVED',
        type: 'FAST_FOOD',
        location: { lat: 36.7885, lng: 10.1762 },
      };
    } else if (demo.role === ROLES.ADMIN) {
      token = 'test-token:admin-uid:ADMIN:admin@campussave.tn';
    }

    const simulatedProfile = {
      uid: demo.uid || (demo.role === ROLES.ADMIN ? 'admin-uid' : (demo.role === ROLES.MERCHANT ? 'm-baguette' : 'student-yassine')),
      email: demo.email,
      displayName: demo.displayName,
      role: demo.role,
      token,
      merchantId: demo.merchantId || null,
      filiereId: demo.filiereId || null,
      phone: demo.phone || '+21698000000',
      ecoPoints: demo.ecoPoints || 90,
      loyaltyTier: demo.loyaltyTier || 'GRAINE',
      nextRewardAt: demo.nextRewardAt || 100,
      totalMoneySavedMillimes: demo.totalMoneySavedMillimes || 18000,
      totalCo2SavedGrams: demo.totalCo2SavedGrams || 4000,
      totalMealsRescued: demo.totalMealsRescued || 4,
      unlockedRewards: demo.unlockedRewards || [],
    };

    localStorage.setItem('campussave_demo_session', JSON.stringify(simulatedProfile));
    localStorage.setItem('campussave_token', token);

    setUser({ uid: simulatedProfile.uid, email: simulatedProfile.email, displayName: simulatedProfile.displayName });
    setProfile(simulatedProfile);
    setRole(demo.role);
    setMerchant(merchantData);
    setLoading(false);

    if (auth && isFirebaseConfigured) {
      try {
        await signInWithEmailAndPassword(auth, demo.email, demo.password);
      } catch {
        // En mode démo, l'authentification locale reste prioritaire
      }
    }

    return { user: simulatedProfile, role: demo.role };
  }, []);

  /**
   * Connexion avec email et mot de passe réels ou démo
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    localStorage.removeItem('campussave_demo_session');
    localStorage.removeItem('campussave_token');

    // Vérification rapide d'un compte de démo reconnu
    const foundDemoKey = Object.keys(demoAccounts).find((k) => demoAccounts[k].email === email);

    if (!auth || !isFirebaseConfigured) {
      if (foundDemoKey) {
        return loginDemo(foundDemoKey);
      }
      const fallbackProfile = {
        uid: `demo-user-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role: ROLES.STUDENT,
        filiereId: 'EBUSINESS_3A',
        ecoPoints: 90,
        loyaltyTier: 'GRAINE',
        nextRewardAt: 100,
        totalMoneySavedMillimes: 18000,
        totalCo2SavedGrams: 4000,
        totalMealsRescued: 4,
      };
      localStorage.setItem('campussave_demo_session', JSON.stringify(fallbackProfile));
      setUser({ uid: fallbackProfile.uid, email: fallbackProfile.email, displayName: fallbackProfile.displayName });
      setProfile(fallbackProfile);
      setRole(ROLES.STUDENT);
      setMerchant(null);
      setLoading(false);
      return { user: fallbackProfile, role: ROLES.STUDENT };
    }

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res;
    } catch (err) {
      if (foundDemoKey) {
        return loginDemo(foundDemoKey);
      }
      setError(err.message);
      throw err;
    }
  }, [loginDemo]);

  /**
   * Inscription Firebase Auth complète
   */
  const register = useCallback(async (email, password, additionalData = {}) => {
    setError(null);
    if (!auth) {
      const simulated = {
        uid: `user_${Date.now()}`,
        email,
        displayName: additionalData.displayName || email.split('@')[0],
        role: additionalData.role || ROLES.STUDENT,
        ...additionalData,
      };
      localStorage.setItem('campussave_demo_session', JSON.stringify(simulated));
      setUser(simulated);
      setProfile(simulated);
      setRole(simulated.role);
      return { user: simulated };
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential;
  }, []);

  /**
   * Enregistrement du profil après inscription
   */
  const registerProfile = useCallback(async (profileData) => {
    setError(null);
    try {
      const res = await apiClient.post(ENDPOINTS.REGISTER_PROFILE, profileData);
      if (res.data?.user) {
        setProfile(res.data.user);
        setRole(res.data.user.role);
      }
      return res.data;
    } catch (err) {
      console.warn('API registerProfile fallback:', err.message);
      return { ok: true };
    }
  }, []);

  /**
   * Commutateur de rôle rapide pour la démonstration
   */
  const switchRole = useCallback(async (targetRole) => {
    return loginDemo(targetRole);
  }, [loginDemo]);

  /**
   * Rafraîchit les Custom Claims et le profil
   */
  const refreshProfile = useCallback(async () => {
    // Session démo (jeton de test, pas d'utilisateur Firebase) : le profil local est simulé, donc on y fusionne
    // les champs de fidélité réels du serveur (EcoPoints, palier, repas sauvés) pour qu'ils suivent les retraits.
    if (!auth?.currentUser) {
      const hasDemoSession = Boolean(localStorage.getItem('campussave_demo_session'));
      if (!hasDemoSession) return;
      try {
        const res = await apiClient.get(ENDPOINTS.ME);
        const u = res.data?.user;
        if (u && u.role === ROLES.STUDENT) {
          setProfile((prev) => {
            if (!prev || prev.role !== ROLES.STUDENT) return prev;
            const merged = {
              ...prev,
              ecoPoints: Number.isFinite(u.ecoPoints) ? u.ecoPoints : prev.ecoPoints,
              loyaltyTier: u.loyaltyTier || prev.loyaltyTier,
              nextRewardAt: Number.isFinite(u.nextRewardAt) ? u.nextRewardAt : prev.nextRewardAt,
              totalMealsRescued: Number.isFinite(u.totalMealsRescued) ? u.totalMealsRescued : prev.totalMealsRescued,
              unlockedRewards: Array.isArray(u.unlockedRewards) ? u.unlockedRewards : prev.unlockedRewards,
            };
            try { localStorage.setItem('campussave_demo_session', JSON.stringify(merged)); } catch { /* quota */ }
            return merged;
          });
        }
      } catch {
        /* serveur injoignable : on garde le profil simulé local */
      }
      return;
    }
    if (auth?.currentUser) {
      try {
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        const userRole = tokenResult.claims.role || null;
        setRole(userRole);
        const res = await apiClient.get(ENDPOINTS.ME);
        if (res.data?.user) {
          setProfile(res.data.user);
          if (res.data.merchant) setMerchant(res.data.merchant);
          if (!userRole && res.data.user?.role) setRole(res.data.user.role);
        }
        return res.data;
      } catch (err) {
        console.error('Erreur rafraîchissement profil', err);
      }
    }
  }, []);

  /**
   * Mise à jour du profil utilisateur
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      const res = await apiClient.patch(ENDPOINTS.USERS_ME, updates);
      if (res.data?.user) {
        setProfile(res.data.user);
      }
      return res.data;
    } catch (err) {
      console.warn('API updateProfile fallback:', err.message);
      setProfile((prev) => ({ ...prev, ...updates }));
      return { user: { ...profile, ...updates } };
    }
  }, [profile]);

  /**
   * Déconnexion sécurisée
   */
  const logout = useCallback(async () => {
    localStorage.removeItem('campussave_demo_session');
    localStorage.removeItem('campussave_token');
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch {}
    }
    setUser(null);
    setProfile(null);
    setRole(null);
    setMerchant(null);
    setError(null);
  }, []);

  const value = {
    user,
    profile,
    role,
    merchant,
    loading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    registerProfile,
    demoLogin: loginDemo,
    loginAsDemo: loginDemo,
    loginDemo,
    switchRole,
    logout,
    refreshProfile,
    updateProfile,
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
