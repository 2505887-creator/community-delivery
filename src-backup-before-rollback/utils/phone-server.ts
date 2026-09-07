import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeKenyaPhone(input: string) {
  const pn = parsePhoneNumberFromString(input, 'KE');

  if (!pn || !pn.isValid()) {
    return null;
  }

  return pn.number;
}