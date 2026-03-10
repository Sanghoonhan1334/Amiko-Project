/**
 * PayPal Webhook Signature Verification
 * https://developer.paypal.com/api/rest/webhooks/
 *
 * PayPal signs each webhook event with a transmission signature. This module
 * verifies that signature using the PayPal REST API before trusting any event.
 */

export interface PayPalWebhookHeaders {
  transmissionId: string | null
  transmissionTime: string | null
  certUrl: string | null
  authAlgo: string | null
  transmissionSig: string | null
}

export function extractWebhookHeaders(request: Request): PayPalWebhookHeaders {
  const headers = request.headers as Headers
  return {
    transmissionId: headers.get('paypal-transmission-id'),
    transmissionTime: headers.get('paypal-transmission-time'),
    certUrl: headers.get('paypal-cert-url'),
    authAlgo: headers.get('paypal-auth-algo'),
    transmissionSig: headers.get('paypal-transmission-sig'),
  }
}

/**
 * Verify a PayPal webhook event using the PayPal REST API.
 * Returns true only when PayPal confirms the signature.
 *
 * @param rawBody   - Raw request body (string, not parsed)
 * @param headers   - Extracted PayPal signature headers
 * @param webhookId - Webhook ID configured in PayPal Developer Dashboard
 *                    (env: PAYPAL_WEBHOOK_ID)
 */
export async function verifyPayPalWebhook(
  rawBody: string,
  headers: PayPalWebhookHeaders,
  webhookId: string
): Promise<boolean> {
  const { transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig } = headers

  // All headers required
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.error('[PAYPAL_VERIFY] Missing required signature headers')
    return false
  }

  // Validate certUrl is from paypal.com (prevent SSRF abuse)
  try {
    const url = new URL(certUrl)
    if (!url.hostname.endsWith('.paypal.com')) {
      console.error('[PAYPAL_VERIFY] cert-url is not from paypal.com:', certUrl)
      return false
    }
  } catch {
    console.error('[PAYPAL_VERIFY] Invalid cert-url:', certUrl)
    return false
  }

  try {
    const accessToken = await getPayPalAccessToken()

    const paypalApiBase =
      process.env.PAYPAL_API_BASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com')

    const verifyResponse = await fetch(
      `${paypalApiBase}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        }),
      }
    )

    if (!verifyResponse.ok) {
      console.error('[PAYPAL_VERIFY] Verification API error:', verifyResponse.status)
      return false
    }

    const verifyData = await verifyResponse.json()
    const isValid = verifyData.verification_status === 'SUCCESS'

    if (!isValid) {
      console.error('[PAYPAL_VERIFY] Signature verification FAILED:', verifyData.verification_status)
    }

    return isValid
  } catch (error) {
    console.error('[PAYPAL_VERIFY] Exception during verification:', error)
    return false
  }
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const baseUrl =
    process.env.PAYPAL_API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com')

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`PayPal token error: ${data.error_description || data.error}`)
  }

  return data.access_token
}
