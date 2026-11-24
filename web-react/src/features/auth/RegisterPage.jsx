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
import { useAuth } from '../../context/AuthContext.jsx';
import { DepthCard } from '../../components/common/DepthCard.jsx';
import {
  Flame,
  GraduationCap,
  Store,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

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
    // Nettoyer toute session de démonstration antérieure
    localStorage.removeItem('campussave_demo_session');
    localStorage.removeItem('campussave_token');

    try {
      let uid = `user_${Date.now()}`;
      if (auth) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        uid = userCredential.user.uid;
      }

      // Formatage rigoureux du profil pour l'API
      const cleanPhone = formData.phone && formData.phone.trim() !== '+216' && formData.phone.trim() !== ''
        ? formData.phone.trim()
        : null;
      const cleanFiliereId = formData.role === ROLES.STUDENT && formData.filiereId
        ? formData.filiereId
        : null;

      // Appel endpoint backend pour initialiser le document utilisateur et les custom claims
      await apiClient.post(ENDPOINTS.REGISTER_PROFILE, {
        role: formData.role,
        displayName: formData.displayName.trim(),
        phone: cleanPhone,
        filiereId: cleanFiliereId,
      });

      // Actualisation forcée du jeton Firebase Auth pour intégrer le claim de rôle
      if (auth?.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
        } catch (claimErr) {
          console.warn('Actualisation idToken post-inscription:', claimErr.message);
        }
      }

      // Rafraîchissement du profil dans le contexte React
      if (refreshProfile) {
        try {
          await refreshProfile();
        } catch (refErr) {
          console.warn('Actualisation AuthContext post-inscription:', refErr.message);
        }
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
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Adresse email invalide.';
        setErrors((prev) => ({ ...prev, email: errorMsg }));
      } else if (err.response?.data?.error?.message) {
        errorMsg = err.response.data.error.message;
      }
      setServerMsg({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  }

  // Tuiles de sélection de rôle (présentation uniquement)
  const roleTiles = [
    {
      value: ROLES.STUDENT,
      title: 'Étudiant ESSECT',
      desc: 'Acheter & sauver des repas',
      Icon: GraduationCap,
    },
    {
      value: ROLES.MERCHANT,
      title: 'Commerçant partenaire',
      desc: 'Publier & scanner les tickets',
      Icon: Store,
    },
  ];

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-start">
          {/* =========================================================================
              COLONNE GAUCHE : POLAROID 3D + STICKERS
              ========================================================================= */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex justify-center lg:sticky lg:top-10">
            <div className="relative w-full max-w-[340px] sm:max-w-[440px] px-3 sm:px-6 py-6">
              <DepthCard maxTilt={8} scale={1.01} glare={false}>
                <figure className="cs-polaroid rotate-[3deg]">
                  <span className="rs-tape-tl" />
                  <span className="rs-tape-tr" />
                  <div className="cs-photo rounded-[4px] aspect-[4/5]">
                    <img
                      src="/assets/griddle/food/riz-saute-crevettes.webp"
                      alt="Riz sauté aux crevettes, repas sauvé"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/griddle/food/teriyaki-poulet-bowl.webp';
                      }}
                    />
                  </div>
                  <figcaption>rejoins le club ♥</figcaption>
                </figure>
              </DepthCard>

              <span className="cs-sticker cs-sticker-red absolute top-2 -left-1 sm:-left-3 z-20 text-[1.5rem] sm:text-[1.9rem] px-5 py-2.5">
                NOUVEAU
              </span>
              <span className="cs-sticker cs-sticker-mustard cs-sticker-tilt-r absolute bottom-24 right-0 z-20 text-[1.35rem] sm:text-[1.7rem] px-5 py-2.5">
                ZÉRO GASPI
              </span>
            </div>
          </div>

          {/* =========================================================================
              COLONNE DROITE : FORMULAIRE D'INSCRIPTION & SÉLECTEUR DE RÔLE
              ========================================================================= */}
          <div className="order-1 lg:order-2 lg:col-span-7 w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0">
            <header className="mb-10">
              <p className="cs-eyebrow mb-4 inline-flex items-center gap-2">
                <Flame className="w-4 h-4" aria-hidden="true" />
                Campus ESSECT Montfleury
              </p>
              <h1 className="cs-hero text-[clamp(4rem,8vw,8.5rem)]">
                REJOINS LE <span className="text-[#DA0711]">CLUB.</span>
              </h1>
              <p className="cs-lead mt-6 max-w-xl">
                Créez votre compte en quelques secondes pour accéder aux offres anti-gaspi ou publier vos surplus.
              </p>
            </header>

            {serverMsg && (
              <div
                role={serverMsg.type === 'success' ? 'status' : 'alert'}
                className={`mb-8 flex items-start gap-3 rounded-2xl border-2 px-5 py-4 text-base font-semibold ${
                  serverMsg.type === 'success'
                    ? 'border-[#1F7A3A] bg-[#DDEFD9] text-[#1F7A3A]'
                    : 'border-[#DA0711] bg-white text-[#DA0711]'
                }`}
              >
                {serverMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                )}
                <span>{serverMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* Choix du rôle Étudiant vs Commerçant */}
              <fieldset>
                <legend className="cs-field-label mb-3">Vous êtes :</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roleTiles.map(({ value, title, desc, Icon }) => {
                    const active = formData.role === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleChange('role', value)}
                        className={`relative flex items-center gap-4 min-h-[96px] p-5 rounded-[1.25rem] border-2 border-[#111111] text-left cursor-pointer transition-all duration-200 ${
                          active
                            ? 'bg-[#111111] text-[#FAF3E6]'
                            : 'bg-[#FAF3E6] text-[#111111] hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_4px_0_#111111]'
                        }`}
                      >
                        <span
                          className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${
                            active ? 'bg-[#DA0711] text-white' : 'bg-[#EDE6D7] text-[#111111]'
                          }`}
                        >
                          <Icon className="w-6 h-6" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold uppercase text-xl leading-tight">{title}</span>
                          <span className={`block text-base mt-1 ${active ? 'text-[#FAF3E6]/80' : 'text-[#5E5850]'}`}>
                            {desc}
                          </span>
                        </span>
                        {active && (
                          <span className="w-8 h-8 shrink-0 rounded-full bg-[#FFD000] text-[#111111] flex items-center justify-center">
                            <Check className="w-5 h-5" aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Filière si étudiant */}
              {formData.role === ROLES.STUDENT && (
                <div>
                  <label htmlFor="register-filiere" className="cs-field-label">
                    Filière universitaire ESSECT
                  </label>
                  <select
                    id="register-filiere"
                    value={formData.filiereId || ''}
                    onChange={(e) => handleChange('filiereId', e.target.value)}
                    aria-invalid={errors.filiereId ? 'true' : undefined}
                    className="cs-input cursor-pointer"
                  >
                    {filiereOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.filiereId && <p className="cs-error-text">{errors.filiereId}</p>}
                </div>
              )}

              {/* Grille des champs principaux */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="register-name" className="cs-field-label">
                    Nom complet
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ritej Bejaoui"
                    value={formData.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    aria-invalid={errors.displayName ? 'true' : undefined}
                    className="cs-input"
                  />
                  {errors.displayName && <p className="cs-error-text">{errors.displayName}</p>}
                </div>

                <div>
                  <label htmlFor="register-phone" className="cs-field-label">
                    Téléphone (+216)
                  </label>
                  <input
                    id="register-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+21698000000"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    aria-invalid={errors.phone ? 'true' : undefined}
                    className="cs-input"
                  />
                  {errors.phone && <p className="cs-error-text">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="register-email" className="cs-field-label">
                    Adresse email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="etudiant@essect.u-tunis.tn"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    aria-invalid={errors.email ? 'true' : undefined}
                    className="cs-input"
                  />
                  {errors.email && <p className="cs-error-text">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="register-password" className="cs-field-label">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 6 caractères"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
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
              </div>

              <button type="submit" disabled={loading} className="cs-btn cs-btn-red cs-btn-lg cs-btn-block">
                <span>{loading ? 'Création en cours...' : 'Rejoindre CampusSave'}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </form>

            <p className="mt-10 text-base text-[#5E5850]">
              Déjà inscrit ?{' '}
              <Link to="/login" className="cs-link text-[#DA0711]">
                Se connecter à son compte →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
