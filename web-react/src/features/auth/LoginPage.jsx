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
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
        
        {/* =========================================================================
            COLONNE GAUCHE : POLAROID AUTHENTIQUE + REÇU THERMIQUE (IMAGE 3)
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md">
            
            {/* Ticket de caisse thermique en arrière-plan décalé */}
            <div className="absolute -top-6 -right-4 sm:-right-8 w-68 sm:w-76 rounded-xl bg-white text-[#111111] p-5 font-mono text-[11px] shadow-xl rotate-4 border border-[#111111]/8 hidden sm:block pointer-events-none select-none z-0">
              <div className="text-center font-anton text-xs uppercase tracking-wider pb-2 border-b border-dashed border-[#111111]/25">
                CAMPUSSAVE · MONTFLEURY
                <div className="text-[9px] font-sans font-normal text-[#666]">ESSECT 2026 · SERVICE MIDI & SOIR</div>
              </div>
              <div className="flex justify-between py-1 text-[10px] text-[#777]">
                <span>18/11/2026</span>
                <span>TABLE 07 · SERVEUR: FEDI</span>
              </div>
              <div className="space-y-1.5 py-2.5 border-t border-b border-dashed border-[#111111]/25 font-bold">
                <div className="flex justify-between">
                  <span>1x BAGUETTE FARCIE</span>
                  <span className="font-anton text-[#DA0711]">3.800 DT</span>
                </div>
                <div className="flex justify-between">
                  <span>1x PANIER MYSTÈRE</span>
                  <span className="font-anton text-[#DA0711]">2.500 DT</span>
                </div>
                <div className="flex justify-between line-through text-[#999]">
                  <span>0x GASPILLAGE ALIMENTAIRE</span>
                  <span>0 DÉCHET</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2.5 font-bold text-xs">
                <span>TOTAL :</span>
                <span className="text-[#DA0711] font-anton text-sm">A BRIGHTER DAY</span>
              </div>
              {/* Tampon Caoutchouc Rouge PAYÉ */}
              <div className="mt-2 text-center">
                <span className="griddle-stamp text-[10px] py-0.5 px-2">
                  PAID
                </span>
              </div>
              {/* Code-barres simulé en bas */}
              <div className="mt-3 pt-2 border-t border-dashed border-[#111111]/25 flex flex-col items-center">
                <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#111111,#111111_2px,transparent_2px,transparent_4px)] opacity-70" />
                <span className="text-[8px] font-bold tracking-widest text-[#777] mt-1">THANK YOU · COME HUNGRY</span>
              </div>
            </div>

            {/* Cadre Polaroid Avant-Plan Tilted -3deg */}
            <div className="relative z-10 w-full rs-polaroid rotate-[-3deg] cursor-pointer hover:rotate-0 transition-transform duration-300">
              {/* Morceaux de ruban adhésif jaune Griddle */}
              <span className="rs-tape-tl" />
              <span className="rs-tape-tr" />

              {/* Photo du Polaroid */}
              <div className="w-full aspect-[4/3] rounded overflow-hidden bg-[#EDE6D7] relative">
                <img
                  src="/assets/griddle/food/hero-double-smash-tray.png"
                  alt="Repas frais sauvé"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/griddle/food/burger-smash-classic.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                
                {/* Badge street food sur la photo */}
                <div className="absolute top-3 left-3">
                  <span className="sticker-red">
                    -50% À -70%
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className="px-3 py-1 rounded-full bg-[#FFD000] text-[#111111] text-[10px] font-anton shadow-sm">
                    ESSECT MONTFLEURY
                  </span>
                </div>
              </div>

              {/* Légende manuscrite sous le Polaroid */}
              <figcaption>
                first bite, best bite ♥
              </figcaption>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLONNE DROITE : HEADLINE CONDENSÉE + INPUTS + 1-CLICK DEMO BAR
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          {/* Titre éditorial percutant */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DA0711] text-white text-xs font-anton uppercase tracking-wider mb-3 shadow-sm">
              <Flame className="w-3.5 h-3.5" />
              <span>Plateforme Officielle ESSECT</span>
            </div>
            <h1 className="font-anton uppercase text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111111] leading-none">
              FAIT POUR ÊTRE <span className="text-[#DA0711]">PARTAGÉ.</span>
            </h1>
            <p className="mt-2 text-sm text-[#555] font-medium leading-relaxed">
              Connectez-vous pour sauver les invendus alimentaires chauds et frais des commerces de Montfleury à prix dégressif.
            </p>
          </div>

          {/* Erreur serveur éventuelle */}
          {serverError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* Formulaire d'authentification tactile */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-anton uppercase tracking-wider text-[#111111] mb-1.5">
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
                className={`w-full px-5 py-3 rounded-full bg-white border text-[#111111] text-sm outline-none transition-all font-medium ${
                  errors.email
                    ? 'border-[#DA0711] ring-1 ring-[#DA0711]'
                    : 'border-[#111111]/10 focus:border-[#DA0711] focus:ring-1 focus:ring-[#DA0711]'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-[#DA0711] font-bold mt-1">⚠️ {errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-anton uppercase tracking-wider text-[#111111] mb-1.5">
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
                  className={`w-full px-5 py-3 pr-12 rounded-full bg-white border text-[#111111] text-sm outline-none transition-all font-medium ${
                    errors.password
                      ? 'border-[#DA0711] ring-1 ring-[#DA0711]'
                      : 'border-[#111111]/10 focus:border-[#DA0711] focus:ring-1 focus:ring-[#DA0711]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#111111]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#DA0711] font-bold mt-1">⚠️ {errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-griddle-primary py-3.5 cursor-pointer shadow-md"
            >
              <span>{isSubmitting ? 'Connexion en cours...' : 'SE CONNECTER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Bar (Jury Soutenance) */}
          <div className="pt-4 border-t border-[#111111]/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-anton uppercase tracking-wider text-[#111111]">
                ⚡ ACCÈS RAPIDE 1-CLIC (JURY ESSECT) :
              </span>
              <span className="text-[10px] text-[#777] font-medium">Sans mot de passe</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl bg-[#EDE6D7] hover:bg-[#e2d9c7] border border-[#111111]/8 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group active:scale-95 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#DA0711] text-white flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-anton uppercase tracking-wider text-[#111111]">Étudiant</span>
                <span className="text-[9px] text-[#666] font-mono">Yassine</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('merchant')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl bg-[#EDE6D7] hover:bg-[#e2d9c7] border border-[#111111]/8 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group active:scale-95 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#FFD000] text-[#111111] flex items-center justify-center shadow-sm">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-anton uppercase tracking-wider text-[#111111]">Commerçant</span>
                <span className="text-[9px] text-[#666] font-mono">Baguette</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl bg-[#EDE6D7] hover:bg-[#e2d9c7] border border-[#111111]/8 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group active:scale-95 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#15803D] text-white flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-anton uppercase tracking-wider text-[#111111]">Admin</span>
                <span className="text-[9px] text-[#666] font-mono">ESSECT</span>
              </button>
            </div>
          </div>

          {/* Lien d'inscription */}
          <div className="text-center pt-2">
            <span className="text-xs text-[#666] font-medium">
              Pas encore inscrit sur CampusSave ?{' '}
            </span>
            <Link
              to="/register"
              className="text-xs font-anton uppercase tracking-wider text-[#DA0711] hover:underline"
            >
              Créer un compte étudiant ou commerçant →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
