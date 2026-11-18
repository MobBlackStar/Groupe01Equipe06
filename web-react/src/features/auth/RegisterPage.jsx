// 💡 Concept & Analogie : Comme le guichet de bienvenue d'un club exclusif où l'on reçoit son badge de membre et sa carte de fidélité tactile.
// 🔄 Comparaison React / Flutter : En React, `RegisterPage` propose un parcours interactif 2 colonnes avec Polaroid 3D et tickets thermiques ; en Flutter, `RegisterScreen` adapte l'agencement pour mobile.
// 🎯 À retenir pour la soutenance : "L'inscription attribue un rôle scellé dans les Custom Claims Firebase et crée instantanément le profil local avec initialisation des EcoPoints pour la démonstration."
// Module : Authentification & Sécurité (M1)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { ROLES, FILIERES } from '@shared/constants.js';
import { registerSchema } from './auth.schemas.js';
import { DepthCard, DepthLayer } from '../../components/common/DepthCard.jsx';
import {
  Flame,
  GraduationCap,
  Store,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    role: ROLES.STUDENT,
    displayName: '',
    email: '',
    password: '',
    phone: '+216',
    filiereId: FILIERES.EBUSINESS_3A,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverMsg, setServerMsg] = useState(null);

  const filiereOptions = [
    { value: FILIERES.EBUSINESS_3A, label: '🎓 3ème E-Business (Business Computing)' },
    { value: FILIERES.FINANCE, label: '📈 Licence / Master Finance' },
    { value: FILIERES.MARKETING, label: '🎯 Licence / Master Marketing' },
    { value: FILIERES.GESTION, label: '📊 Sciences de Gestion' },
    { value: FILIERES.COMPTABILITE, label: '📑 Comptabilité & Fiscalité' },
  ];

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setServerMsg(null);

    // 1. Validation Zod locale
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setServerMsg({ type: 'error', text: 'Veuillez corriger les erreurs indiquées ci-dessous.' });
      return;
    }

    setLoading(true);

    try {
      let uid = `user_${Date.now()}`;
      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          uid = userCredential.user.uid;
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use' || authErr.code === 'auth/weak-password') {
            throw authErr;
          }
          console.warn('Firebase Auth inscription repli mode démo :', authErr.message);
        }
      }

      // Persistance de la session locale pour la démonstration
      const demoSession = {
        uid,
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        filiereId: formData.role === ROLES.STUDENT ? formData.filiereId : null,
        phone: formData.phone,
        ecoPoints: 0,
        loyaltyTier: 'GRAINE',
        nextRewardAt: 100,
        totalMealsRescued: 0,
        unlockedRewards: [],
      };
      localStorage.setItem('campussave_demo_session', JSON.stringify(demoSession));

      // Appel endpoint backend
      try {
        await apiClient.post(ENDPOINTS.REGISTER_PROFILE, {
          role: formData.role,
          displayName: formData.displayName,
          phone: formData.phone,
          filiereId: formData.role === ROLES.STUDENT ? formData.filiereId : null,
        });
      } catch (apiErr) {
        console.warn('Backend register-profile fallback:', apiErr.message);
      }

      setServerMsg({
        type: 'success',
        text: 'Compte créé avec succès ! Bienvenue dans la communauté CampusSave.',
      });

      setTimeout(() => {
        if (formData.role === ROLES.MERCHANT) {
          navigate('/merchant/dashboard');
        } else {
          navigate('/app/explore');
        }
      }, 900);
    } catch (err) {
      console.error('Erreur inscription:', err);
      let errorMsg = "Une erreur est survenue lors de l'inscription.";
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Cette adresse email est déjà associée à un compte.';
        setErrors((prev) => ({ ...prev, email: errorMsg }));
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Le mot de passe choisi doit comporter au moins 6 caractères.';
        setErrors((prev) => ({ ...prev, password: errorMsg }));
      }
      setServerMsg({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">
        
        {/* =========================================================================
            COLONNE GAUCHE : POLAROID AUTHENTIQUE + REÇU THERMIQUE (IMAGE 3)
            ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-sm">
            
            {/* Ticket de bienvenue thermique en arrière-plan */}
            <div className="absolute -top-5 -right-4 w-68 rounded-xl bg-white text-[#111111] p-5 font-mono text-[11px] shadow-xl rotate-4 border border-[#111111]/8 hidden sm:block pointer-events-none select-none z-0">
              <div className="text-center font-anton text-xs uppercase tracking-wider pb-2 border-b border-dashed border-[#111111]/25">
                NOUVEAU MEMBRE · ESSECT
                <div className="text-[9px] font-sans font-normal text-[#666]">COMMUNAUTÉ ANTI-GASPI 2026</div>
              </div>
              <div className="py-2.5 space-y-1.5 text-[10px] font-bold border-b border-dashed border-[#111111]/25">
                <div className="flex justify-between">
                  <span>CARTE FIDÉLITÉ :</span>
                  <span className="text-[#DA0711] font-anton">ACTIVÉE</span>
                </div>
                <div className="flex justify-between">
                  <span>CLASSEMENT FILIÈRE :</span>
                  <span>INCLUS</span>
                </div>
                <div className="flex justify-between">
                  <span>RADAR 3D TEMPS RÉEL :</span>
                  <span className="text-[#15803D]">DISPONIBLE</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="griddle-stamp text-[10px] py-0.5 px-2">
                  WELCOME
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-dashed border-[#111111]/25 flex flex-col items-center">
                <div className="h-5 w-full bg-[repeating-linear-gradient(90deg,#111111,#111111_2px,transparent_2px,transparent_4px)] opacity-70" />
                <span className="text-[8px] font-bold tracking-widest text-[#777] mt-1">FIRST BITE · ZERO WASTE</span>
              </div>
            </div>

            {/* Cadre Polaroid Avant-Plan Tilted -3deg */}
            <div className="relative z-10 w-full rs-polaroid rotate-[-3deg] cursor-pointer hover:rotate-0 transition-transform duration-300">
              <span className="rs-tape-tl" />
              <span className="rs-tape-tr" />

              <div className="w-full aspect-[4/3] rounded overflow-hidden bg-[#EDE6D7] relative">
                <img
                  src="/assets/griddle/food/box-assortiment-fika.png"
                  alt="Assortiment box"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/griddle/food/croissant-amande.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3">
                  <span className="sticker-yellow">
                    ZÉRO GASPILLAGE
                  </span>
                </div>
              </div>

              <figcaption>
                rejoins la communauté ♥
              </figcaption>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLONNE DROITE : FORMULAIRE D'INSCRIPTION & SÉLECTEUR DE RÔLE
            ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DA0711] text-white text-xs font-anton uppercase tracking-wider mb-2 shadow-sm">
              <Flame className="w-3.5 h-3.5" />
              <span>Campus ESSECT Montfleury</span>
            </div>
            <h1 className="font-anton uppercase text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#111111] leading-none">
              REJOINS LE <span className="text-[#DA0711]">CLUB.</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#555] font-medium leading-relaxed">
              Créez votre compte en quelques secondes pour accéder aux offres anti-gaspi ou publier vos surplus.
            </p>
          </div>

          {serverMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                serverMsg.type === 'success'
                  ? 'bg-[#DCFCE7] text-[#15803D] border border-[#166534]/20'
                  : 'bg-[#FEE2E2] text-[#DA0711] border border-[#DA0711]/20'
              }`}
            >
              <span>{serverMsg.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{serverMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Choix du rôle Étudiant vs Commerçant */}
            <div>
              <label className="block text-[11px] font-anton uppercase tracking-wider text-[#111111] mb-2">
                Vous êtes :
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('role', ROLES.STUDENT)}
                  className={`p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between cursor-pointer border ${
                    formData.role === ROLES.STUDENT
                      ? 'bg-[#FEE2E2] border-[#DA0711] shadow-sm'
                      : 'bg-white border-[#111111]/10 hover:bg-[#EDE6D7]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <GraduationCap className={`w-5 h-5 ${formData.role === ROLES.STUDENT ? 'text-[#DA0711]' : 'text-[#777]'}`} />
                    {formData.role === ROLES.STUDENT && <Check className="w-4 h-4 text-[#DA0711]" />}
                  </div>
                  <div>
                    <span className="text-xs font-anton uppercase block text-[#111111]">Étudiant ESSECT</span>
                    <span className="text-[10px] text-[#666] font-medium">Acheter & sauver des repas</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('role', ROLES.MERCHANT)}
                  className={`p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between cursor-pointer border ${
                    formData.role === ROLES.MERCHANT
                      ? 'bg-[#FEF08A] border-[#A16207]/30 shadow-sm'
                      : 'bg-white border-[#111111]/10 hover:bg-[#EDE6D7]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Store className={`w-5 h-5 ${formData.role === ROLES.MERCHANT ? 'text-[#111111]' : 'text-[#777]'}`} />
                    {formData.role === ROLES.MERCHANT && <Check className="w-4 h-4 text-[#111111]" />}
                  </div>
                  <div>
                    <span className="text-xs font-anton uppercase block text-[#111111]">Commerçant Partenaire</span>
                    <span className="text-[10px] text-[#666] font-medium">Publier & scanner les tickets</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Filière si étudiant */}
            {formData.role === ROLES.STUDENT && (
              <div>
                <label className="block text-[11px] font-anton uppercase tracking-wider text-[#111111] mb-1.5">
                  Filière Universitaire ESSECT
                </label>
                <select
                  value={formData.filiereId || ''}
                  onChange={(e) => handleChange('filiereId', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#111111]/15 text-[#111111] text-xs font-bold outline-none cursor-pointer focus:border-[#DA0711]"
                >
                  {filiereOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#111111]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Grille des champs principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-anton uppercase tracking-wider text-[#111111] mb-1">
                  Nom Complet
                </label>
                <input
                  type="text"
                  placeholder="Ritej Bejaoui"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-full bg-white border text-[#111111] text-xs font-medium outline-none transition-all ${
                    errors.displayName ? 'border-[#DA0711]' : 'border-[#111111]/15 focus:border-[#DA0711]'
                  }`}
                />
                {errors.displayName && <p className="text-[10px] text-[#DA0711] font-bold mt-0.5">{errors.displayName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-anton uppercase tracking-wider text-[#111111] mb-1">
                  Téléphone (+216)
                </label>
                <input
                  type="tel"
                  placeholder="+21698000000"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-full bg-white border text-[#111111] text-xs font-medium outline-none transition-all ${
                    errors.phone ? 'border-[#DA0711]' : 'border-[#111111]/15 focus:border-[#DA0711]'
                  }`}
                />
                {errors.phone && <p className="text-[10px] text-[#DA0711] font-bold mt-0.5">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-anton uppercase tracking-wider text-[#111111] mb-1">
                  Adresse Email
                </label>
                <input
                  type="email"
                  placeholder="etudiant@essect.u-tunis.tn"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-full bg-white border text-[#111111] text-xs font-medium outline-none transition-all ${
                    errors.email ? 'border-[#DA0711]' : 'border-[#111111]/15 focus:border-[#DA0711]'
                  }`}
                />
                {errors.email && <p className="text-[10px] text-[#DA0711] font-bold mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-anton uppercase tracking-wider text-[#111111] mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 caractères"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`w-full px-4 py-2.5 pr-10 rounded-full bg-white border text-[#111111] text-xs font-medium outline-none transition-all ${
                      errors.password ? 'border-[#DA0711]' : 'border-[#111111]/15 focus:border-[#DA0711]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-[#777] hover:text-[#111111]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-[#DA0711] font-bold mt-0.5">{errors.password}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-griddle-primary py-3 cursor-pointer mt-2"
            >
              <span>{loading ? 'Création en cours...' : 'REJOINDRE CAMPUSSAVE →'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-[#666] font-medium">Déjà inscrit ? </span>
            <Link to="/login" className="text-xs font-bold text-[#DA0711] hover:underline">
              Se connecter à son compte →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
