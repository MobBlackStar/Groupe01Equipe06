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
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] overflow-x-hidden flex flex-col justify-center">
      {/* 💡 Concept : Centrage vertical complet pour garder le formulaire et le CTA au-dessus de la ligne de flottaison sur desktop */}
      {/* 🎯 Pour la soutenance : "La page de connexion tient en un seul écran sur ordinateur (zero scroll) tout en préservant l'esthétique Polaroid Griddle." */}
      <div className="cs-container py-5 sm:py-6 lg:py-4">
        {/* Logo mobile/tablette uniquement en haut ; sur desktop il vit au-dessus du Polaroid pour supprimer le vide supérieur */}
        <div className="lg:hidden mb-5">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="CampusSave — accueil">
            <img src="/assets/brand/logo-full-512.png" alt="CampusSave" width="120" height="107" className="h-16 w-auto" decoding="async" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* =========================================================================
              COLONNE GAUCHE : MARQUE + POLAROID INCLINÉ + STICKERS KNEWAVE
              ========================================================================= */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col items-center">
            <Link to="/" className="hidden lg:inline-flex items-center gap-3 mb-4 self-start" aria-label="CampusSave — accueil">
              <img src="/assets/brand/logo-full-512.png" alt="CampusSave" width="120" height="107" className="h-14 xl:h-16 w-auto" decoding="async" />
            </Link>

            <div className="relative w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[380px] px-3 py-3">
              <figure className="cs-polaroid lg:!p-3 lg:!pb-12 rotate-[-3deg] hover:rotate-0">
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
              <span className="cs-sticker cs-sticker-red absolute -top-1 right-0 z-20 text-[1.75rem] sm:text-[2.1rem] px-4 py-2">
                -70%
              </span>
              <span className="cs-sticker cs-sticker-mustard cs-sticker-tilt-r absolute bottom-14 left-0 sm:-left-2 z-20 text-[1.15rem] sm:text-[1.4rem] px-4 py-2">
                ANTI-GASPI
              </span>
            </div>
          </div>

          {/* =========================================================================
              COLONNE DROITE : HEADLINE + DÉMO 1-CLIC + FORMULAIRE COMPACT ZERO-SCROLL
              ========================================================================= */}
          <div className="order-1 lg:order-2 lg:col-span-7 w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0">
            <header className="mb-4">
              <p className="cs-eyebrow mb-1.5 inline-flex items-center gap-2">
                <Flame className="w-4 h-4" aria-hidden="true" />
                Plateforme officielle ESSECT Montfleury
              </p>
              <h1 className="cs-hero !text-[clamp(2.6rem,4.6vw,4.5rem)] !leading-[0.88]">
                {'FAIT POUR '}
                <span className="text-[#DA0711]">ÊTRE PARTAGÉ.</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#5E5850] leading-snug max-w-xl">
                Sauvez les invendus alimentaires chauds et frais des commerces de Montfleury à prix dégressif.
              </p>
            </header>

            {/* Erreur serveur éventuelle */}
            {serverError && (
              <div
                role="alert"
                className="mb-3 flex items-start gap-2.5 rounded-2xl border-2 border-[#DA0711] bg-white px-4 py-2.5 text-sm font-semibold text-[#DA0711]"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{serverError}</span>
              </div>
            )}

            {/* OPTION A : 1-CLICK DEMO BAR (JURY SOUTENANCE) */}
            <section className="mb-3.5 p-3.5 sm:p-4 rounded-2xl border-2 border-[#111111] bg-white shadow-[3px_3px_0_#111111]" aria-label="Accès rapide démo jury">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <h2 className="cs-h3 !text-lg inline-flex items-center gap-2 text-[#DA0711]">
                  <Zap className="w-4 h-4 fill-[#DA0711]" aria-hidden="true" />
                  Option A · Démo 1-Clic Jury
                </h2>
                <span className="cs-label !text-[13px] bg-[#FFD000]/25 px-2.5 py-0.5 rounded border border-[#FFD000] text-[#111111]">
                  Sans mot de passe
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEMO_ROLES.map(({ type, label, hint, Icon, iconClass }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDemoLogin(type)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2.5 min-h-[52px] px-3 py-2 rounded-xl border-2 border-[#111111] bg-[#FAF3E6] text-left cursor-pointer transition-all duration-200 hover:bg-[#FFD000]/20 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#111111] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${iconClass}`}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold uppercase text-[15px] leading-tight">{label}</span>
                      <span className="block cs-mono text-[13px] text-[#5E5850] leading-tight mt-0.5">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* SÉPARATEUR VISUEL OU */}
            <div className="my-3 flex items-center gap-3" aria-hidden="true">
              <div className="h-[2px] flex-1 bg-[#111111]/85" />
              <span className="font-bold text-[13px] uppercase px-3 py-0.5 bg-[#FAF3E6] border-2 border-[#111111] rounded-full text-[#111111] tracking-wider">
                OU COMPTE RÉEL
              </span>
              <div className="h-[2px] flex-1 bg-[#111111]/85" />
            </div>

            {/* OPTION B : FORMULAIRE COMPTE RÉEL FIREBASE */}
            <section aria-label="Connexion compte réel" className="p-3.5 sm:p-4 rounded-2xl border-2 border-[#111111]/15 bg-[#FFFDF8]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <h2 className="cs-h3 !text-lg inline-flex items-center gap-2">
                  <span>🔐 Option B · Compte Réel Firebase</span>
                </h2>
                <span className="cs-label !text-[13px]">Email &amp; Mot de passe</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="login-email" className="cs-field-label !text-[13px] !mb-1">
                      Adresse email
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
                      placeholder="etudiant@essect.u-tunis.tn"
                      aria-invalid={errors.email ? 'true' : undefined}
                      className="cs-input !min-h-[2.85rem] !py-1.5 !px-4 !text-[15px]"
                    />
                    {errors.email && <p className="cs-error-text !text-[13px] !mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="login-password" className="cs-field-label !text-[13px] !mb-1">
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
                        className="cs-input !min-h-[2.85rem] !py-1.5 !pl-4 !pr-12 !text-[15px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#EDE6D7] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="cs-error-text !text-[13px] !mt-1">{errors.password}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cs-btn cs-btn-red cs-btn-block !min-h-[3rem] !px-4 !text-[15px] sm:!text-base"
                >
                  <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter au compte réel'}</span>
                  <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
                </button>
              </form>
            </section>

            {/* Liens bas de formulaire regroupés à gauche pour éviter la mascotte flottante bas-droite */}
            <div className="mt-3 pt-2.5 border-t border-dashed border-[#111111]/20 flex flex-wrap items-center justify-start gap-x-6 gap-y-1.5 text-[14px]">
              <p className="text-[#5E5850]">
                Pas encore inscrit ?{' '}
                <Link to="/register" className="cs-link text-[#DA0711]">
                  Créer un compte →
                </Link>
              </p>
              <a
                href={import.meta.env.VITE_APK_DOWNLOAD_URL || 'https://github.com/MobBlackStar/campussave-releases/releases/latest/download/CampusSave.apk'}
                download="CampusSave.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#DA0711] hover:underline inline-flex items-center gap-1"
              >
                <span>📱 APK Android →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
