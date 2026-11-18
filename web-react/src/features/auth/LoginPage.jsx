// 💡 Concept & Analogie : Comme la porte d'entrée d'un diner rétro-futuriste, cette page plonge immédiatement l'utilisateur dans l'ambiance street-food tactile avec son Polaroid et son ticket de caisse vintage.
// 🔄 Comparaison React / Flutter : En React, la page utilise un agencement 2 colonnes avec Polaroid tactile et reçu thermique ; en Flutter, `login_screen.dart` adapte la mise en page en colonne simple scrollable.
// 🎯 À retenir pour la soutenance : "Le panneau d'accès intègre le 1-Click Demo Bar (Étudiant, Commerçant, Admin) pour démarrer l'évaluation du jury instantanément sans aucune saisie."
// Module : Authentification & Sécurité (M1)

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '@shared/constants.js';
import {
  Flame,
  GraduationCap,
  Store,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  Zap,
} from 'lucide-react';

// Tuiles du 1-Click Demo Bar (présentation uniquement)
const DEMO_ROLES = [
  { type: 'student', label: 'Étudiant', hint: 'Yassine', Icon: GraduationCap, iconClass: 'bg-[#DA0711] text-white' },
  { type: 'merchant', label: 'Commerçant', hint: 'Baguette', Icon: Store, iconClass: 'bg-[#FFD000] text-[#111111]' },
  { type: 'admin', label: 'Admin', hint: 'ESSECT', Icon: ShieldCheck, iconClass: 'bg-[#111111] text-[#FAF3E6]' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginDemo, isAuthenticated, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === ROLES.STUDENT) navigate('/app/explore', { replace: true });
      else if (role === ROLES.MERCHANT) navigate('/merchant/dashboard', { replace: true });
      else if (role === ROLES.ADMIN) navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "L'adresse email est obligatoire";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Format d'email invalide (ex: etudiant@essect.u-tunis.tn)";
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
      if (type === 'student') navigate('/app/explore', { replace: true });
      else if (type === 'merchant') navigate('/merchant/dashboard', { replace: true });
      else if (type === 'admin') navigate('/admin/dashboard', { replace: true });
    } catch {
      setServerError('Échec de la connexion démo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] overflow-x-hidden">
      <div className="cs-container cs-page">
        {/* Marque */}
        <Link
          to="/"
          className="inline-block font-title text-[#DA0711] text-2xl sm:text-3xl tracking-tight leading-none mb-10 lg:mb-14"
        >
          CAMPUSSAVE
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* =========================================================================
              COLONNE GAUCHE : POLAROID INCLINÉ + STICKERS KNEWAVE
              ========================================================================= */}
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="relative w-full max-w-[340px] sm:max-w-[460px] lg:max-w-[540px] px-3 sm:px-6 py-6">
              <figure className="cs-polaroid rotate-[-4deg] hover:rotate-[-1deg]">
                <span className="rs-tape-tl" />
                <span className="rs-tape-tr" />
                <div className="cs-photo rounded-[4px] aspect-square">
                  <img
                    src="/assets/griddle/food/teriyaki-poulet-bowl.webp"
                    alt="Bowl de poulet teriyaki sauvé des invendus"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/griddle/food/ramen-black-garlic.webp';
                    }}
                  />
                </div>
                <figcaption>sauvé &amp; savouré ♥</figcaption>
              </figure>

              {/* Stickers qui débordent du polaroid */}
              <span className="cs-sticker cs-sticker-red absolute -top-1 right-0 z-20 text-[2rem] sm:text-[2.6rem] px-5 py-3">
                -70%
              </span>
              <span className="cs-sticker cs-sticker-mustard cs-sticker-tilt-r absolute bottom-24 left-0 sm:-left-3 z-20 text-[1.35rem] sm:text-[1.7rem] px-5 py-2.5">
                ANTI-GASPI
              </span>
            </div>
          </div>

          {/* =========================================================================
              COLONNE DROITE : HEADLINE MONUMENTALE + FORMULAIRE + 1-CLICK DEMO BAR
              ========================================================================= */}
          <div className="order-1 lg:order-2 w-full max-w-xl lg:max-w-none mx-auto lg:mx-0">
            <header className="mb-10">
              <p className="cs-eyebrow mb-4 inline-flex items-center gap-2">
                <Flame className="w-4 h-4" aria-hidden="true" />
                Plateforme officielle ESSECT Montfleury
              </p>
              <h1 className="cs-hero text-[clamp(4rem,8vw,8.5rem)]">
                {'FAIT POUR '}
                <br />
                ÊTRE <span className="text-[#DA0711]">PARTAGÉ.</span>
              </h1>
              <p className="cs-lead mt-6 max-w-lg">
                Connectez-vous pour sauver les invendus alimentaires chauds et frais des commerces de Montfleury à prix dégressif.
              </p>
            </header>

            {/* Erreur serveur éventuelle */}
            {serverError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-[#DA0711] bg-white px-5 py-4 text-base font-semibold text-[#DA0711]"
              >
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Formulaire d'authentification */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="login-email" className="cs-field-label">
                  Adresse email universitaire
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="nom@essect.u-tunis.tn"
                  aria-invalid={errors.email ? 'true' : undefined}
                  className="cs-input"
                />
                {errors.email && <p className="cs-error-text">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="login-password" className="cs-field-label">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    placeholder="••••••••"
                    aria-invalid={errors.password ? 'true' : undefined}
                    className="cs-input pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#EDE6D7] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="cs-error-text">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="cs-btn cs-btn-red cs-btn-lg cs-btn-block"
              >
                <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </form>

            {/* 1-Click Demo Bar (Jury Soutenance) */}
            <section className="mt-12 pt-8 border-t-2 border-[#111111]" aria-label="Accès rapide démo">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
                <h2 className="cs-h3 inline-flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#DA0711]" aria-hidden="true" />
                  Accès rapide 1-clic · Jury
                </h2>
                <span className="cs-label">Sans mot de passe</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_ROLES.map(({ type, label, hint, Icon, iconClass }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDemoLogin(type)}
                    disabled={isSubmitting}
                    className="flex items-center gap-3 min-h-[64px] px-4 py-3 rounded-2xl border-2 border-[#111111] bg-[#FAF3E6] text-left cursor-pointer transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_4px_0_#111111] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${iconClass}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold uppercase text-lg leading-tight">{label}</span>
                      <span className="block cs-mono text-[13px] text-[#5E5850] leading-tight mt-0.5">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Lien d'inscription */}
            <p className="mt-10 text-base text-[#5E5850]">
              Pas encore inscrit sur CampusSave ?{' '}
              <Link to="/register" className="cs-link text-[#DA0711]">
                Créer un compte étudiant ou commerçant →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
