// 💡 Concept & Analogie : Comme le panonceau officiel d'un commerce affiché en vitrine qui indique aux clients si l'agrément sanitaire est 'En cours d'instruction', 'Validé' ou 'En attente de mise en conformité', ce bandeau informe le gérant de ses droits de publication en temps réel.
// 🔄 Comparaison React / Flutter : En React, `PendingApprovalBanner` écoute le document commerçant Firestore (`onSnapshot`) ou les mocks locaux ; en Flutter, nous utilisons un `StreamBuilder` pour mettre à jour l'affichage sans recharger la page.
// 🎯 À retenir pour la soutenance : "Ce composant matérialise le système de modération administrative : tant que le statut n'est pas `APPROVED`, la création d'offres publiques est verrouillée côté client et rejetée par le middleware `requireApprovedMerchant` côté serveur."

import React from 'react';
import { Link } from 'react-router-dom';
import { MERCHANT_STATUS } from '@shared/constants.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';

export default function PendingApprovalBanner({
  status = MERCHANT_STATUS.PENDING,
  statusReason = '',
  onRefresh = null,
  className = '',
}) {
  if (status === MERCHANT_STATUS.APPROVED) {
    return (
      <div
        className={`w-full p-5 rounded-3xl bg-[#DCFCE7] border border-[#15803D]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none">🏪</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-anton uppercase text-base text-[#15803D] tracking-wide">
                Établissement Agréé &amp; Actif
              </h4>
              <Badge variant="green" size="sm" dot>APPROUVÉ</Badge>
            </div>
            <p className="text-xs text-[#111111]/70 mt-0.5 font-sans">
              Votre établissement est vérifié. Vous pouvez publier des offres et des paniers surprises à tout moment.
            </p>
          </div>
        </div>

        <Link to="/merchant/offers/new">
          <Button variant="primary" size="sm" leftIcon={<span>✨</span>}>
            Nouvelle Offre Anti-Gaspi
          </Button>
        </Link>
      </div>
    );
  }

  if (status === MERCHANT_STATUS.REJECTED) {
    return (
      <div
        className={`w-full p-5 rounded-3xl bg-[#FEE2E2] border border-[#DA0711]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-start gap-3.5">
          <span className="text-2xl select-none mt-0.5">⚠️</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-anton uppercase text-base text-[#DA0711] tracking-wide">
                Dossier d'Agrément Non Retenu
              </h4>
              <Badge variant="red" size="sm">REJETÉ</Badge>
            </div>
            <p className="text-xs text-[#111111] mt-1 font-sans">
              Motif de la commission ESSECT :{' '}
              <span className="font-bold">
                {statusReason || "Coordonnées géographiques ou justificatifs d'activité non conformes au rayon de 3 km."}
              </span>
            </p>
            <p className="text-[11px] text-[#111111]/70 mt-1 font-sans">
              Vous pouvez corriger vos coordonnées et soumettre à nouveau votre fiche.
            </p>
          </div>
        </div>

        <Link to="/merchant/store">
          <Button variant="danger" size="sm" leftIcon={<span>✏️</span>}>
            Corriger mon profil
          </Button>
        </Link>
      </div>
    );
  }

  // Statut PENDING par défaut
  return (
    <div
      className={`w-full p-5 rounded-3xl bg-[#FEF08A] border border-[#A16207]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <span className="text-2xl select-none animate-pulse mt-0.5">⏳</span>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-anton uppercase text-base text-[#111111] tracking-wide">
              Dossier en Cours d'Instruction
            </h4>
            <Badge variant="yellow" size="sm" dot>EN ATTENTE ADMIN</Badge>
          </div>
          <p className="text-xs text-[#111111] mt-1 font-sans leading-relaxed">
            Votre demande d'adhésion est en cours de révision par l'administrateur ESSECT.
            La publication d'offres sera débloquée dès validation de votre ancrage local (rayon ≤ 3 km).
          </p>
          <p className="text-[11px] text-[#111111]/70 mt-1 font-mono">
            Mise à jour en temps réel via Firestore • Délai moyen habituel : moins de 2 heures.
          </p>
        </div>
      </div>

      {onRefresh && (
        <Button variant="secondary" size="sm" onClick={onRefresh} leftIcon={<span>🔄</span>}>
          Actualiser
        </Button>
      )}
    </div>
  );
}