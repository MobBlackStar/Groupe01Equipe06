// 💡 Concept & Analogie : Comme le passe-plat où l'on dépose une assiette joliment dressée avant de la présenter aux convives en salle, ce composant permet de charger une photo appétissante ou de piocher dans nos illustrations tunisiennes prêtes à l'emploi.
// 🔄 Comparaison React / Flutter : En React, `PhotoDropzone` écoute les événements `dragover` / `drop` du navigateur et convertit le fichier en URL objet (`URL.createObjectURL`) ; en Flutter, nous utilisons `image_picker` avec un sélecteur de galerie.
// 🎯 À retenir pour la soutenance : "Ce module valide la taille limite (≤ 5 Mo) et le type MIME côté client avant l'envoi vers Cloudinary, tout en fournissant des illustrations tunisiennes de secours pour des démos instantanées."

import React, { useState } from 'react';

const PRESET_ILLUSTRATIONS = [
  { label: 'Baguette Farcie', emoji: '🥖', url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80' },
  { label: 'Makloub Chawarma', emoji: '🌯', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Plat Ojja / Chaud', emoji: '🍳', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Pizza Artisanale', emoji: '🍕', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { label: 'Pâtisserie Douceur', emoji: '🧁', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80' },
  { label: 'Panier Mystère', emoji: '🎁', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80' },
];

export default function PhotoDropzone({ photoUrl, onPhotoChange, className = '' }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  function handleFiles(files) {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];

    // Vérification taille <= 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    // Vérification format
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formats acceptés : JPEG, PNG ou WEBP.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    onPhotoChange(objectUrl);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-wider text-[#8A92A6] block">
        Photo de Présentation du Plat
      </label>

      {/* Dropzone Container */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full h-44 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer overflow-hidden ${
          dragActive
            ? 'border-[#CCFF00] bg-[#CCFF00]/10'
            : photoUrl
            ? 'border-[#262A33] bg-[#0D0F12]'
            : 'border-[#262A33] bg-[#161920] hover:border-[#383e4c]'
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />

        {photoUrl ? (
          <div className="relative w-full h-full flex items-center justify-center group">
            <img
              src={photoUrl}
              alt="Aperçu plat"
              className="max-h-full max-w-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl z-20 pointer-events-none">
              <span className="text-xs font-bold text-white bg-black/80 px-3 py-1.5 rounded-lg border border-white/20">
                Changer la photo (Glisser-déposer)
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pointer-events-none">
            <div className="w-12 h-12 rounded-xl bg-[#0D0F12] border border-[#262A33] flex items-center justify-center text-2xl mx-auto shadow-inner">
              📸
            </div>
            <p className="text-xs font-bold text-white">
              Glissez votre photo ici, ou <span className="text-[#CCFF00]">parcourez</span>
            </p>
            <p className="text-[11px] text-[#8A92A6]">
              JPEG, PNG ou WEBP • 5 Mo maximum
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-[#FF1744]">{error}</p>}

      {/* Presets rapides pour démonstration instantanée */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-semibold uppercase text-[#8A92A6]">
          Ou choisir une illustration tunisienne prête à l'emploi :
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRESET_ILLUSTRATIONS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onPhotoChange(preset.url)}
              className="p-1.5 rounded-xl bg-[#0D0F12] border border-[#262A33] hover:border-[#CCFF00] transition-colors flex items-center gap-1.5 text-left"
            >
              <span className="text-base">{preset.emoji}</span>
              <span className="text-[10px] text-gray-300 truncate">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
