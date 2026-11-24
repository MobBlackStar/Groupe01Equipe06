// 💡 Concept & Analogie : Comme le passe-plat où l'on dépose une assiette joliment dressée avant de la présenter aux convives en salle, ce composant permet de charger une photo appétissante ou de piocher dans nos illustrations tunisiennes prêtes à l'emploi.
// 🔄 Comparaison React / Flutter : En React, `PhotoDropzone` écoute les événements `dragover` / `drop` du navigateur et convertit le fichier en URL objet (`URL.createObjectURL`) ; en Flutter, nous utilisons `image_picker` avec un sélecteur de galerie.
// 🎯 À retenir pour la soutenance : "Ce module valide la taille limite (≤ 5 Mo) et le type MIME côté client avant l'envoi vers Cloudinary, tout en fournissant des illustrations tunisiennes de secours pour des démos instantanées."

import React, { useState } from 'react';

const PRESET_ILLUSTRATIONS = [
  { label: 'Baguette Farcie', emoji: '🥖', url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80' },
  { label: 'Makloub Chawarma', emoji: '🌯', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Plat Chaud / Ojja', emoji: '🍳', url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80' },
  { label: 'Pizza Artisanale', emoji: '🍕', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { label: 'Biscuits & Snacks', emoji: '🍪', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' },
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
    <div className={className}>
      <span className="cs-field-label">Photo du plat</span>

      {/* Zone de dépôt */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`group relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-[1.25rem] border-2 border-dashed border-[#111111] overflow-hidden cursor-pointer transition-colors ${
          dragActive ? 'bg-[#FFD000]' : 'bg-[#FAF3E6] hover:bg-white'
        } ${photoUrl ? 'border-solid' : ''}`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
          aria-label="Choisir une photo du plat"
          className="absolute inset-0 opacity-0 cursor-pointer z-20"
        />

        {photoUrl ? (
          <div className="cs-photo absolute inset-0 !rounded-none">
            <img
              src={photoUrl}
              alt="Aperçu du plat"
              onError={(e) => { e.currentTarget.onerror = null; }}
            />
            <div className="absolute inset-x-0 bottom-0 z-10 p-4 flex justify-center pointer-events-none">
              <span className="cs-pill cs-pill-mustard !min-h-[2.5rem] !px-5 !text-[15px]">
                Changer la photo
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-none">
            <span className="text-5xl leading-none" aria-hidden="true">📸</span>
            <p className="cs-h3 !text-lg max-w-xs">Glissez une photo ici</p>
            <p className="text-base text-[#5E5850]">ou touchez pour parcourir · JPEG, PNG, WEBP · 5 Mo max</p>
          </div>
        )}
      </div>

      {error && <p className="cs-error-text">{error}</p>}

      {/* Photos d'archive prêtes à l'emploi */}
      <div className="mt-5">
        <span className="cs-label block mb-3">Ou une photo d'archive</span>
        <div className="flex flex-wrap gap-2.5">
          {PRESET_ILLUSTRATIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              aria-pressed={photoUrl === preset.url}
              onClick={() => onPhotoChange(preset.url)}
              className="cs-chip !normal-case !text-[15px]"
            >
              <span aria-hidden="true">{preset.emoji}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
