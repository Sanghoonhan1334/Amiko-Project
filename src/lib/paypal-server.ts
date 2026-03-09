/**
 * AMIKO — Server-side PayPal REST API v2 utility
 * Centralizes token acquisition and common API calls used across education endpoints.
 * Import ONLY in server-side code (API routes).
 */

/** Returns the correct PayPal API base URL based on environment */
export function getPayPalBase(): string {
  return (
    process.env.PAYPAL_API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com')
  )
}

/** Get a short-lived PayPal OAuth2 access token */
export async function getPayPalToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured (NEXT_PUBLIC_PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)')
  }

  const res = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal token error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.access_token as string
}

/** Fetch order details from PayPal */
export async function getPayPalOrder(orderId: string) {
  const token = await getPayPalToken()
  const res = await fetch(`${getPayPalBase()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

/** Capture a PayPal order (transition APPROVED → COMPLETED) */
export async function capturePayPalOrder(orderId: string): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const token = await getPayPalToken()
  const res = await fetch(`${getPayPalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
  return { ok: res.ok, status: res.status, data: await res.json() }
}

/** Refund a PayPal capture (full amount by default, or partial with `amount`) */
export async function refundPayPalCapture(
  captureId: string,
  opts?: { amount?: number; currency?: string; note?: string }
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const token = await getPayPalToken()
  const body: Record<string, unknown> = {}

  if (opts?.amount) {
    body.amount = {
      value: opts.amount.toFixed(2),
      currency_code: opts.currency || 'USD'
    }
  }
  if (opts?.note) {
    body.note_to_payer = opts.note
  }

  const res = await fetch(
    `${getPayPalBase()}/v2/payments/captures/${captureId}/refund`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }
  )
  return { ok: res.ok, status: res.status, data: await res.json() }
}

/** Create a PayPal checkout order and return the approve URL */
export async function createPayPalCheckoutOrder(opts: {
  amount: number
  currency?: string
  description?: string
  customId?: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const token = await getPayPalToken()
  const currency = opts.currency || 'USD'

  const res = await fetch(`${getPayPalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: currency, value: opts.amount.toFixed(2) },
          description: opts.description,
          custom_id: opts.customId
        }
      ],
      application_context: {
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
        brand_name: 'AMIKO',
        locale: 'es-ES',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW'
      }
    })
  })
  return { ok: res.ok, status: res.status, data: await res.json() }
}
