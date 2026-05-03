export const CART_STORAGE_KEY = 'fashion-store-cart';
export const CART_EVENT_NAME = 'fashion-store-cart-updated';
export const CART_SNAPSHOT_KEY = 'fashion-store-cart-snapshot';
export const AUTH_EVENT_NAME = 'fashion-store-auth-updated';

const getWindow = () => (typeof window === 'undefined' ? null : window);

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export function normalizeGuestCartItem(item) {
  if (!item || typeof item !== 'object') return null;

  const quantity = Math.max(1, safeNumber(item.quantity, 1));
  const unitPrice = safeNumber(item.unitPrice, 0);
  const lineTotal = safeNumber(item.lineTotal, quantity * unitPrice);

  return {
    id: item.id ?? null,
    key: String(
      item.key ?? item.id ?? item.variantId ?? `${item.productId ?? ''}-${item.color ?? ''}-${item.size ?? ''}`
    ),
    productId: item.productId != null ? String(item.productId) : '',
    productName: item.productName ?? '',
    variantId: String(item.variantId ?? ''),
    color: item.color ?? '',
    size: item.size ?? '',
    sku: item.sku ?? '',
    thumbnailUrl: item.thumbnailUrl ?? '',
    quantity,
    unitPrice,
    lineTotal,
    stockQty: item.stockQty == null ? null : Math.max(0, safeNumber(item.stockQty, 0)),
  };
}

export function normalizeBackendCartItem(item) {
  if (!item || typeof item !== 'object') return null;

  const quantity = Math.max(1, safeNumber(item.quantity, 1));
  const unitPrice = safeNumber(item.unitPrice, 0);
  const lineTotal = safeNumber(item.lineTotal, quantity * unitPrice);

  return {
    id: item.id ?? null,
    key: String(item.id ?? item.variantId ?? `${item.productId ?? ''}-${item.color ?? ''}-${item.size ?? ''}`),
    productId: item.productId != null ? String(item.productId) : '',
    productName: item.productName ?? '',
    variantId: String(item.variantId ?? ''),
    color: item.color ?? '',
    size: item.size ?? '',
    sku: item.sku ?? '',
    thumbnailUrl: item.thumbnailUrl ?? '',
    quantity,
    unitPrice,
    lineTotal,
    stockQty: item.stockQty == null ? null : Math.max(0, safeNumber(item.stockQty, 0)),
  };
}

export function buildGuestCartItemFromVariant({ product, variant, quantity, thumbnailUrl }) {
  if (!product || !variant) return null;

  const unitPrice = safeNumber(variant.salePrice ?? product.basePrice, 0);
  const qty = Math.max(1, safeNumber(quantity, 1));

  return normalizeGuestCartItem({
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    color: variant.color,
    size: variant.size,
    sku: variant.sku,
    thumbnailUrl: thumbnailUrl || product.thumbnailUrl || '',
    quantity: qty,
    unitPrice,
    lineTotal: qty * unitPrice,
    stockQty: variant.stockQty == null ? null : safeNumber(variant.stockQty, 0),
  });
}

export function readGuestCart() {
  const win = getWindow();
  if (!win) return [];

  try {
    const raw = win.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeGuestCartItem).filter(Boolean) : [];
  } catch (error) {
    console.error('Không thể đọc giỏ hàng tạm:', error);
    return [];
  }
}

export function getCartCount(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + Math.max(0, safeNumber(item?.quantity, 0)),
    0
  );
}

export function readCartSnapshotCount() {
  const win = getWindow();
  if (!win) return 0;

  try {
    const snapshotRaw = win.localStorage.getItem(CART_SNAPSHOT_KEY);
    const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : null;
    const count = Number(snapshot?.count);

    return Number.isFinite(count) && count >= 0 ? count : 0;
  } catch (error) {
    console.error('Không thể đọc snapshot giỏ hàng:', error);
    return 0;
  }
}

export function saveCartSnapshotCount(count) {
  const win = getWindow();
  if (!win) return 0;

  const nextCount = Math.max(0, safeNumber(count, 0));

  win.localStorage.setItem(
    CART_SNAPSHOT_KEY,
    JSON.stringify({
      updatedAt: Date.now(),
      count: nextCount,
    })
  );
  emitCartUpdated({ source: 'cart-snapshot', count: nextCount });

  return nextCount;
}

export function saveGuestCart(items) {
  const win = getWindow();
  if (!win) return [];

  const normalized = Array.isArray(items) ? items.map(normalizeGuestCartItem).filter(Boolean) : [];

  win.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
  saveCartSnapshotCount(getCartCount(normalized));

  return normalized;
}

export function clearGuestCart() {
  return saveGuestCart([]);
}

export function mergeGuestCartItem(items, nextItem) {
  const normalizedItems = Array.isArray(items) ? items.map(normalizeGuestCartItem).filter(Boolean) : [];
  const normalizedNextItem = normalizeGuestCartItem(nextItem);

  if (!normalizedNextItem) return normalizedItems;

  const index = normalizedItems.findIndex((item) => String(item.variantId) === String(normalizedNextItem.variantId));

  if (index >= 0) {
    const current = normalizedItems[index];
    const stockQty = safeNumber(
      normalizedNextItem.stockQty > 0 ? normalizedNextItem.stockQty : current.stockQty,
      0
    );
    const mergedQuantity = Math.max(
      1,
      stockQty > 0
        ? Math.min(current.quantity + normalizedNextItem.quantity, stockQty)
        : current.quantity + normalizedNextItem.quantity
    );

    normalizedItems[index] = {
      ...current,
      ...normalizedNextItem,
      quantity: mergedQuantity,
      unitPrice: normalizedNextItem.unitPrice || current.unitPrice,
      lineTotal: mergedQuantity * (normalizedNextItem.unitPrice || current.unitPrice || 0),
      stockQty: stockQty || current.stockQty,
      thumbnailUrl: normalizedNextItem.thumbnailUrl || current.thumbnailUrl,
      productName: normalizedNextItem.productName || current.productName,
    };

    return normalizedItems;
  }

  normalizedItems.push(normalizedNextItem);
  return normalizedItems;
}

export function removeGuestCartItem(items, key) {
  const normalizedItems = Array.isArray(items) ? items.map(normalizeGuestCartItem).filter(Boolean) : [];

  return normalizedItems.filter(
    (item) => String(item.variantId) !== String(key) && String(item.key) !== String(key)
  );
}

export function emitCartUpdated(detail = {}) {
  const win = getWindow();
  if (!win) return;

  win.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail }));
}

export function emitAuthUpdated(detail = {}) {
  const win = getWindow();
  if (!win) return;

  win.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail }));
}
