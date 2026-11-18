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
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginDemo, isAuthenticated, role, loading: authLoading } = useAuth();

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
    <div className="min-h-screen bg-[#0E0D0C] text-[#F6F1E7] flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Halo lumineux d'ambiance */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#EE3124]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#F5C400]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* =========================================================================
            COLONNE GAUCHE : 3D POLAROID FRAME + THERMAL RECEIPT (image.png)
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-6">
          <DepthCard
            maxTilt={12}
            perspective={1200}
            className="w-full max-w-md relative p-4"
          >
            {/* Ticket de caisse thermique en arrière-plan décalé */}
            <div className="absolute -top-3 -right-3 sm:-right-6 w-72 sm:w-80 rounded-xl bg-[#F6F1E7] text-[#161412] p-4 font-mono text-[11px] shadow-2xl rotate-3 border border-black/10 hidden sm:block pointer-events-none select-none">
              <div className="text-center font-bold text-xs uppercase tracking-wider pb-2 border-b border-dashed border-[#161412]/30">
                CAMPUSSAVE · MONTFLEURY
                <div className="text-[9px] font-normal text-[#161412]/70">ESSECT 2026 · SERVICE MIDI & SOIR</div>
              </div>
              <div className="flex justify-between py-1 text-[10px] text-[#161412]/60">
                <span>18/11/2026</span>
                <span>TABLE 07 · SERVEUR: FEDI</span>
              </div>
              <div className="space-y-1 py-2 border-t border-b border-dashed border-[#161412]/30">
                <div className="flex justify-between">
                  <span>1x BAGUETTE FARCIE</span>
                  <span className="font-bold">3.800 DT</span>
                </div>
                <div className="flex justify-between">
                  <span>1x PANIER MYSTÈRE</span>
                  <span className="font-bold">2.500 DT</span>
                </div>
                <div className="flex justify-between line-through text-[#161412]/40">
                  <span>0x GASPILLAGE ALIMENTAIRE</span>
                  <span>0.000 DT</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-xs">
                <span>TOTAL SAUVÉ :</span>
                <span className="text-[#EE3124] font-black text-sm">6.300 DT</span>
              </div>
              {/* Tampon Caoutchouc Rouge PAYÉ */}
              <div className="absolute bottom-10 right-4">
                <span className="rubber-stamp rubber-stamp-red text-[11px] px-2 py-0.5">
                  [SAUVÉ & PAYÉ]
                </span>
              </div>
              {/* Code-barres simulé en bas */}
              <div className="mt-3 pt-2 border-t border-dashed border-[#161412]/30 flex flex-col items-center">
                <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#161412,#161412_2px,transparent_2px,transparent_4px)] opacity-70" />
                <span className="text-[8px] tracking-widest text-[#161412]/60 mt-1">MERCI · SOUTENEZ L'ANTI-GASPI</span>
              </div>
            </div>

            {/* Cadre Polaroid Avant-Plan Tilted -3deg */}
            <div className="relative z-10 w-full rounded-2xl bg-white p-4 pb-6 shadow-2xl rotate-[-3deg] border border-stone-200">
              {/* Morceaux de ruban adhésif jaune translucide aux coins supérieurs */}
              <div
                aria-hidden="true"
                className="absolute -top-3.5 left-6 w-16 h-7 bg-[#F5C400]/40 border border-white/40 shadow-sm backdrop-blur-[1px] rotate-[-15deg] pointer-events-none z-20"
              />
              <div
                aria-hidden="true"
                className="absolute -top-3.5 right-6 w-16 h-7 bg-[#F5C400]/40 border border-white/40 shadow-sm backdrop-blur-[1px] rotate-[18deg] pointer-events-none z-20"
              />

              {/* Photo du Polaroid avec profondeur 3D */}
              <DepthLayer depth={25} shadow className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-stone-900 relative">
                <img
                  src="/assets/framer/burgers/hero-double-smash-tray.png"
                  alt="Repas frais sauvé"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Badge street food sur la photo */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-[#EE3124] text-white text-[10px] font-oswald uppercase tracking-wider font-bold shadow-md">
                    -50% À -70%
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/80 text-[#F5C400] text-[10px] font-mono font-bold border border-white/10">
                    ESSECT MONTFLEURY
                  </span>
                </div>
              </DepthLayer>

              {/* Légende manuscrite sous le Polaroid */}
              <div className="mt-4 text-center">
                <p className="font-oswald uppercase text-lg sm:text-xl font-bold tracking-wider text-[#161412]">
                  FIRST BITE, BEST BITE ♥
                </p>
                <p className="text-[11px] text-stone-500 font-sans">
                  Repas artisanaux sauvés minute chez vos commerçants favoris
                </p>
              </div>
            </div>
          </DepthCard>
        </div>

        {/* =========================================================================
            COLONNE DROITE : HEADLINE CONDENSÉE + INPUTS TACTILES + 1-CLICK DEMO (image9.png)
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          {/* Titre éditorial percutant */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EE3124]/10 border border-[#EE3124]/30 text-[#EE3124] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5" />
              <span>Plateforme Officielle ESSECT</span>
            </div>
            <h1 className="font-oswald uppercase text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
              MADE TO BE <span className="text-[#EE3124]">SHARED.</span>
            </h1>
            <p className="mt-3 text-sm text-[#F6F1E7]/70 font-sans leading-relaxed">
              Connectez-vous pour sauver les invendus alimentaires chauds et frais des commerces de Montfleury à prix dégressif.
            </p>
          </div>

          {/* Erreur serveur éventuelle */}
          {serverError && (
            <div className="p-3.5 rounded-2xl bg-[#EE3124]/15 border border-[#EE3124]/40 text-[#EE3124] text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
              <span className="text-base">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* Formulaire d'authentification tactile */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[#F6F1E7]/60 mb-1.5">
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
                className={`w-full px-4 py-3 rounded-2xl bg-[#161412] border text-[#F6F1E7] text-sm outline-none transition-all ${
                  errors.email
                    ? 'border-[#EE3124] ring-1 ring-[#EE3124]/40'
                    : 'border-white/15 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/20'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-[#EE3124] mt-1 font-semibold">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#F6F1E7]/60">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#F5C400] hover:underline flex items-center gap-1 font-bold"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
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
                className={`w-full px-4 py-3 rounded-2xl bg-[#161412] border text-[#F6F1E7] text-sm outline-none transition-all ${
                  errors.password
                    ? 'border-[#EE3124] ring-1 ring-[#EE3124]/40'
                    : 'border-white/15 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/20'
                }`}
              />
              {errors.password && (
                <p className="text-xs text-[#EE3124] mt-1 font-semibold">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#EE3124] to-[#F5C400] text-black font-oswald uppercase text-base font-black tracking-wider shadow-lg shadow-[#EE3124]/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Connexion en cours...' : 'Se Connecter à CampusSave'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>

          {/* =========================================================================
              1-CLICK DEMO BAR (JURY SOUTENANCE) — Inspiré par image9.png
              ========================================================================= */}
          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5C400] font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Comptes de Démo 1-Clic (Soutenance Jury) :</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl bg-[#161412] border border-white/15 hover:border-[#EE3124] hover:bg-[#EE3124]/10 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-[#EE3124]/20 text-[#EE3124]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-[#EE3124] transition-colors">
                    Étudiant
                  </span>
                </div>
                <p className="text-[10px] text-[#F6F1E7]/50 font-sans">Yassine · 3A E-Biz</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('merchant')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl bg-[#161412] border border-white/15 hover:border-[#F5C400] hover:bg-[#F5C400]/10 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-[#F5C400]/20 text-[#F5C400]">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-[#F5C400] transition-colors">
                    Commerçant
                  </span>
                </div>
                <p className="text-[10px] text-[#F6F1E7]/50 font-sans">Baguette & Baguette</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={isSubmitting}
                className="p-3 rounded-2xl bg-[#161412] border border-white/15 hover:border-[#2E6F40] hover:bg-[#2E6F40]/10 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-[#2E6F40]/20 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-[#F6F1E7]/50 font-sans">Direction ESSECT</p>
              </button>
            </div>
          </div>

          {/* Lien d'inscription */}
          <div className="text-center pt-2">
            <span className="text-xs text-[#F6F1E7]/60">Pas encore de compte ? </span>
            <Link
              to="/register"
              className="text-xs font-bold text-[#F5C400] hover:underline"
            >
              Rejoindre la communauté étudiante →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
