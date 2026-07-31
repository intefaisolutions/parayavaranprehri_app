export function unwrapList<T>(
  res: T[] | { items: T[]; meta?: unknown } | null | undefined,
): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  return [];
}
