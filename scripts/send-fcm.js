#!/usr/bin/env node
/**
 * One-off FCM v1 send script
 * Usage examples:
 *   # Use service account JSON file
 *   FCM_SERVICE_ACCOUNT_JSON_PATH=./service-account.json node scripts/send-fcm.js --token=FCM_TOKEN --title="Test" --body="Hello"
 *
 *   # Or provide JSON string
 *   FCM_SERVICE_ACCOUNT_JSON='{"project_id":"...","private_key":"-----BEGIN...","client_email":"..."}' node scripts/send-fcm.js --token=... --title=... --body=...
 */

const fs = require('fs')
const path = require('path')
const { createSign } = require('crypto')

function parseArgs() {
  const args = {}
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=')
      args[k] = v === undefined ? true : v
    }
  })
  return args
}

function loadServiceAccount() {
  if (
    process.env.FCM_PROJECT_ID &&
    process.env.FCM_PRIVATE_KEY &&
    process.env.FCM_CLIENT_EMAIL
  ) {
    return {
      project_id: process.env.FCM_PROJECT_ID,
      private_key: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FCM_CLIENT_EMAIL
    }
  }

  if (process.env.FCM_SERVICE_ACCOUNT_JSON_PATH) {
    const jsonPath = path.resolve(process.env.FCM_SERVICE_ACCOUNT_JSON_PATH)
    const jsonContent = fs.readFileSync(jsonPath, 'utf8')
    return JSON.parse(jsonContent)
  }

  if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON)
  }

  throw new Error('No FCM service account found. Set FCM_SERVICE_ACCOUNT_JSON_PATH or FCM_SERVICE_ACCOUNT_JSON or the env vars.')
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Claim = Buffer.from(JSON.stringify(claim)).toString('base64url')
  const signatureInput = `${base64Header}.${base64Claim}`

  const sign = createSign('RSA-SHA256')
  sign.update(signatureInput)
  sign.end()
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n')
  const signature = sign.sign(privateKey, 'base64url')
  const jwt = `${signatureInput}.${signature}`

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  })

  const text = await resp.text()
  if (!resp.ok) {
    throw new Error(`OAuth token request failed: ${resp.status} ${text}`)
  }
  const data = JSON.parse(text)
  return data.access_token
}

async function sendFCM(serviceAccount, deviceToken, title, body, data) {
  const accessToken = await getAccessToken(serviceAccount)
  const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`
  const message = {
    message: {
      token: deviceToken,
      notification: { title, body },
      data: data || undefined,
      android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } }
    }
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })

  const respText = await resp.text()
  let parsed = respText
  try { parsed = JSON.parse(respText) } catch (e) {}

  return { status: resp.status, body: parsed }
}

(async () => {
  try {
    const args = parseArgs()
    const token = args.token || process.env.FCM_DEVICE_TOKEN
    const title = args.title || process.env.FCM_TITLE || 'Test Notification'
    const body = args.body || process.env.FCM_BODY || 'Hello from send-fcm script'
    if (!token) {
      console.error('Error: device token required. Pass --token=FCM_TOKEN or set FCM_DEVICE_TOKEN env var.')
      process.exit(2)
    }

    const sa = loadServiceAccount()
    console.log('Using project:', sa.project_id)
    console.log('Sending to token:', token.substring(0, 8) + '...')

    const result = await sendFCM(sa, token, title, body, { test: '1' })
    console.log('FCM response status:', result.status)
    console.log('FCM response body:', JSON.stringify(result.body, null, 2))

    if (result.status >= 200 && result.status < 300) {
      console.log('Send successful')
      process.exit(0)
    } else {
      console.error('Send failed')
      process.exit(1)
    }
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err)
    process.exit(1)
  }
})()
