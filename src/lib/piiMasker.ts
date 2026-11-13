/**
 * PII Masker for AI for Bharat (जन एआई)
 * Detects and obscures 12-digit Indian Aadhaar patterns before network dispatch and DB writes.
 * Mask format: XXXX-XXXX-1234
 */

// Map Devanagari numerals to standard ASCII digits
const DEVANAGARI_DIGITS_MAP: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

// Map Telugu numerals
const TELUGU_DIGITS_MAP: Record<string, string> = {
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
  '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
};

// Map Bengali numerals
const BENGALI_DIGITS_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/**
 * Normalizes vernacular numerals to standard ASCII digits
 */
export function normalizeIndicDigits(input: string): string {
  return input
    .replace(/[०-९]/g, (ch) => DEVANAGARI_DIGITS_MAP[ch] || ch)
    .replace(/[౦-౯]/g, (ch) => TELUGU_DIGITS_MAP[ch] || ch)
    .replace(/[০-৯]/g, (ch) => BENGALI_DIGITS_MAP[ch] || ch);
}

// Regex to match 12-digit Aadhaar patterns:
// 1234 5678 9012, 1234-5678-9012, or 123456789012
// Note: Aadhaar numbers do not start with 0 or 1 per UIDAI specifications
const AADHAAR_REGEX = /\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b/g;

/**
 * Checks whether text contains a 12-digit Aadhaar pattern
 */
export function containsAadhaar(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = normalizeIndicDigits(text);
  AADHAAR_REGEX.lastIndex = 0;
  return AADHAAR_REGEX.test(normalized);
}

/**
 * Masks all detected 12-digit Aadhaar numbers in a string to XXXX-XXXX-XXXX format
 * Example: '1234 5678 9012' -> 'XXXX-XXXX-9012'
 */
export function maskAadhaar(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // First convert any Indic numerals for uniform pattern detection
  const normalized = normalizeIndicDigits(text);

  return normalized.replace(AADHAAR_REGEX, (_match, _p1, _p2, p3) => {
    return `XXXX-XXXX-${p3}`;
  });
}

/**
 * Deeply traverses an object, array, or primitive value and masks any Aadhaar patterns.
 * Essential for sanitizing form states, API payloads, and Gemini multimodal responses.
 */
export function maskAadhaarDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return maskAadhaar(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskAadhaarDeep(item)) as unknown as T;
  }

  if (typeof value === 'object') {
    const maskedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'string' && (key.toLowerCase().includes('aadhaar') || key.toLowerCase().includes('uid'))) {
        // Explicit Aadhaar field: force mask
        const digits = val.replace(/\D/g, '');
        if (digits.length === 12) {
          maskedObj[key] = `XXXX-XXXX-${digits.slice(-4)}`;
        } else {
          maskedObj[key] = maskAadhaar(val);
        }
      } else {
        maskedObj[key] = maskAadhaarDeep(val);
      }
    }
    return maskedObj as T;
  }

  return value;
}
