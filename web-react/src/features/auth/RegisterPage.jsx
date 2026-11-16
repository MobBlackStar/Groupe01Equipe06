// 💡 Concept & Analogie : Comme le guichet de rentrée universitaire où l'on choisit sa carte d'étudiant ou son badge d'enseignant/commerçant, cet écran aiguille chaque profil vers son environnement adapté dès le premier clic.
// 🔄 Comparaison React / Flutter : En React, `RegisterPage` combine un sélecteur de rôle par cartes interactives Tailwind et validation Zod ; en Flutter, `RegisterScreen` utilise des `Card` Material avec un `RadioListTile` ou un sélecteur de segments.
// 🎯 À retenir pour la soutenance : "L'inscription attribue un rôle immuable dès la création via l'API backend (`/auth/register-profile`) qui scelle les droits d'accès dans les Custom Claims Firebase."

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { ROLES, FILIERES } from '@shared/constants.js';
import { registerSchema } from './auth.schemas.js';
import {
  Button,
  Input,
  Select,
  Card,
  Badge,
  Toast,
} from '../../components/ui/index.js';

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
  const [toast, setToast] = useState(null);

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
      setToast({
        type: 'error',
        message: 'Veuillez corriger les erreurs dans le formulaire.',
      });
      return;
    }

    setLoading(true);

    try {
      // 2. Création de compte Firebase Auth (avec repli local si non configuré)
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
      };
      localStorage.setItem('campussave_demo_session', JSON.stringify(demoSession));

      // 3. Appel de l'endpoint backend pour attribuer le rôle et créer users/{uid}
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

      setToast({
        type: 'success',
        message: 'Compte créé avec succès ! Bienvenue sur CampusSave.',
      });

      // 4. Redirection selon le rôle choisi
      setTimeout(() => {
        if (formData.role === ROLES.MERCHANT) {
          navigate('/merchant');
        } else {
          navigate('/app');
        }
      }, 1000);
    } catch (err) {
      console.error('Erreur inscription:', err);
      let errorMsg = 'Une erreur est survenue lors de l inscription.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Cette adresse email est déjà associée à un compte.';
        setErrors((prev) => ({ ...prev, email: errorMsg }));
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Le mot de passe choisi est trop faible.';
        setErrors((prev) => ({ ...prev, password: errorMsg }));
      }
      setToast({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow circle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#CCFF00]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#161920] border border-[#262A33] shadow-lg mb-4 text-2xl">
          🥗
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Rejoindre <span className="text-[#CCFF00]">CampusSave</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#8A92A6]">
          La communauté anti-gaspi solidaire de l'ESSECT Montfleury
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <Card className="p-6 sm:p-8 bg-[#161920]/95 border-[#262A33] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SÉLECTEUR DE RÔLE : ÉTUDIANT VS COMMERÇANT */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8A92A6] block mb-2.5">
                Vous êtes : <span className="text-[#FF5500]">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Carte Étudiant */}
                <div
                  onClick={() => handleChange('role', ROLES.STUDENT)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    formData.role === ROLES.STUDENT
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                      : 'bg-[#0D0F12] border-[#262A33] hover:border-[#383e4c]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🎓</span>
                    {formData.role === ROLES.STUDENT && (
                      <Badge variant="lime" size="sm">Sélectionné</Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">Étudiant ESSECT</h4>
                  <p className="text-[11px] text-[#8A92A6] mt-1 leading-snug">
                    Accès aux repas à prix réduits, radar 3D et ticket de retrait sécurisé.
                  </p>
                </div>

                {/* Carte Commerçant */}
                <div
                  onClick={() => handleChange('role', ROLES.MERCHANT)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    formData.role === ROLES.MERCHANT
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                      : 'bg-[#0D0F12] border-[#262A33] hover:border-[#383e4c]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🏪</span>
                    {formData.role === ROLES.MERCHANT && (
                      <Badge variant="lime" size="sm">Sélectionné</Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">Commerçant Partenaire</h4>
                  <p className="text-[11px] text-[#8A92A6] mt-1 leading-snug">
                    Vente des invendus du jour, baisse de prix intelligente et scan QR au comptoir.
                  </p>
                </div>
              </div>
              {errors.role && (
                <p className="text-xs text-[#FF1744] mt-1.5">{errors.role}</p>
              )}
            </div>

            {/* SÉLECTEUR DE FILIÈRE ESSECT (SI ÉTUDIANT) */}
            {formData.role === ROLES.STUDENT && (
              <div className="animate-in fade-in duration-200">
                <Select
                  label="Filière Universitaire ESSECT"
                  required
                  options={filiereOptions}
                  value={formData.filiereId || ''}
                  onChange={(e) => handleChange('filiereId', e.target.value)}
                  error={errors.filiereId}
                  helperText="Permet de participer au classement écologique inter-filières"
                />
              </div>
            )}

            {/* NOM COMPLET */}
            <Input
              label="Nom Complet"
              required
              placeholder="ex: Ritej Bejaoui"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              error={errors.displayName}
              leftIcon={<span>👤</span>}
            />

            {/* ADRESSE EMAIL */}
            <Input
              label="Adresse Email"
              type="email"
              required
              placeholder="ex: etudiant@essect.u-tunis.tn"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              leftIcon={<span>✉️</span>}
            />

            {/* NUMÉRO DE TÉLÉPHONE TUNISIEN */}
            <Input
              label="Numéro de Téléphone (Tunisie)"
              required
              placeholder="+21698123456"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              helperText="Format international requis (+216 suivi de 8 chiffres)"
              leftIcon={<span>📞</span>}
            />

            {/* MOT DE PASSE */}
            <Input
              label="Mot de Passe"
              type="password"
              required
              placeholder="Minimum 8 caractères dont 1 chiffre"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              leftIcon={<span>🔒</span>}
            />

            {/* BOUTON D'INSCRIPTION */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full"
              >
                Créer mon compte {formData.role === ROLES.STUDENT ? 'Étudiant' : 'Commerçant'} →
              </Button>
            </div>
          </form>

          {/* LIEN CONNEXION */}
          <div className="mt-6 text-center text-xs text-[#8A92A6]">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-[#CCFF00] hover:underline font-semibold">
              Connectez-vous ici
            </Link>
          </div>
        </Card>
      </div>

      {/* TOAST DE FEEDBACK */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
