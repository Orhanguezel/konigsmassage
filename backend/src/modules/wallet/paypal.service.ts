import { env } from '@/core/env';

type PayPalAccessTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type PayPalCreateOrderResponse = {
  id: string;
  status: string;
  links?: { href: string; rel: string; method: string }[];
};

type PayPalCaptureOrderResponse = {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount?: { value: string; currency_code: string };
      }>;
    };
  }>;
};

export type PaypalCredentials = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
};

function getEnvCredentials(): PaypalCredentials {
  return {
    clientId: env.PAYPAL_CLIENT_ID || '',
    clientSecret: env.PAYPAL_CLIENT_SECRET || '',
    baseUrl: env.PAYPAL_BASE_URL?.trim() || 'https://api-m.sandbox.paypal.com',
  };
}

async function getAccessToken(creds: PaypalCredentials): Promise<string> {
  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('paypal_not_configured');
  }

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
  const url = `${creds.baseUrl}/v1/oauth2/token`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`paypal_auth_failed:${res.status}:${txt}`);
  }

  const data = (await res.json()) as PayPalAccessTokenResponse;
  if (!data?.access_token) throw new Error('paypal_auth_token_missing');
  return data.access_token;
}

export type CreatePaypalOrderInput = {
  amount: string;
  currency: string;
  referenceId: string;
  customId: string;
  description?: string | null;
  returnUrl: string;
  cancelUrl: string;
};

export async function createPaypalOrder(input: CreatePaypalOrderInput, credentials?: PaypalCredentials) {
  const creds = credentials ?? getEnvCredentials();
  const token = await getAccessToken(creds);
  const url = `${creds.baseUrl}/v2/checkout/orders`;

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: input.referenceId,
        custom_id: input.customId,
        description: input.description || 'Wallet deposit',
        amount: {
          currency_code: input.currency,
          value: input.amount,
        },
      },
    ],
    application_context: {
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      user_action: 'PAY_NOW',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': input.customId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`paypal_create_order_failed:${res.status}:${txt}`);
  }

  const data = (await res.json()) as PayPalCreateOrderResponse;
  const approveUrl = data.links?.find((l) => l.rel === 'approve')?.href ?? null;

  return {
    orderId: data.id,
    status: data.status,
    approveUrl,
  };
}

export async function capturePaypalOrder(orderId: string, credentials?: PaypalCredentials) {
  const creds = credentials ?? getEnvCredentials();
  const token = await getAccessToken(creds);
  const url = `${creds.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`paypal_capture_failed:${res.status}:${txt}`);
  }

  const data = (await res.json()) as PayPalCaptureOrderResponse;
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    orderId: data.id,
    orderStatus: data.status,
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? null,
    raw: data,
  };
}

/** @deprecated Use getPaymentConfig() from siteSettings/service instead */
export function paypalEnabled() {
  const creds = getEnvCredentials();
  return Boolean(creds.clientId && creds.clientSecret);
}

// ── Webhook Signature Verification ──────────────────────────────────────────

export type PaypalWebhookHeaders = {
  'paypal-transmission-id': string;
  'paypal-transmission-time': string;
  'paypal-transmission-sig': string;
  'paypal-cert-url': string;
  'paypal-auth-algo': string;
};

export async function verifyWebhookSignature(
  webhookId: string,
  headers: PaypalWebhookHeaders,
  rawBody: string,
  credentials?: PaypalCredentials,
): Promise<boolean> {
  const creds = credentials ?? getEnvCredentials();
  const token = await getAccessToken(creds);
  const url = `${creds.baseUrl}/v1/notifications/verify-webhook-signature`;

  const payload = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return false;

  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}

// ── Get PayPal Order Details ────────────────────────────────────────────────

export async function getPaypalOrderDetails(orderId: string, credentials?: PaypalCredentials) {
  const creds = credentials ?? getEnvCredentials();
  const token = await getAccessToken(creds);
  const url = `${creds.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`paypal_get_order_failed:${res.status}:${txt}`);
  }

  const data = (await res.json()) as PayPalCaptureOrderResponse & {
    purchase_units?: Array<{
      reference_id?: string;
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
          amount?: { value: string; currency_code: string };
          custom_id?: string;
        }>;
      };
    }>;
  };

  const pu = data.purchase_units?.[0];
  const capture = pu?.payments?.captures?.[0];

  return {
    orderId: data.id,
    orderStatus: data.status,
    referenceId: pu?.reference_id ?? null,
    customId: pu?.custom_id ?? capture?.custom_id ?? null,
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? null,
  };
}
