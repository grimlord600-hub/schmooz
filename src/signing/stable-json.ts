/** Recursively sort object keys (matches Python _sort_dict_recursive / JS sortObject). */
export function sortObjectDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sortObjectDeep(item)) as T;
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = sortObjectDeep((obj as Record<string, unknown>)[key]);
  }
  return sorted as T;
}

export function stableStringify(body: Record<string, unknown> | unknown[]): string {
  return JSON.stringify(sortObjectDeep(body));
}
