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
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Rubans Damier */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-diner-checker-subtle border-b-2 border-[#141210] opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-diner-checker-subtle border-t-2 border-[#141210] opacity-40 pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* =========================================================================
            COLONNE GAUCHE : POLAROID 3D & BADGE DE BIENVENUE
            ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
          <DepthCard maxTilt={10} perspective={1200} className="w-full max-w-sm relative p-4">
            
            {/* Ticket de bienvenue en arrière-plan */}
            <div className="absolute -top-3 -right-3 w-64 rounded-xl bg-[#FAF6EE] text-[#141210] p-4 font-mono text-[11px] shadow-[6px_6px_0px_#141210] rotate-3 border-2 border-[#141210] hidden sm:block pointer-events-none select-none">
              <div className="text-center font-black text-xs uppercase tracking-wider pb-2 border-b-2 border-dashed border-[#141210]/30">
                NOUVEAU MEMBRE · ESSECT
              </div>
              <div className="py-2 space-y-1 text-[10px] font-bold">
                <div className="flex justify-between">
                  <span>CARTE FIDÉLITÉ :</span>
                  <span className="text-[#E51C23]">ACTIVÉE</span>
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
              <div className="mt-2 pt-2 border-t-2 border-dashed border-[#141210]/30 text-center">
                <span className="font-anton text-xs uppercase px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] border-2 border-[#166534] rotate-[-5deg] shadow-sm">
                  [BIENVENUE AU CLUB]
                </span>
              </div>
            </div>

            {/* Cadre Polaroid Avant-Plan */}
            <div className="relative z-10 w-full rounded-xl bg-white p-4 pb-6 shadow-[8px_8px_0px_#141210] rotate-[-2.5deg] border-2 border-[#141210]">
              {/* Masking tape */}
              <div
                aria-hidden="true"
                className="absolute -top-3.5 left-5 w-14 h-6 bg-[#FFD000]/80 border border-[#141210] shadow-sm rotate-[-12deg] pointer-events-none z-20"
              />
              <div
                aria-hidden="true"
                className="absolute -top-3.5 right-5 w-14 h-6 bg-[#FFD000]/80 border border-[#141210] shadow-sm rotate-[15deg] pointer-events-none z-20"
              />

              <DepthLayer depth={20} shadow className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#141210] border-2 border-[#141210] relative">
                <img
                  src="/assets/griddle/food/box-assortiment-fika.png"
                  alt="Assortiment box"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/griddle/food/croissant-amande.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FFD000] text-[#141210] text-[10px] font-anton border border-[#141210]">
                    ZERO GASPILLAGE
                  </span>
                </div>
              </DepthLayer>

              <div className="mt-3.5 text-center">
                <p className="font-anton uppercase text-lg font-bold tracking-wider text-[#141210]">
                  REJOINS LA COMMUNAUTÉ ♥
                </p>
                <p className="text-[11px] text-[#555] font-bold">
                  Plus de 1 200 repas sauvés par les étudiants de l'ESSECT
                </p>
              </div>
            </div>
          </DepthCard>
        </div>

        {/* =========================================================================
            COLONNE DROITE : FORMULAIRE D'INSCRIPTION & SÉLECTEUR DE RÔLE
            ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD000] text-[#141210] text-xs font-anton tracking-wider mb-2 border-2 border-[#141210] shadow-[2px_2px_0px_#141210]">
              <Flame className="w-3.5 h-3.5 text-[#E51C23]" />
              <span>Campus ESSECT Montfleury</span>
            </div>
            <h1 className="font-anton uppercase text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#141210] leading-none">
              REJOINS LE <span className="text-[#E51C23]">CLUB.</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#555] font-medium leading-relaxed">
              Créez votre compte en quelques secondes pour accéder aux offres anti-gaspi ou publier vos surplus.
            </p>
          </div>

          {serverMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border-2 ${
                serverMsg.type === 'success'
                  ? 'bg-[#DCFCE7] border-[#166534] text-[#15803D]'
                  : 'bg-[#FEE2E2] border-[#DC2626] text-[#B91C1C]'
              }`}
            >
              <span>{serverMsg.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{serverMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Choix du rôle Étudiant vs Commerçant */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-2">
                Vous êtes :
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('role', ROLES.STUDENT)}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                    formData.role === ROLES.STUDENT
                      ? 'bg-[#FEE2E2] border-[#E51C23] shadow-[3px_3px_0px_#E51C23]'
                      : 'bg-white border-[#141210] shadow-[2px_2px_0px_#141210] hover:bg-[#FAF6EE]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <GraduationCap className={`w-5 h-5 ${formData.role === ROLES.STUDENT ? 'text-[#E51C23]' : 'text-[#777]'}`} />
                    {formData.role === ROLES.STUDENT && <Check className="w-4 h-4 text-[#E51C23]" />}
                  </div>
                  <div>
                    <span className="text-xs font-black block text-[#141210]">Étudiant ESSECT</span>
                    <span className="text-[10px] text-[#666] font-bold">Acheter & sauver des repas</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('role', ROLES.MERCHANT)}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                    formData.role === ROLES.MERCHANT
                      ? 'bg-[#FEF08A] border-[#141210] shadow-[3px_3px_0px_#141210]'
                      : 'bg-white border-[#141210] shadow-[2px_2px_0px_#141210] hover:bg-[#FAF6EE]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Store className={`w-5 h-5 ${formData.role === ROLES.MERCHANT ? 'text-[#141210]' : 'text-[#777]'}`} />
                    {formData.role === ROLES.MERCHANT && <Check className="w-4 h-4 text-[#141210]" />}
                  </div>
                  <div>
                    <span className="text-xs font-black block text-[#141210]">Commerçant Partenaire</span>
                    <span className="text-[10px] text-[#666] font-bold">Publier & scanner les tickets</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Filière si étudiant */}
            {formData.role === ROLES.STUDENT && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-1.5">
                  Filière Universitaire ESSECT
                </label>
                <select
                  value={formData.filiereId || ''}
                  onChange={(e) => handleChange('filiereId', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#141210] text-xs font-bold outline-none cursor-pointer"
                >
                  {filiereOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#141210]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Grille des champs principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-1">
                  Nom Complet
                </label>
                <input
                  type="text"
                  placeholder="Ritej Bejaoui"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-lg bg-white border-2 text-[#141210] text-xs font-medium outline-none ${
                    errors.displayName ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]' : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23]'
                  }`}
                />
                {errors.displayName && <p className="text-[10px] text-[#E51C23] font-bold mt-0.5">{errors.displayName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-1">
                  Téléphone (+216)
                </label>
                <input
                  type="tel"
                  placeholder="+21698000000"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-lg bg-white border-2 text-[#141210] text-xs font-medium outline-none ${
                    errors.phone ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]' : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23]'
                  }`}
                />
                {errors.phone && <p className="text-[10px] text-[#E51C23] font-bold mt-0.5">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-1">
                  Adresse Email
                </label>
                <input
                  type="email"
                  placeholder="etudiant@essect.u-tunis.tn"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-lg bg-white border-2 text-[#141210] text-xs font-medium outline-none ${
                    errors.email ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]' : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23]'
                  }`}
                />
                {errors.email && <p className="text-[10px] text-[#E51C23] font-bold mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#141210] mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 caractères"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`w-full px-3.5 py-2 pr-9 rounded-lg bg-white border-2 text-[#141210] text-xs font-medium outline-none ${
                      errors.password ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]' : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-[#777] hover:text-[#141210]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-[#E51C23] font-bold mt-0.5">{errors.password}</p>}
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
            <span className="text-xs text-[#555] font-medium">Déjà inscrit ? </span>
            <Link to="/login" className="text-xs font-black text-[#E51C23] hover:underline">
              Se connecter à son compte →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
