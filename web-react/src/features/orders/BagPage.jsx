// 💡 Concept & Analogie : Page dédiée `/app/bag` permettant d'accéder directement à son sac mono-commerçant en pleine page ou via URL directe.
// 🔄 Comparaison React / Flutter : Réutilise `BagContent` ; correspond à `BagScreen` côté Flutter.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BagContent from '../../components/bag/BagContent.jsx';

export default function BagPage() {
  return (
    <div className="cs-container cs-page text-[#111111]">
      <Link to="/app/explore" className="cs-link inline-flex items-center gap-2 min-h-[44px] mb-6">
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        Retour aux offres
      </Link>

      <header className="mb-8 lg:mb-10 max-w-2xl">
        <p className="cs-eyebrow mb-3">Espace étudiant · Sac mono-commerçant</p>
        <h1 className="cs-display">Mon sac</h1>
        <p className="cs-lead mt-3">
          Regroupez plusieurs invendus d'un même commerce et validez tout en un seul Living Ticket.
        </p>
      </header>

      <div className="max-w-lg">
        <BagContent />
      </div>
    </div>
  );
}
