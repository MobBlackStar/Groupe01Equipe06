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
      <label className="text-xs font-black uppercase tracking-wider text-[#111111]/70 block font-mono">
        Photo de Présentation du Plat
      </label>

      {/* Dropzone Container */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full h-44 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer overflow-hidden ${
          dragActive
            ? 'border-[#DA0711] bg-[#FEE2E2]'
            : photoUrl
            ? 'border-[#111111]/15 bg-white shadow-sm'
            : 'border-[#111111]/20 bg-[#EDE6D7] hover:bg-white shadow-sm'
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
              onError={(e) => { e.currentTarget.onerror = null; }}
              className="max-h-full max-w-full object-cover rounded-2xl"
            />
            <div className="absolute inset-0 bg-[#111111]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl z-20 pointer-events-none">
              <span className="text-xs font-bold text-[#111111] bg-[#FFD000] px-4 py-2 rounded-full shadow-md">
                Changer la photo (Glisser-déposer)
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pointer-events-none">
            <span className="text-3xl block">📸</span>
            <p className="text-xs font-bold text-[#111111]">
              Glissez-déposez une photo culinaire ou cliquez pour parcourir
            </p>
            <p className="text-[10px] text-[#666] font-mono">
              JPEG, PNG ou WEBP jusqu'à 5 Mo
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-xs font-bold text-[#DA0711] mt-1">{error}</p>}

      {/* Preset illustrations tunisiennes */}
      <div className="pt-1">
        <span className="text-[10px] font-bold uppercase text-[#666] block mb-1.5 font-mono">
          Ou choisissez une photo d'archive prête à l'emploi :
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_ILLUSTRATIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onPhotoChange(preset.url)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white border border-[#111111]/15 text-[#111111] hover:bg-[#FFD000] shadow-sm transition-colors flex items-center gap-1"
            >
              <span>{preset.emoji}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}