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
        className={`w-full p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none">🏪</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Établissement Agréé &amp; Actif</h4>
              <Badge variant="lime" size="sm" dot>APPROUVÉ</Badge>
            </div>
            <p className="text-xs text-[#8A92A6] mt-0.5">
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
        className={`w-full p-5 rounded-2xl bg-[#FF1744]/10 border border-[#FF1744]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-start gap-3.5">
          <span className="text-2xl select-none mt-0.5">⚠️</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#FF1744]">Dossier d'Agrément Non Retenu</h4>
              <Badge variant="red" size="sm">REJETÉ</Badge>
            </div>
            <p className="text-xs text-gray-200 mt-1">
              Motif de la commission ESSECT :{' '}
              <span className="font-semibold text-white">
                {statusReason || "Coordonnées géographiques ou justificatifs d'activité non conformes au rayon de 3 km."}
              </span>
            </p>
            <p className="text-[11px] text-[#8A92A6] mt-1">
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
      className={`w-full p-5 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <span className="text-2xl select-none animate-pulse mt-0.5">⏳</span>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[#FF5500]">Dossier en Cours d'Instruction</h4>
            <Badge variant="orange" size="sm" dot>EN ATTENTE ADMIN</Badge>
          </div>
          <p className="text-xs text-gray-200 mt-1 leading-relaxed">
            Votre demande d'adhésion est en cours de révision par l'administrateur ESSECT.
            La publication d'offres sera débloquée dès validation de votre ancrage local (rayon ≤ 3 km).
          </p>
          <p className="text-[11px] text-[#8A92A6] mt-1">
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
