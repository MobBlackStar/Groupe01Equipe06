// 💡 Concept & Analogie : Comme la mascotte CampusSave qui toque à la fenêtre dès qu'un panier chaud sort du four ou qu'un ticket est validé, ce bandeau glisse avec la mascotte qui dépasse du bord supérieur.
// 🔄 Comparaison React / Flutter : Équivalent exact de `FcmService.showBanner` dans `mobile-flutter/lib/services/fcm_service.dart`.
// 🎯 À retenir pour la soutenance : "Toute notification push reçue au premier plan ou testée depuis le profil déclenche ce bandeau Griddle avec mascotte intégrée, cliquable vers l'écran concerné."

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export function emitMascotNotification({ title, body = '', data = {} }) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('campussave:push', {
      detail: { title, body, data },
    })
  );
}

export default function MascotToast() {
  const navigate = useNavigate();
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    let timer = null;

    function handlePush(event) {
      const detail = event?.detail || {};
      const title = detail.title || 'CampusSave';
      const body = detail.body || '';
      const data = detail.data || {};
      setNotif({ title, body, data, id: Date.now() });

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setNotif(null), 5500);
    }

    window.addEventListener('campussave:push', handlePush);
    return () => {
      window.removeEventListener('campussave:push', handlePush);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!notif) return null;

  const route = notif.data?.route;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[26rem] z-[70] pt-3 pl-4 animate-fadeIn"
    >
      <div className="relative">
        {/* Mascotte qui dépasse joyeusement du coin gauche */}
        <img
          src="/assets/brand/mascot-sticker.png"
          alt="Mascotte CampusSave"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          className="absolute -left-4 -top-4 w-16 h-16 object-contain pointer-events-none select-none drop-shadow-[0_6px_12px_rgba(17,17,17,0.28)] z-10"
        />

        <div
          onClick={() => {
            setNotif(null);
            if (typeof route === 'string' && route.startsWith('/')) {
              navigate(route);
            }
          }}
          className={`flex items-start gap-3 pl-12 pr-3 py-3.5 rounded-[1.5rem] bg-[#FAF3E6] border-2 border-[#DA0711] text-[#111111] shadow-[4px_4px_0_#111111] ${
            route ? 'cursor-pointer hover:bg-[#FFF9EE]' : ''
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-[#DA0711] leading-snug truncate">
              🔔 {notif.title}
            </p>
            {notif.body && (
              <p className="text-[14px] text-[#111111] mt-0.5 leading-snug line-clamp-2">
                {notif.body}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNotif(null);
            }}
            aria-label="Fermer la notification"
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center hover:bg-[#EDE6D7] text-[#111111] transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
