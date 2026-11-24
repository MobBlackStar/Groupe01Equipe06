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
      {/* 💡 Concept : Polaroïd centré à gauche, formulaire principal pleine largeur empilé à droite et barre démo sur une ligne pour tenir dans 100vh sans aucun scroll */}
      {/* 🎯 Pour la soutenance : "La hiérarchie met en valeur la connexion réelle Firebase tout en gardant un accès démo 1-clic compact sous la main." */}
      <div className="cs-container py-5 sm:py-6 lg:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* =========================================================================
              COLONNE GAUCHE : POLAROID CENTRÉ + STICKERS KNEWAVE (sans logo orphelin)
              ========================================================================= */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[410px] px-3 py-3">
              <figure className="cs-polaroid lg:!p-3.5 lg:!pb-14 rotate-[-3deg] hover:rotate-0">
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
              <span className="cs-sticker cs-sticker-red absolute -top-1 right-0 z-20 text-[1.75rem] sm:text-[2.2rem] px-4 py-2">
                -70%
              </span>
              <span className="cs-sticker cs-sticker-mustard cs-sticker-tilt-r absolute bottom-14 left-0 sm:-left-2 z-20 text-[1.15rem] sm:text-[1.45rem] px-4 py-2">
                ANTI-GASPI
              </span>
            </div>
          </div>

          {/* =========================================================================
              COLONNE DROITE : HEADLINE ÉDITORIALE + CONNEXION EMPILÉE + BARRE DÉMO 1-LIGNE
              ========================================================================= */}
          <div className="order-1 lg:order-2 lg:col-span-7 w-full max-w-xl lg:max-w-none mx-auto lg:mx-0">
            <header className="mb-4">
              <p className="cs-eyebrow mb-1.5 inline-flex items-center gap-2">
                <Flame className="w-4 h-4" aria-hidden="true" />
                CampusSave · ESSECT Montfleury
              </p>
              <h1 className="cs-hero !text-[clamp(3rem,5.4vw,5.25rem)] !leading-[0.86]">
                {'FAIT POUR '}
                <span className="text-[#DA0711]">ÊTRE PARTAGÉ.</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#5E5850] leading-snug max-w-xl">
                Connectez-vous pour sauver les invendus alimentaires chauds et frais des commerces de Montfleury.
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

            {/* CŒUR PRINCIPAL : CONNEXION COMPTE RÉEL FIREBASE (champs empilés pleine largeur) */}
            <section aria-label="Connexion compte réel" className="p-4 sm:p-5 rounded-2xl border-2 border-[#111111] bg-white shadow-[4px_4px_0_#111111]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="cs-h3 !text-lg inline-flex items-center gap-2">
                  <span>🔐 Connexion</span>
                </h2>
                <span className="cs-label !text-[13px]">Compte réel Firebase</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
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
                    className="cs-input !min-h-[2.75rem] !py-1.5 !px-4 !text-[15px]"
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
                      className="cs-input !min-h-[2.75rem] !py-1.5 !pl-4 !pr-12 !text-[15px]"
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cs-btn cs-btn-red cs-btn-block !min-h-[3.25rem] !px-5 !text-lg"
                >
                  <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                  <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
                </button>
              </form>
            </section>

            {/* FINE BARRE COMPACTE DÉMO JURY SUR 1 LIGNE */}
            <section
              className="mt-3.5 px-3.5 py-2 rounded-2xl border-2 border-[#111111] bg-[#EDE6D7] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2"
              aria-label="Accès rapide démo jury"
            >
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-[#DA0711] whitespace-nowrap">
                <Zap className="w-4 h-4 fill-[#DA0711]" aria-hidden="true" />
                Démo Jury :
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {DEMO_ROLES.map(({ type, hint, Icon, iconClass }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDemoLogin(type)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-full border-2 border-[#111111] bg-[#FAF3E6] text-[13px] font-semibold uppercase tracking-wide cursor-pointer transition-all hover:bg-[#FFD000] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${iconClass}`}>
                      <Icon className="w-3 h-3" aria-hidden="true" />
                    </span>
                    <span>{hint}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Liens bas de formulaire regroupés à gauche pour éviter la mascotte bas-droite */}
            <div className="mt-3 pt-2 border-t border-dashed border-[#111111]/20 flex flex-wrap items-center justify-start gap-x-6 gap-y-1.5 text-[14px]">
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
