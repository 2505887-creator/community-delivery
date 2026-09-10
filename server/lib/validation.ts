export const SERVICE_CATEGORIES = ['plumbing', 'electrical', 'cleaning', 'carpentry', 'appliances'] as const;

export function cleanString(value: unknown, max = 255): string | null {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  if (!result || result.length > max) return null;
  return result;
}

export function finiteNumber(value: unknown, min?: number, max?: number): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (min !== undefined && n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}

export function validCoordinate(value: unknown, min: number, max: number): number | null {
  return finiteNumber(value, min, max);
}

export function validEmail(value: unknown): string | null {
  const email = cleanString(value, 320)?.toLowerCase() ?? null;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
