// src/modules/wallet/webhook.controller.ts
// PayPal Webhook handler — handles payment completion events for both
// wallet deposits and gutschein purchases.

import type { RouteHandler } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { getPaymentConfig } from '@/modules/siteSettings/service';
import {
  verifyWebhookSignature,
  getPaypalOrderDetails,
  type PaypalCredentials,
  type PaypalWebhookHeaders,
} from './paypal.service';
import { walletTransactions } from './schema';
import { applyCompletedDeposit } from './service';
import { gutscheins } from '@/modules/gutschein/schema';
import { sendGutscheinEmail } from '@/modules/gutschein/email';

type WebhookEvent = {
  id: string;
  event_type: string;
  resource_type: string;
  resource: {
    id?: string;
    status?: string;
    custom_id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    purchase_units?: Array<{
      reference_id?: string;
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
          custom_id?: string;
          amount?: { value: string; currency_code: string };
        }>;
      };
    }>;
    amount?: { value: string; currency_code: string };
  };
  summary?: string;
  create_time?: string;
};

// Events we care about
const HANDLED_EVENTS = [
  'CHECKOUT.ORDER.COMPLETED',
  'CHECKOUT.ORDER.APPROVED',
  'PAYMENT.CAPTURE.COMPLETED',
];

export const paypalWebhookHandler: RouteHandler = async (req, reply) => {
  const cfg = await getPaymentConfig();

  if (!cfg.paypal.enabled || !cfg.paypal.clientId || !cfg.paypal.clientSecret) {
    return reply.code(400).send({ error: 'paypal_not_configured' });
  }

  const webhookId = cfg.paypal.webhookId;
  if (!webhookId) {
    req.log.warn('paypal_webhook_id_not_configured — skipping verification');
  }

  // Parse event
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  let event: WebhookEvent;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body as WebhookEvent;
  } catch {
    return reply.code(400).send({ error: 'invalid_json' });
  }

  // Verify signature if webhookId is configured
  if (webhookId) {
    const headers: PaypalWebhookHeaders = {
      'paypal-transmission-id': req.headers['paypal-transmission-id'] as string || '',
      'paypal-transmission-time': req.headers['paypal-transmission-time'] as string || '',
      'paypal-transmission-sig': req.headers['paypal-transmission-sig'] as string || '',
      'paypal-cert-url': req.headers['paypal-cert-url'] as string || '',
      'paypal-auth-algo': req.headers['paypal-auth-algo'] as string || '',
    };

    const ppCredentials: PaypalCredentials = {
      clientId: cfg.paypal.clientId,
      clientSecret: cfg.paypal.clientSecret,
      baseUrl: cfg.paypal.baseUrl,
    };

    try {
      const verified = await verifyWebhookSignature(webhookId, headers, rawBody, ppCredentials);
      if (!verified) {
        req.log.warn({ event_id: event.id, event_type: event.event_type }, 'paypal_webhook_signature_invalid');
        return reply.code(401).send({ error: 'signature_verification_failed' });
      }
    } catch (err: any) {
      req.log.error({ err: err?.message }, 'paypal_webhook_verify_error');
      // Still process — verification endpoint might be temporarily unavailable
    }
  }

  req.log.info({ event_id: event.id, event_type: event.event_type }, 'paypal_webhook_received');

  // Only handle events we care about
  if (!HANDLED_EVENTS.includes(event.event_type)) {
    return reply.send({ received: true, handled: false });
  }

  const ppCredentials: PaypalCredentials = {
    clientId: cfg.paypal.clientId,
    clientSecret: cfg.paypal.clientSecret,
    baseUrl: cfg.paypal.baseUrl,
  };

  try {
    // Extract order ID from the event
    let orderId: string | null = null;
    let customId: string | null = null;

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // For capture events, resource is the capture itself
      orderId = event.resource?.supplementary_data?.related_ids?.order_id ?? null;
      customId = event.resource?.custom_id ?? null;
    } else {
      // For order events, resource is the order
      orderId = event.resource?.id ?? null;
      const pu = event.resource?.purchase_units?.[0];
      customId = pu?.custom_id ?? null;
    }

    if (!orderId && !customId) {
      req.log.warn({ event_id: event.id }, 'paypal_webhook_no_order_or_custom_id');
      return reply.send({ received: true, handled: false });
    }

    // Fetch full order details from PayPal to get accurate data
    let orderDetails: Awaited<ReturnType<typeof getPaypalOrderDetails>> | null = null;
    if (orderId) {
      try {
        orderDetails = await getPaypalOrderDetails(orderId, ppCredentials);
      } catch (err: any) {
        req.log.error({ err: err?.message, orderId }, 'paypal_webhook_get_order_failed');
      }
    }

    const resolvedCustomId = orderDetails?.customId ?? customId;
    const captureCompleted = orderDetails
      ? (orderDetails.captureStatus === 'COMPLETED' || orderDetails.orderStatus === 'COMPLETED')
      : (event.resource?.status === 'COMPLETED');

    if (!captureCompleted) {
      req.log.info({ event_id: event.id, status: orderDetails?.captureStatus }, 'paypal_webhook_not_completed');
      return reply.send({ received: true, handled: false, reason: 'not_completed' });
    }

    if (!resolvedCustomId) {
      req.log.warn({ event_id: event.id, orderId }, 'paypal_webhook_no_custom_id');
      return reply.send({ received: true, handled: false });
    }

    // Try to match as gutschein
    const gutscheinHandled = await handleGutscheinPayment(resolvedCustomId, orderId, orderDetails, req);

    // Try to match as wallet deposit
    const walletHandled = await handleWalletDeposit(resolvedCustomId, orderId, orderDetails, req);

    req.log.info(
      { event_id: event.id, gutschein: gutscheinHandled, wallet: walletHandled },
      'paypal_webhook_processed',
    );

    return reply.send({ received: true, handled: gutscheinHandled || walletHandled });
  } catch (err: any) {
    req.log.error({ err: err?.message, event_id: event.id }, 'paypal_webhook_processing_error');
    // Return 200 to prevent PayPal from retrying
    return reply.send({ received: true, error: 'processing_error' });
  }
};

