// 💡 Concept & Analogie : Comme le panonceau officiel d'un commerce affiché en vitrine qui indique aux clients si l'agrément sanitaire est 'En cours d'instruction', 'Validé' ou 'En attente de mise en conformité', ce bandeau informe le gérant de ses droits de publication en temps réel.
// 🔄 Comparaison React / Flutter : En React, `PendingApprovalBanner` écoute le document commerçant Firestore (`onSnapshot`) ou les mocks locaux ; en Flutter, nous utilisons un `StreamBuilder` pour mettre à jour l'affichage sans recharger la page.
// 🎯 À retenir pour la soutenance : "Ce composant matérialise le système de modération administrative : tant que le statut n'est pas `APPROVED`, la création d'offres publiques est verrouillée côté client et rejetée par le middleware `requireApprovedMerchant` côté serveur."

import React from 'react';
import { Link } from 'react-router-dom';
import { MERCHANT_STATUS } from '@shared/constants.js';
import Button from '../../components/ui/Button.jsx';

/** Bandeau d'agrément : vert = approuvé, rouge = rejeté, moutarde = en attente. */
export default function PendingApprovalBanner({
  status = MERCHANT_STATUS.PENDING,
  statusReason = '',
  onRefresh = null,
  className = '',
}) {
  if (status === MERCHANT_STATUS.APPROVED) {
    return (
      <div
        className={`w-full rounded-[1.25rem] bg-[#DDEFD9] text-[#111111] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 ${className}`}
      >
        <div className="flex items-start gap-4 min-w-0">
          <span className="text-4xl select-none leading-none" aria-hidden="true">🏪</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h4 className="cs-h3 !text-2xl">Établissement agréé</h4>
              <span className="cs-pill cs-pill-ink">Approuvé</span>
            </div>
            <p className="text-base sm:text-lg leading-snug">
              Votre établissement est vérifié. Vous pouvez publier des offres et des paniers surprises à tout moment.
            </p>
          </div>
        </div>

        <Link to="/merchant/offers/new" className="cs-btn cs-btn-red shrink-0 self-start md:self-auto">
          <span aria-hidden="true">✨</span>
          <span>Nouvelle offre</span>
        </Link>
      </div>
    );
  }

  if (status === MERCHANT_STATUS.REJECTED) {
    return (
      <div
        role="alert"
        className={`w-full rounded-[1.25rem] bg-[#DA0711] text-[#FAF3E6] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 ${className}`}
      >
        <div className="flex items-start gap-4 min-w-0">
          <span className="text-4xl select-none leading-none" aria-hidden="true">⚠️</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h4 className="cs-h3 !text-2xl">Dossier non retenu</h4>
              <span className="cs-pill cs-pill-ink">Rejeté</span>
            </div>
            <p className="text-base sm:text-lg leading-snug">
              Motif de la commission ESSECT :{' '}
              <strong className="font-bold">
                {statusReason || "Coordonnées géographiques ou justificatifs d'activité non conformes au rayon de 3 km."}
              </strong>
            </p>
            <p className="text-base mt-2 opacity-90">
              Corrigez vos coordonnées et soumettez à nouveau votre fiche.
            </p>
          </div>
        </div>

        <Link to="/merchant/store" className="cs-btn cs-btn-cream shrink-0 self-start md:self-auto">
          <span aria-hidden="true">✏️</span>
          <span>Corriger mon profil</span>
        </Link>
      </div>
    );
  }

  // Statut PENDING par défaut
  return (
    <div
      role="status"
      className={`w-full rounded-[1.25rem] bg-[#FFD000] text-[#111111] border-2 border-[#111111] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 ${className}`}
    >
      <div className="flex items-start gap-4 min-w-0">
        <span className="text-4xl select-none leading-none" aria-hidden="true">⏳</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h4 className="cs-h3 !text-2xl">Dossier en cours d'instruction</h4>
            <span className="cs-pill cs-pill-ink">
              <span className="w-2 h-2 rounded-full bg-[#FFD000] animate-pulse" aria-hidden="true" />
              En attente admin
            </span>
          </div>
          <p className="text-base sm:text-lg leading-snug max-w-3xl">
            Votre demande d'adhésion est en cours de révision par l'administrateur ESSECT. La publication d'offres
            sera débloquée dès validation de votre ancrage local (rayon ≤ 3 km).
          </p>
          <p className="text-[15px] mt-2 font-medium opacity-80">
            Mise à jour en temps réel · délai moyen : moins de 2 heures.
          </p>
        </div>
      </div>

      {onRefresh && (
        <Button variant="dark" size="sm" onClick={onRefresh} leftIcon={<span aria-hidden="true">🔄</span>} className="shrink-0 self-start md:self-auto">
          Actualiser
        </Button>
      )}
    </div>
  );
}
