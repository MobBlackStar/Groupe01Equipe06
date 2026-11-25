// 💡 Concept & Analogie : Catalogue visuel des plats CampusSave réexportant le référentiel partagé des 14 tags culinaires.
// 🔄 Comparaison React / Flutter : Miroir direct de `shared/dishPhotos.js` et `mobile-flutter/lib/core/offer_images.dart`.

import {
  DISH_PHOTO_TAGS,
  DISH_PHOTO_URLS,
  CATEGORY_DEFAULT_IMAGES,
  OFFER_IMAGE_PRESETS,
  resolveDishPhoto,
  resolveDishPhotoTag,
} from '@shared/dishPhotos.js';

export const SAFE_FOOD_FALLBACK_IMG = '/assets/griddle/food/takeaway-counter.webp';

export {
  DISH_PHOTO_TAGS,
  DISH_PHOTO_URLS,
  CATEGORY_DEFAULT_IMAGES,
  OFFER_IMAGE_PRESETS,
  resolveDishPhotoTag,
};

export function resolveOfferImage(params = {}) {
  return resolveDishPhoto(params) || SAFE_FOOD_FALLBACK_IMG;
}
