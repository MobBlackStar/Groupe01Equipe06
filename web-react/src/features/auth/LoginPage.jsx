// 💡 Concept & Analogie : Comme la porte d'entrée d'un diner rétro-futuriste, cette page plonge immédiatement l'utilisateur dans l'ambiance street-food tactile avec son Polaroid 3D et son ticket de caisse vintage.
// 🔄 Comparaison React / Flutter : En React, la page utilise un agencement 2 colonnes avec DepthCard 3D et Polaroid tactile ; en Flutter, `login_screen.dart` adapte la mise en page en colonne simple scrollable.
// 🎯 À retenir pour la soutenance : "Le panneau d'accès intègre le 1-Click Demo Bar (Étudiant, Commerçant, Admin) pour démarrer l'évaluation du jury instantanément sans aucune saisie."
// Module : Authentification & Sécurité (M1)

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '@shared/constants.js';
import { DepthCard, DepthLayer } from '../../components/common/DepthCard.jsx';
import {
  Flame,
  GraduationCap,
  Store,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Ruban Damier Diner en arrière-plan */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-diner-checker-subtle border-b-2 border-[#141210] opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-diner-checker-subtle border-t-2 border-[#141210] opacity-40 pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* =========================================================================
            COLONNE GAUCHE : 3D POLAROID FRAME + TICKET THERMIQUE
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-6">
          <DepthCard
            maxTilt={10}
            perspective={1200}
            className="w-full max-w-md relative p-4"
          >
            {/* Ticket de caisse thermique en arrière-plan décalé */}
            <div className="absolute -top-3 -right-3 sm:-right-6 w-72 sm:w-80 rounded-xl bg-[#FAF6EE] text-[#141210] p-4 font-mono text-[11px] shadow-[6px_6px_0px_#141210] rotate-3 border-2 border-[#141210] hidden sm:block pointer-events-none select-none">
              <div className="text-center font-black text-xs uppercase tracking-wider pb-2 border-b-2 border-dashed border-[#141210]/30">
                CAMPUSSAVE · MONTFLEURY
                <div className="text-[9px] font-normal text-[#555]">ESSECT 2026 · SERVICE MIDI & SOIR</div>
              </div>
              <div className="flex justify-between py-1 text-[10px] text-[#666] font-bold">
                <span>18/11/2026</span>
                <span>TABLE 07 · SERVEUR: FEDI</span>
              </div>
              <div className="space-y-1 py-2 border-t-2 border-b-2 border-dashed border-[#141210]/30 font-bold">
                <div className="flex justify-between">
                  <span>1x BAGUETTE FARCIE</span>
                  <span className="font-anton">3.800 DT</span>
                </div>
                <div className="flex justify-between">
                  <span>1x PANIER MYSTÈRE</span>
                  <span className="font-anton">2.500 DT</span>
                </div>
                <div className="flex justify-between line-through text-[#888]">
                  <span>0x GASPILLAGE ALIMENTAIRE</span>
                  <span>0 DÉCHET</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 font-black text-xs">
                <span>TOTAL SAUVÉ :</span>
                <span className="text-[#E51C23] font-anton text-base">6.300 DT</span>
              </div>
              {/* Tampon Caoutchouc Rouge PAYÉ */}
              <div className="absolute bottom-10 right-4">
                <span className="font-anton text-xs uppercase px-2 py-0.5 rounded bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#DC2626] rotate-[-8deg] shadow-sm">
                  [SAUVÉ & PAYÉ]
                </span>
              </div>
              {/* Code-barres simulé en bas */}
              <div className="mt-3 pt-2 border-t-2 border-dashed border-[#141210]/30 flex flex-col items-center">
                <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#141210,#141210_2px,transparent_2px,transparent_4px)] opacity-80" />
                <span className="text-[8px] font-bold tracking-widest text-[#555] mt-1">MERCI · SOUTENEZ L'ANTI-GASPI</span>
              </div>
            </div>

            {/* Cadre Polaroid Avant-Plan Tilted -3deg */}
            <div className="relative z-10 w-full rounded-xl bg-white p-4 pb-6 shadow-[8px_8px_0px_#141210] rotate-[-3deg] border-2 border-[#141210]">
              {/* Morceaux de ruban adhésif jaune */}
              <div
                aria-hidden="true"
                className="absolute -top-3 left-6 w-16 h-6 bg-[#FFD000]/80 border border-[#141210] shadow-sm rotate-[-15deg] pointer-events-none z-20"
              />
              <div
                aria-hidden="true"
                className="absolute -top-3 right-6 w-16 h-6 bg-[#FFD000]/80 border border-[#141210] shadow-sm rotate-[18deg] pointer-events-none z-20"
              />

              {/* Photo du Polaroid avec profondeur 3D */}
              <DepthLayer depth={25} shadow className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#141210] border-2 border-[#141210] relative">
                <img
                  src="/assets/griddle/food/hero-double-smash-tray.png"
                  alt="Repas frais sauvé"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/griddle/food/burger-smash-classic.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Badge street food sur la photo */}
                <div className="absolute top-3 left-3">
                  <span className="sticker-red">
                    -50% À -70%
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className="px-2.5 py-1 rounded-md bg-[#FFD000] text-[#141210] text-[10px] font-anton border border-[#141210] shadow-[1px_1px_0px_#141210]">
                    ESSECT MONTFLEURY
                  </span>
                </div>
              </DepthLayer>

              {/* Légende manuscrite sous le Polaroid */}
              <div className="mt-4 text-center">
                <p className="font-anton uppercase text-xl font-bold tracking-wider text-[#141210]">
                  FIRST BITE, BEST BITE ♥
                </p>
                <p className="text-[11px] text-[#555] font-bold">
                  Repas artisanaux sauvés minute chez vos commerçants favoris
                </p>
              </div>
            </div>
          </DepthCard>
        </div>

        {/* =========================================================================
            COLONNE DROITE : HEADLINE CONDENSÉE + INPUTS + 1-CLICK DEMO BAR
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          {/* Titre éditorial percutant */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E51C23] text-white text-xs font-anton tracking-wider mb-3 border-2 border-[#141210] shadow-[2px_2px_0px_#141210]">
              <Flame className="w-3.5 h-3.5" />
              <span>Plateforme Officielle ESSECT</span>
            </div>
            <h1 className="font-anton uppercase text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#141210] leading-none">
              FAIT POUR ÊTRE <span className="text-[#E51C23]">PARTAGÉ.</span>
            </h1>
            <p className="mt-2 text-sm text-[#555] font-medium leading-relaxed">
              Connectez-vous pour sauver les invendus alimentaires chauds et frais des commerces de Montfleury à prix dégressif.
            </p>
          </div>

          {/* Erreur serveur éventuelle */}
          {serverError && (
            <div className="p-3.5 rounded-lg bg-[#FEE2E2] border-2 border-[#DC2626] text-[#B91C1C] text-xs font-bold flex items-center gap-2.5 shadow-[2px_2px_0px_#DC2626]">
              <span className="text-base">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* Formulaire d'authentification tactile */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-1.5">
                Adresse Email Universitaire
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="nom@essect.u-tunis.tn"
                className={`w-full px-4 py-2.5 rounded-lg bg-white border-2 text-[#141210] text-sm outline-none transition-all font-medium ${
                  errors.email
                    ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]'
                    : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23] focus:shadow-[3px_3px_0px_#141210]'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-[#E51C23] font-bold mt-1">⚠️ {errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-1.5">
                Mot de Passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 pr-11 rounded-lg bg-white border-2 text-[#141210] text-sm outline-none transition-all font-medium ${
                    errors.password
                      ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]'
                      : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23] focus:shadow-[3px_3px_0px_#141210]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#141210]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#E51C23] font-bold mt-1">⚠️ {errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-griddle-primary py-3 cursor-pointer"
            >
              <span>{isSubmitting ? 'Connexion en cours...' : 'SE CONNECTER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Bar (Jury Soutenance) */}
          <div className="pt-4 border-t-2 border-[#141210]/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-anton uppercase tracking-wider text-[#141210]">
                ⚡ ACCÈS RAPIDE 1-CLIC (JURY ESSECT) :
              </span>
              <span className="text-[10px] text-[#777] font-bold">Sans mot de passe</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                disabled={isSubmitting}
                className="p-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#FEE2E2] border-2 border-[#141210] shadow-[3px_3px_0px_#141210] flex flex-col items-center gap-1 transition-all text-center cursor-pointer group active:translate-x-[2px] active:translate-y-[2px]"
              >
                <div className="w-7 h-7 rounded-full bg-[#E51C23] text-white flex items-center justify-center border border-[#141210]">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-anton text-[#141210]">Étudiant</span>
                <span className="text-[9px] text-[#666] font-mono">Yassine</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('merchant')}
                disabled={isSubmitting}
                className="p-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#FEF08A] border-2 border-[#141210] shadow-[3px_3px_0px_#141210] flex flex-col items-center gap-1 transition-all text-center cursor-pointer group active:translate-x-[2px] active:translate-y-[2px]"
              >
                <div className="w-7 h-7 rounded-full bg-[#FFD000] text-[#141210] flex items-center justify-center border border-[#141210]">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-anton text-[#141210]">Commerçant</span>
                <span className="text-[9px] text-[#666] font-mono">Baguette</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={isSubmitting}
                className="p-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#DCFCE7] border-2 border-[#141210] shadow-[3px_3px_0px_#141210] flex flex-col items-center gap-1 transition-all text-center cursor-pointer group active:translate-x-[2px] active:translate-y-[2px]"
              >
                <div className="w-7 h-7 rounded-full bg-[#15803D] text-white flex items-center justify-center border border-[#141210]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-anton text-[#141210]">Admin</span>
                <span className="text-[9px] text-[#666] font-mono">ESSECT</span>
              </button>
            </div>
          </div>

          {/* Lien d'inscription */}
          <div className="text-center pt-2">
            <span className="text-xs text-[#555] font-medium">
              Pas encore inscrit sur CampusSave ?{' '}
            </span>
            <Link
              to="/register"
              className="text-xs font-black text-[#E51C23] hover:underline"
            >
              Créer un compte étudiant ou commerçant →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
