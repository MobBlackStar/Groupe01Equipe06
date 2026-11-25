/**
 * Formatters and Date/Time Helpers for CampusSave (Tunis Timezone: Africa/Tunis, UTC+1)
 * ESSECT Anti-Gaspillage Platform
 */

const TUNIS_TIMEZONE = 'Africa/Tunis';

/**
 * Safely parses any input into a Date instance
 */
function toDate(input) {
  if (input == null || input === '') return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'object') {
    if (typeof input.toDate === 'function') {
      const d = input.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
    const secs = input._seconds ?? input.seconds;
    if (Number.isFinite(secs)) {
      const nanos = input._nanoseconds ?? input.nanoseconds ?? 0;
      const d = new Date(secs * 1000 + Math.round(nanos / 1e6));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  if (typeof input === 'string') {
    // If it's a pure time string like "18:00" or "18:30:00", construct a today date in Tunis
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(input.trim())) {
      const parts = input.trim().split(':');
      const now = new Date();
      now.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      return now;
    }
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats a date into a clean French/Tunisian localized date string in Africa/Tunis timezone.
 * Examples:
 * - "Aujourd'hui, 18 nov."
 * - "18 nov. 2026"
 * 
 * @param {Date|string|number} dateInput - The date to format
 * @param {Object} [options]
 * @param {boolean} [options.includeRelative=true] - If true, displays "Aujourd'hui" or "Demain" for current/next day
 * @param {boolean} [options.includeYear=false] - Whether to explicitly append the 4-digit year
 * @param {string} [options.fallback='--'] - Fallback when input is invalid
 * @returns {string}
 */
export function formatTunisDate(dateInput, options = {}) {
  const { includeRelative = true, includeYear = false, fallback = '--' } = options;
  const d = toDate(dateInput);
  if (!d) return fallback;

  try {
    const formatter = new Intl.DateTimeFormat('fr-TN', {
      timeZone: TUNIS_TIMEZONE,
      day: 'numeric',
      month: 'short',
      ...(includeYear ? { year: 'numeric' } : {}),
    });

    const dateStr = formatter.format(d);

    if (includeRelative) {
      // Check if same calendar day in Tunis timezone
      const now = new Date();
      const todayStr = new Intl.DateTimeFormat('fr-TN', { timeZone: TUNIS_TIMEZONE, day: 'numeric', month: 'numeric', year: 'numeric' }).format(now);
      const targetStr = new Intl.DateTimeFormat('fr-TN', { timeZone: TUNIS_TIMEZONE, day: 'numeric', month: 'numeric', year: 'numeric' }).format(d);

      if (todayStr === targetStr) {
        return `Aujourd'hui, ${dateStr}`;
      }
    }

    return dateStr;
  } catch (err) {
    return d.toLocaleDateString('fr-TN');
  }
}

/**
 * Formats a time string (HH:MM) in Africa/Tunis timezone.
 * Example: "18:30"
 * 
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export function formatTunisTime(dateInput) {
  const d = toDate(dateInput);
  if (!d) return '--:--';

  try {
    return new Intl.DateTimeFormat('fr-TN', {
      timeZone: TUNIS_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch (err) {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

/**
 * Formats a time window between two timestamps or time strings in Africa/Tunis timezone.
 * Examples:
 * - "18:00 – 19:30"
 * - "À partir de 18h00 jusqu'à 19h30" (when style='long')
 * 
 * @param {Date|string|number|Object} startInput - Start time or object containing { start, end } / { pickupStart, pickupEnd }
 * @param {Date|string|number} [endInput] - End time
 * @param {Object} [options]
 * @param {'short'|'long'|'compact'} [options.style='short']
 * @param {string} [options.fallback='Créneau non spécifié']
 * @returns {string}
 */
export function formatTunisTimeWindow(startInput, endInput, options = {}) {
  // Support passing a single object: formatTunisTimeWindow({ pickupStart, pickupEnd })
  let start = startInput;
  let end = endInput;

  if (startInput && typeof startInput === 'object' && !(startInput instanceof Date)) {
    start = startInput.start || startInput.pickupStart || startInput.from || startInput.startTime;
    end = startInput.end || startInput.pickupEnd || startInput.to || startInput.endTime;
  }

  const { style = 'short', fallback = 'Créneau flexible' } = options;

  const tStart = formatTunisTime(start);
  const tEnd = formatTunisTime(end);

  if (tStart === '--:--' && tEnd === '--:--') {
    return fallback;
  }

  if (tStart !== '--:--' && tEnd === '--:--') {
    return style === 'long' ? `À partir de ${tStart.replace(':', 'h')}` : `Dès ${tStart}`;
  }

  if (tStart === '--:--' && tEnd !== '--:--') {
    return style === 'long' ? `Jusqu'à ${tEnd.replace(':', 'h')}` : `Jusqu'à ${tEnd}`;
  }

  if (style === 'long') {
    const sH = tStart.replace(':', 'h');
    const eH = tEnd.replace(':', 'h');
    return `De ${sH} à ${eH}`;
  }

  if (style === 'compact') {
    return `${tStart}-${tEnd}`;
  }

  return `${tStart} – ${tEnd}`;
}

/**
 * Formats price in millimes into Tunisian Dinars (TND / DT)
 * Example: 3500 -> "3.500 DT"
 * 
 * @param {number} millimes
 * @returns {string}
 */
export function formatMillimes(millimes) {
  if (typeof millimes !== 'number' || isNaN(millimes)) return '0.000 DT';
  const dinars = millimes / 1000;
  return `${dinars.toFixed(3)} DT`;
}

const FILIERE_LABELS = {
  EBUSINESS_3A: '3A E-Business',
  FINANCE: 'Finance',
  MARKETING: 'Marketing',
  GESTION: 'Gestion',
  COMPTABILITE: 'Comptabilité',
};

/**
 * Libellé lisible d'une filière ESSECT ("EBUSINESS_3A" -> "3A E-Business").
 * Laisse passer tel quel un libellé déjà lisible.
 * @param {string} filiereId
 * @returns {string}
 */
export function formatFiliere(filiereId) {
  if (!filiereId) return '—';
  return FILIERE_LABELS[filiereId] || filiereId;
}

export default {
  formatTunisDate,
  formatTunisTime,
  formatTunisTimeWindow,
  formatMillimes,
  formatFiliere,
};
