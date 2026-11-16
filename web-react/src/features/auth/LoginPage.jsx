// 💡 Concept & Analogie : Comme la porte d'entrée principale d'une faculté, cette page permet d'accéder aux espaces réservés après vérification d'identité.
// 🔄 Comparaison React / Flutter : Équivalent direct de `login_screen.dart` sous Flutter.
// 🎯 À retenir pour la soutenance : "Cette page intègre la validation inline sans dépendance externe et dispose de boutons 1-clic pour tester instantanément les 3 rôles de la démonstration."
// Module : Authentification & Sécurité

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '@shared/constants.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginDemo, isAuthenticated, role, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Redirection automatique si déjà connecté selon le rôle
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === ROLES.STUDENT) navigate('/app');
      else if (role === ROLES.MERCHANT) navigate('/merchant');
      else if (role === ROLES.ADMIN) navigate('/admin');
    }
  }, [isAuthenticated, role, navigate]);

  // Validation inline autonome (respectant la frontière de fichiers avec le binôme)
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'L adresse email est obligatoire';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Format d email invalide (ex: etudiant@essect.u-tunis.tn)';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est obligatoire';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit comporter au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      let msg = 'Identifiants incorrects ou compte inexistant';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Email ou mot de passe incorrect';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Trop de tentatives échouées. Veuillez patienter quelques instants.';
      }
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (type) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await loginDemo(type);
      if (type === 'student') navigate('/app');
      else if (type === 'merchant') navigate('/merchant');
      else if (type === 'admin') navigate('/admin');
    } catch {
      setServerError('Échec de la connexion démo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* En-tête CampusSave */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#CCFF00] text-black font-black text-xl mb-3 shadow-[0_0_20px_rgba(204,255,0,0.3)]">
          CS
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Campus<span className="text-[#CCFF00]">Save</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Plateforme anti-gaspillage & panier surprise — ESSECT Montfleury
        </p>
      </div>

      {/* Carte de Connexion Principale */}
      <div className="w-full max-w-md bg-[#16191E] border border-[#22272E] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Connexion à votre compte</h2>

        {serverError && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Champ Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Adresse Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="votre-nom@essect.u-tunis.tn"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0D0F12] border text-white text-sm outline-none transition duration-200 ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30'
                  : 'border-[#22272E] focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>
            )}
          </div>

          {/* Champ Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0D0F12] border text-white text-sm outline-none transition duration-200 ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30'
                  : 'border-[#22272E] focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40'
              }`}
            />
            {errors.password && (
              <p className="text-xs text-red-400 mt-1.5">{errors.password}</p>
            )}
          </div>

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={isSubmitting || authLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#CCFF00] text-black font-bold text-sm hover:bg-[#b8e600] active:scale-[0.99] transition duration-150 shadow-[0_0_15px_rgba(204,255,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-[#CCFF00] font-semibold hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>

      {/* Section Démonstration 1-Clic pour la Soutenance */}
      <div className="w-full max-w-md mt-6 bg-[#16191E]/70 border border-[#22272E] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#CCFF00] text-sm">⚡</span>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Kit de Démonstration ESSECT (1-Clic)
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Basculez instantanément entre les 3 profils types pour la présentation du jury :
        </p>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleDemoLogin('student')}
            className="p-2.5 rounded-xl bg-[#0D0F12] border border-[#22272E] hover:border-[#CCFF00] text-left transition group"
          >
            <div className="text-base mb-1">🎓</div>
            <div className="text-xs font-bold text-white group-hover:text-[#CCFF00]">Étudiant</div>
            <div className="text-[10px] text-slate-400 truncate">Yassine (EBUS)</div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('merchant')}
            className="p-2.5 rounded-xl bg-[#0D0F12] border border-[#22272E] hover:border-[#CCFF00] text-left transition group"
          >
            <div className="text-base mb-1">🏪</div>
            <div className="text-xs font-bold text-white group-hover:text-[#CCFF00]">Commerçant</div>
            <div className="text-[10px] text-slate-400 truncate">Baguette & Bag.</div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            className="p-2.5 rounded-xl bg-[#0D0F12] border border-[#22272E] hover:border-[#CCFF00] text-left transition group"
          >
            <div className="text-base mb-1">🛡️</div>
            <div className="text-xs font-bold text-white group-hover:text-[#CCFF00]">Admin</div>
            <div className="text-[10px] text-slate-400 truncate">ESSECT Admin</div>
          </button>
        </div>
      </div>
    </div>
  );
}
