import API from "../services/apiClient";
import { CartItem } from "../types";

export interface VariantChoice {
  color_id: number;
  size_id: number;
  color_name: string;
  color_name_vi?: string;
  color_name_en?: string;
  size: string;
  stock: number;
  price: number;
  image_url?: string;
  [key: string]: unknown;
}

export interface SubstitutionSuggestion {
  productName: string;
  originalLabel: string;
  quantity: number;
  base: {
    id: number;
    name: string;
    name_vi?: string;
    name_en?: string;
    image_url?: string;
  };
  /** Các variant còn hàng của cùng sản phẩm, xếp theo độ tương đồng với variant cũ */
  choices: VariantChoice[];
}

export interface BuyAgainSummary {
  addedCount: number;
  skippedNames: string[];
  /** Items whose original variant is unavailable — user picks a replacement variant */
  substitutions: SubstitutionSuggestion[];
}

interface OrderItemRaw {
  product_id: number;
  product_name?: string;
  color_id?: number;
  size_id?: number;
  color_name?: string;
  color?: string;
  size?: string;
  quantity?: number;
  is_gift?: boolean;
}

interface ProductDetailColor {
  color_id: number;
  id?: number;
  color_name: string;
  color_name_vi?: string;
  color_name_en?: string;
  image_url?: string;
  sizes?: Array<{ size_id: number; id?: number; size: string; stock: number }>;
}

interface ProductDetail {
  id: number;
  name: string;
  name_vi?: string;
  name_en?: string;
  image_url?: string;
  price: number;
  sale_percent?: number;
  colors?: ProductDetailColor[];
}

/**
 * "Buy Again": re-adds the non-gift items of an existing order into the cart.
 *
 * - Gift items (Buy X Get Y) are skipped — they are re-awarded at checkout if
 *   the promotion is still active.
 * - Fetches current product data (price, sale %, variants, stock) so the cart
 *   reflects reality instead of historical order prices.
 * - Quantity is capped to available stock; out-of-stock or removed products /
 *   variants are skipped and reported back in `skippedNames`.
 *
 * NOTE: writes to the cart with a single `setCart` update (merging by
 * product+color+size like CartContext.isMatch). Calling `addToCart` in a loop
 * would read a stale closure and lose items.
 */
export async function buyAgainFromOrder(
  order: { items?: OrderItemRaw[] },
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
): Promise<BuyAgainSummary> {
  const summary: BuyAgainSummary = { addedCount: 0, skippedNames: [], substitutions: [] };
  const items = (order?.items || []).filter((i: OrderItemRaw) => !i.is_gift && i.product_id);

  if (items.length === 0) return summary;

  // Fetch current product detail (price/sale/variants/stock) — one call per distinct product
  const productIds: number[] = [];
  for (const item of items) {
    const pid = Number(item.product_id);
    if (Number.isFinite(pid) && !productIds.includes(pid)) productIds.push(pid);
  }
  const details = await Promise.all(
    productIds.map((pid) =>
      API.get(`/products/${pid}/details`)
        .then((res: { data: ProductDetail | null }) => ({ pid, product: res.data }))
        .catch(() => ({ pid, product: null }))
    )
  );
  const detailMap = new Map(details.map((d: { pid: number; product: ProductDetail | null }) => [d.pid, d.product]));

  const toAdd: CartItem[] = [];
  for (const item of items) {
    const product = detailMap.get(item.product_id);
    const pName = product?.name_vi || product?.name || item.product_name || `#${item.product_id}`;

    if (!product) {
      summary.skippedNames.push(pName); // product removed
      continue;
    }

    const color = (product.colors || []).find((c: ProductDetailColor) => c.color_id === item.color_id);
    const size = color?.sizes?.find((s: { size_id: number; size: string; stock: number }) => s.size_id === item.size_id);
    if (!color || !size || size.stock <= 0) {
      // Variant cũ không còn → gợi ý các variant thay thế còn hàng của cùng sản phẩm
      const choices = buildVariantChoices(product, item.color_id, item.size_id);
      if (choices.length === 0) {
        summary.skippedNames.push(pName); // không còn hàng ở bất kỳ variant nào
      } else {
        summary.substitutions.push({
          productName: pName,
          originalLabel: `${item.color_name || item.color || "?"} • ${item.size || "?"}`,
          quantity: item.quantity || 1,
          base: {
            id: product.id,
            name: product.name,
            name_vi: product.name_vi,
            name_en: product.name_en,
            image_url: product.image_url,
          },
          choices,
        });
      }
      continue;
    }

    const isSale = (Number(product.sale_percent) || 0) > 0;
    const price = isSale
      ? Math.round(Number(product.price) * (1 - (product.sale_percent || 0) / 100))
      : Number(product.price);

    toAdd.push({
      id: product.id,
      name: product.name,
      name_vi: product.name_vi,
      name_en: product.name_en,
      price,
      quantity: Math.min(item.quantity || 1, size.stock),
      color_id: color.color_id,
      size_id: size.size_id,
      color: color.color_name,
      color_name_vi: color.color_name_vi,
      color_name_en: color.color_name_en,
      size: size.size,
      image_url: color.image_url || product.image_url || "/public/placeholder.jpg",
      stock: size.stock,
    });
  }

  if (toAdd.length > 0) {
    mergeIntoCart(setCart, toAdd);
    summary.addedCount = toAdd.length;
  }

  return summary;
}

