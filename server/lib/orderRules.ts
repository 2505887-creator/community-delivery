import type { OrderStatus } from '@prisma/client';

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['en_route', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus, asAdmin: boolean): boolean {
  if (from === to) return true;
  if (asAdmin) return true;
  return ORDER_STATUS_FLOW[from].includes(to);
}

export const ITEMS_MARKER = '\n---ITEMS---\n';

export type CheckoutItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

export function encodeOrderNotes(notes: string | undefined, items?: CheckoutItem[]): string | null {
  const text = (notes || '').trim();
  if (!items || items.length === 0) return text || null;
  return `${text}${ITEMS_MARKER}${JSON.stringify(items)}`;
}

export function decodeOrderNotes(raw: string | null): { notes?: string; items: CheckoutItem[] } {
  if (!raw) return { items: [] };
  const idx = raw.indexOf(ITEMS_MARKER);
  if (idx === -1) {
    try {
      const parsed = JSON.parse(raw) as CheckoutItem[];
      if (Array.isArray(parsed) && parsed[0]?.itemId) return { items: parsed };
    } catch {
      /* plain notes */
    }
    return { notes: raw, items: [] };
  }
  const notes = raw.slice(0, idx).trim() || undefined;
  try {
    const items = JSON.parse(raw.slice(idx + ITEMS_MARKER.length)) as CheckoutItem[];
    return { notes, items: Array.isArray(items) ? items : [] };
  } catch {
    return { notes: raw, items: [] };
  }
}