// ── Gutschein Payment Handling ──────────────────────────────────────────────

async function handleGutscheinPayment(
  customId: string,
  orderId: string | null,
  orderDetails: any,
  req: any,
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.id, customId))
    .limit(1);

  if (!row) return false;

  // Already processed
  if (row.payment_status === 'paid') {
    req.log.info({ gutschein_id: row.id }, 'paypal_webhook_gutschein_already_paid');
    return true;
  }

  // Update gutschein
  const issuedAt = new Date();
  await db
    .update(gutscheins)
    .set({
      payment_status: 'paid',
      status: 'active',
      issued_at: issuedAt,
      payment_transaction_id: orderDetails?.captureId ?? orderId,
    } as any)
    .where(and(eq(gutscheins.id, row.id), eq(gutscheins.payment_status, 'pending')));

  req.log.info({ gutschein_id: row.id, code: row.code }, 'paypal_webhook_gutschein_activated');

  // Send emails
  const emailData = {
    code: row.code,
    value: row.value,
    currency: row.currency,
    purchaser_name: row.purchaser_name,
    purchaser_email: row.purchaser_email,
    recipient_name: row.recipient_name,
    recipient_email: row.recipient_email,
    personal_message: row.personal_message,
    expires_at: row.expires_at,
    issued_at: issuedAt,
  };

  if (row.purchaser_email) {
    sendGutscheinEmail(emailData, row.purchaser_email).catch((e) =>
      req.log.error({ err: e?.message ?? e }, 'webhook_gutschein_email_purchaser_failed'),
    );
  }
  if (row.recipient_email && row.recipient_email !== row.purchaser_email) {
    sendGutscheinEmail(emailData, row.recipient_email).catch((e) =>
      req.log.error({ err: e?.message ?? e }, 'webhook_gutschein_email_recipient_failed'),
    );
  }

  return true;
}

// ── Wallet Deposit Handling ─────────────────────────────────────────────────

async function handleWalletDeposit(
  customId: string,
  orderId: string | null,
  orderDetails: any,
  req: any,
): Promise<boolean> {
  // customId is the wallet transaction ID
  const [tx] = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, customId))
    .limit(1);

  if (!tx) return false;

  // Already processed
  if (tx.payment_status === 'completed') {
    req.log.info({ tx_id: tx.id }, 'paypal_webhook_wallet_already_completed');
    return true;
  }

  if (tx.payment_status !== 'pending') {
    req.log.warn({ tx_id: tx.id, status: tx.payment_status }, 'paypal_webhook_wallet_invalid_status');
    return false;
  }

  // Verify amount if we have order details
  if (orderDetails?.amount) {
    const amountMatch = Number(orderDetails.amount) === Number(tx.amount);
    const currencyMatch = orderDetails.currency?.toUpperCase() === String(tx.currency).toUpperCase();
    if (!amountMatch || !currencyMatch) {
      req.log.warn(
        { tx_id: tx.id, expected: `${tx.amount} ${tx.currency}`, got: `${orderDetails.amount} ${orderDetails.currency}` },
        'paypal_webhook_wallet_amount_mismatch',
      );
      return false;
    }
  }

  const result = await applyCompletedDeposit({
    txId: tx.id,
    providerCaptureId: orderDetails?.captureId ?? null,
    providerOrderId: orderId ?? tx.provider_order_id,
  });

  if (result.ok) {
    req.log.info({ tx_id: tx.id, already: result.alreadyCompleted }, 'paypal_webhook_wallet_deposit_applied');
  } else {
    req.log.warn({ tx_id: tx.id, reason: result.reason }, 'paypal_webhook_wallet_deposit_failed');
  }

  return result.ok;
}