/** Merge cart items by product+color+size (same rule as CartContext.isMatch) — single atomic setCart */
function mergeIntoCart(
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
  toAdd: CartItem[]
): void {
  setCart((prev: CartItem[]) => {
    const next = [...prev];
    for (const item of toAdd) {
      const idx = next.findIndex(
        (p) => p.id === item.id && p.size_id === item.size_id && p.color_id === item.color_id
      );
      if (idx >= 0) {
        // Same variant already in cart → merge quantities (same as CartContext.addToCart)
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + (item.quantity || 1) };
      } else {
        next.push({ ...item, cartItemId: crypto.randomUUID() });
      }
    }
    return next;
  });
}

/**
 * Builds the list of in-stock replacement variants of the same product, ranked by
 * similarity to the original one: 0 = same color (other size), 1 = same size
 * (other color), 2 = any other variant. Higher stock first within a rank.
 */
function buildVariantChoices(
  product: ProductDetail,
  originalColorId?: number,
  originalSizeId?: number
): VariantChoice[] {
  const isSale = (Number(product.sale_percent) || 0) > 0;
  const unitPrice = isSale
    ? Math.round(Number(product.price) * (1 - (product.sale_percent || 0) / 100))
    : Number(product.price);

  const choices: VariantChoice[] = [];
  for (const c of product.colors || []) {
    for (const s of c.sizes || []) {
      if (s.stock <= 0) continue;
      choices.push({
        color_id: c.color_id,
        size_id: s.size_id,
        color_name: c.color_name,
        color_name_vi: c.color_name_vi,
        color_name_en: c.color_name_en,
        size: s.size,
        stock: s.stock,
        price: unitPrice,
        image_url: c.image_url || product.image_url,
      });
    }
  }

  const score = (ch: VariantChoice) => {
    if (originalColorId && ch.color_id === originalColorId && ch.size_id !== originalSizeId) return 0; // cùng màu, size khác
    if (originalSizeId && ch.size_id === originalSizeId && ch.color_id !== originalColorId) return 1;  // cùng size, màu khác
    return 2;
  };
  return choices.sort((a, b) => score(a) - score(b) || b.stock - a.stock);
}

/**
 * Applies the user-selected replacement variants (from BuyAgainVariantModal) into the cart.
 * Items with `choice === null` are skipped (user chose not to re-buy them).
 */
export function applySubstitutions(
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
  selections: Array<{ suggestion: SubstitutionSuggestion; choice: VariantChoice }>
): void {
  const toAdd: CartItem[] = selections
    .filter((sel) => sel.choice)
    .map(({ suggestion, choice }) => ({
      id: suggestion.base.id,
      name: suggestion.base.name,
      name_vi: suggestion.base.name_vi,
      name_en: suggestion.base.name_en,
      price: choice.price,
      quantity: suggestion.quantity,
      color_id: choice.color_id,
      size_id: choice.size_id,
      color: choice.color_name,
      color_name_vi: choice.color_name_vi,
      color_name_en: choice.color_name_en,
      size: choice.size,
      image_url: choice.image_url || suggestion.base.image_url || "/public/placeholder.jpg",
      stock: choice.stock,
    }));

  if (toAdd.length > 0) mergeIntoCart(setCart, toAdd);
}
