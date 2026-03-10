/**
 * Server-side authoritative price catalog.
 * Prices here are the ONLY source of truth — never trust amounts from the client.
 */

export interface ProductDefinition {
  id: string
  name: string
  amountUsd: number
  productType: 'coupon' | 'vip_subscription' | 'lecture'
  meta: Record<string, unknown>
}

export const PRODUCT_CATALOG: Record<string, ProductDefinition> = {
  // Coupons
  'coupon_20m_x1': {
    id: 'coupon_20m_x1',
    name: '20분 쿠폰 1개',
    amountUsd: 4.99,
    productType: 'coupon',
    meta: { coupon_minutes: 20, coupon_count: 1 },
  },
  'coupon_20m_x3': {
    id: 'coupon_20m_x3',
    name: '20분 쿠폰 3개',
    amountUsd: 12.99,
    productType: 'coupon',
    meta: { coupon_minutes: 20, coupon_count: 3 },
  },
  'coupon_20m_x5': {
    id: 'coupon_20m_x5',
    name: '20분 쿠폰 5개',
    amountUsd: 19.99,
    productType: 'coupon',
    meta: { coupon_minutes: 20, coupon_count: 5 },
  },
  'coupon_40m_x1': {
    id: 'coupon_40m_x1',
    name: '40분 쿠폰 1개',
    amountUsd: 8.99,
    productType: 'coupon',
    meta: { coupon_minutes: 40, coupon_count: 1 },
  },
  // VIP subscriptions
  'vip_1m': {
    id: 'vip_1m',
    name: 'VIP 1개월',
    amountUsd: 9.99,
    productType: 'vip_subscription',
    meta: { plan_type: 'monthly', duration_months: 1 },
  },
  'vip_3m': {
    id: 'vip_3m',
    name: 'VIP 3개월',
    amountUsd: 24.99,
    productType: 'vip_subscription',
    meta: { plan_type: 'quarterly', duration_months: 3 },
  },
  'vip_12m': {
    id: 'vip_12m',
    name: 'VIP 12개월',
    amountUsd: 79.99,
    productType: 'vip_subscription',
    meta: { plan_type: 'annual', duration_months: 12 },
  },
}

/** Tolerance in USD for floating point comparisons (±1 cent) */
const AMOUNT_TOLERANCE = 0.02

/**
 * Look up a product by its catalog ID and validate the client-supplied amount.
 * Returns the canonical ProductDefinition or null if invalid.
 */
export function validateProductAndAmount(
  productId: string,
  clientAmount: number
): ProductDefinition | null {
  const product = PRODUCT_CATALOG[productId]
  if (!product) return null

  const diff = Math.abs(product.amountUsd - clientAmount)
  if (diff > AMOUNT_TOLERANCE) return null

  return product
}
