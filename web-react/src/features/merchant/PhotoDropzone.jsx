// 💡 Concept & Analogie : Comme le passe-plat où l'on dépose une assiette joliment dressée avant de la présenter aux convives en salle, ce composant permet de téléverser une vraie photo ou de piocher dans nos visuels vérifiés par catégorie.
// 🔄 Comparaison React / Flutter : En React, `PhotoDropzone` gère le glisser-déposer et délègue l'envoi multipart à l'API ; en Flutter, `image_picker` envoie directement le fichier vers `POST /uploads/image`.
// 🎯 À retenir pour la soutenance : "Ce module valide la taille limite (<= 5 Mo) et le type MIME côté client avant l'envoi vers le serveur, tout en proposant des visuels culinaires vérifiés."

import React, { useState } from 'react';
import { OFFER_IMAGE_PRESETS, SAFE_FOOD_FALLBACK_IMG } from '../../lib/offerImages.js';

export default function PhotoDropzone({
  photoUrl,
  onPhotoChange,
  onFileUpload,
  onClearPhoto,
  uploading = false,
  uploadError = '',
  className = '',
}) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);

  async function handleFiles(files) {
    setLocalError(null);
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 5 * 1024 * 1024) {
      setLocalError('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLocalError('Formats acceptés : JPEG, PNG ou WEBP.');
      return;
    }

    if (typeof onFileUpload === 'function') {
      await onFileUpload(file);
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

  const displayError = uploadError || localError;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="cs-field-label !mb-0">Photo du plat</span>
        {photoUrl && typeof onClearPhoto === 'function' && (
          <button type="button" onClick={onClearPhoto} className="cs-link text-sm">
            Réinitialiser la photo auto
          </button>
        )}
      </div>

      {/* Zone de dépôt */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`group relative w-full aspect-[16/9] max-h-[220px] rounded-[1.25rem] border-2 border-dashed border-[#111111] overflow-hidden cursor-pointer transition-colors ${
          dragActive ? 'bg-[#FFD000]' : 'bg-[#FAF3E6] hover:bg-white'
        } ${photoUrl ? 'border-solid' : ''}`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          aria-label="Choisir une photo du plat"
          className="absolute inset-0 opacity-0 cursor-pointer z-20"
        />

        {photoUrl ? (
          <div className="cs-photo absolute inset-0 !rounded-none">
            <img
              src={photoUrl}
              alt="Aperçu du plat"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = SAFE_FOOD_FALLBACK_IMG;
              }}
            />
            <div className="absolute inset-x-0 bottom-0 z-10 p-3 flex justify-center pointer-events-none">
              <span className="cs-pill cs-pill-mustard !min-h-[2.25rem] !px-4 !text-[14px]">
                {uploading ? 'Envoi en cours…' : 'Glisser ou cliquer pour changer la photo'}
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center pointer-events-none">
            <span className="text-4xl leading-none" aria-hidden="true">📸</span>
            <p className="cs-h3 !text-base max-w-xs">
              {uploading ? 'Téléversement en cours…' : 'Glissez une photo ici'}
            </p>
            <p className="text-sm text-[#5E5850]">ou touchez pour parcourir · JPEG, PNG, WEBP · 5 Mo max</p>
          </div>
        )}
      </div>

      {displayError && <p role="alert" className="cs-error-text mt-2">{displayError}</p>}

      {/* Vignettes de choix rapide par plat / catégorie */}
      <div className="mt-4">
        <span className="cs-label block mb-2.5">Ou choisir un visuel par plat</span>
        <div className="flex flex-wrap gap-2">
          {OFFER_IMAGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={photoUrl === preset.url}
              onClick={() => onPhotoChange(preset.url)}
              className="cs-chip !normal-case !text-[14px] !gap-2"
            >
              <img
                src={preset.url}
                alt=""
                aria-hidden="true"
                className="w-6 h-6 rounded-full object-cover border border-[#111111]/30 shrink-0"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SAFE_FOOD_FALLBACK_IMG;
                }}
              />
              <span>{preset.emoji} {preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
