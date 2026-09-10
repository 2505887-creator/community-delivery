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

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  asAdmin: boolean,
): boolean {
  if (from === to) return true;
  if (asAdmin) return true;
  return ORDER_STATUS_FLOW[from].includes(to);
}

export const ITEMS_MARKER = '\n---ITEMS---\n';

export type CheckoutItem = {
  itemId: string;
  quantity: number;
};

export function encodeOrderNotes(
  notes: string | undefined,
  items?: CheckoutItem[],
): string | null {
  const text = (notes || '').trim();
  if (!items || items.length === 0) return text || null;
  return `${text}${ITEMS_MARKER}${JSON.stringify(items)}`;
}

export function decodeOrderNotes(raw: string | null): {
  notes?: string;
  items: CheckoutItem[];
} {
  if (!raw) return { items: [] };
  const idx = raw.indexOf(ITEMS_MARKER);
  if (idx === -1) return { notes: raw, items: [] };

  const notes = raw.slice(0, idx).trim() || undefined;
  try {
    const parsed = JSON.parse(
      raw.slice(idx + ITEMS_MARKER.length),
    ) as unknown;
    const items = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is CheckoutItem =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as CheckoutItem).itemId === 'string' &&
            Number.isInteger((item as CheckoutItem).quantity) &&
            (item as CheckoutItem).quantity > 0,
        )
      : [];
    return { notes, items };
  } catch {
    return { notes, items: [] };
  }
}
