export interface SearchableProduct {
  name?: unknown;
  name_vi?: unknown;
  name_en?: unknown;
  description?: unknown;
  description_vi?: unknown;
  description_en?: unknown;
}

/** Normalize Vietnamese and English text so search is accent-insensitive. */
export function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (letter) => letter === "Đ" ? "D" : "d")
    .toLocaleLowerCase()
    .trim();
}

export function matchesProductSearch(product: SearchableProduct, query: unknown): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  return [
    product.name,
    product.name_vi,
    product.name_en,
    product.description,
    product.description_vi,
    product.description_en,
  ].some((field) => normalizeSearchText(field).includes(normalizedQuery));
}
