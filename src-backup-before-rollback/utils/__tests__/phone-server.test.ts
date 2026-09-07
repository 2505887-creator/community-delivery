import { describe, it, expect } from 'vitest';
import { normalizeKenyaPhone } from '../phone-server';

describe('normalizeKenyaPhone', () => {
  it('normalizes a local 07xx number to E.164', () => {
    expect(normalizeKenyaPhone('0712345678')).toBe('+254712345678');
  });

  it('accepts an already-international number', () => {
    expect(normalizeKenyaPhone('+254712345678')).toBe('+254712345678');
  });

  it('returns null for an invalid number', () => {
    expect(normalizeKenyaPhone('12345')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(normalizeKenyaPhone('')).toBeNull();
  });
});
