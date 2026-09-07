import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeKenyaPhoneClient(input: string) {
  const pn = parsePhoneNumberFromString(input, 'KE');

  if (!pn || !pn.isValid()) {
    return '';
  }

  return pn.number;
}