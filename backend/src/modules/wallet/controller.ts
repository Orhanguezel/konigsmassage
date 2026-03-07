import type { RouteHandler } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { walletTransactions } from './schema';
import {
  walletDepositCreateSchema,
  walletDepositCaptureSchema,
} from './validation';
import {
  applyCompletedDeposit,
  createPendingDepositTx,
  getMyWalletTxById,
  getOrCreateWallet,
} from './service';
import { createPaypalOrder, capturePaypalOrder } from './paypal.service';
import type { PaypalCredentials } from './paypal.service';
import { getPaymentConfig } from '@/modules/siteSettings/service';
import { env } from '@/core/env';

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? '') as string;
  return { id };
}

/** GET /wallet — get current user's wallet info */
export const getMyWallet: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  const wallet = await getOrCreateWallet(userId);
  return reply.send(wallet);
};

/** GET /wallet/transactions — list current user's transactions */
export const listMyTransactions: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  const wallet = await getOrCreateWallet(userId);

  const { page = '1', limit = '20', payment_status, payment_method } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const where = [eq(walletTransactions.wallet_id, wallet.id)];
  if (payment_status) where.push(eq(walletTransactions.payment_status, payment_status as any));
  if (payment_method) where.push(eq(walletTransactions.payment_method, payment_method as any));

  const rows = await db
    .select()
    .from(walletTransactions)
    .where(and(...where))
    .orderBy(desc(walletTransactions.created_at))
    .limit(limitNum)
    .offset(offset);

  return reply.send({ data: rows, page: pageNum, limit: limitNum });
};

/** GET /wallet/deposit-methods */
export const getDepositMethods: RouteHandler = async (_req, reply) => {
  const cfg = await getPaymentConfig();
  return reply.send({
    paypal: {
      enabled: cfg.paypal.enabled,
      mode: cfg.paypal.mode,
    },
    bank_transfer: {
      enabled: cfg.bankTransfer.enabled,
      account_name: cfg.bankTransfer.accountName,
      iban: cfg.bankTransfer.iban,
      bank_name: cfg.bankTransfer.bankName,
      branch: cfg.bankTransfer.branch,
      swift: cfg.bankTransfer.swift,
    },
  });
};

/** POST /wallet/deposits */
export const createDepositRequest: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);

  const parsed = walletDepositCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });
  }

  const body = parsed.data;
  const wallet = await getOrCreateWallet(userId);
  const cfg = await getPaymentConfig();

  if (body.payment_method === 'bank_transfer') {
    if (!cfg.bankTransfer.enabled) {
      return reply.code(400).send({ error: 'bank_transfer_disabled' });
    }

    const tx = await createPendingDepositTx({
      walletId: wallet.id,
      userId,
      amount: body.amount,
      currency: body.currency,
      description: body.description ?? null,
      paymentMethod: 'bank_transfer',
      transactionRef: body.bank_transfer_reference ?? null,
    });

    return reply.code(201).send({
      success: true,
      transaction_id: tx.id,
      payment_method: 'bank_transfer',
      payment_status: tx.payment_status,
      bank_transfer: {
        enabled: cfg.bankTransfer.enabled,
        account_name: cfg.bankTransfer.accountName,
        iban: cfg.bankTransfer.iban,
        bank_name: cfg.bankTransfer.bankName,
        branch: cfg.bankTransfer.branch,
        swift: cfg.bankTransfer.swift,
      },
    });
  }

  if (!cfg.paypal.enabled) {
    return reply.code(400).send({ error: 'paypal_not_configured' });
  }

  const tx = await createPendingDepositTx({
    walletId: wallet.id,
    userId,
    amount: body.amount,
    currency: body.currency,
    description: body.description ?? null,
    paymentMethod: 'paypal',
  });

  const defaultFront = env.FRONTEND_URL || 'http://localhost:3055';
  const returnUrl = body.return_url || `${defaultFront}/wallet/deposit/success?tx=${tx.id}`;
  const cancelUrl = body.cancel_url || `${defaultFront}/wallet/deposit/cancel?tx=${tx.id}`;

  const ppCredentials: PaypalCredentials = {
    clientId: cfg.paypal.clientId!,
    clientSecret: cfg.paypal.clientSecret!,
    baseUrl: cfg.paypal.baseUrl,
  };

  try {
    const pp = await createPaypalOrder({
      amount: Number(tx.amount).toFixed(2),
      currency: tx.currency,
      referenceId: tx.id,
      customId: tx.id,
      description: tx.description || 'Wallet deposit',
      returnUrl,
      cancelUrl,
    }, ppCredentials);

    await db
      .update(walletTransactions)
      .set({ provider_order_id: pp.orderId } as any)
      .where(eq(walletTransactions.id, tx.id));

    return reply.code(201).send({
      success: true,
      transaction_id: tx.id,
      payment_method: 'paypal',
      payment_status: tx.payment_status,
      paypal: {
        order_id: pp.orderId,
        approve_url: pp.approveUrl,
      },
    });
  } catch (err: any) {
    await db
      .update(walletTransactions)
      .set({ payment_status: 'failed', description: `${tx.description || ''}\n[PAYPAL_CREATE_ERROR] ${String(err?.message || err)}`.trim() } as any)
      .where(eq(walletTransactions.id, tx.id));

    return reply.code(500).send({ error: 'paypal_create_failed' });
  }
};

/** POST /wallet/deposits/:id/paypal/capture */
export const captureDepositPaypal: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  const txId = (req.params as { id: string }).id;

  const parsed = walletDepositCaptureSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });
  }

  const tx = await getMyWalletTxById(userId, txId);
  if (!tx) return reply.code(404).send({ error: 'deposit_not_found' });
  if (tx.payment_method !== 'paypal') return reply.code(400).send({ error: 'invalid_payment_method' });

  const cfg = await getPaymentConfig();
  if (!cfg.paypal.enabled) return reply.code(400).send({ error: 'paypal_not_configured' });

  const ppCredentials: PaypalCredentials = {
    clientId: cfg.paypal.clientId!,
    clientSecret: cfg.paypal.clientSecret!,
    baseUrl: cfg.paypal.baseUrl,
  };

  try {
    const cap = await capturePaypalOrder(parsed.data.paypal_order_id, ppCredentials);

    const amountMatch = cap.amount ? Number(cap.amount) === Number(tx.amount) : false;
    const currencyMatch = cap.currency ? cap.currency.toUpperCase() === String(tx.currency).toUpperCase() : false;
    const captureOk = cap.captureStatus === 'COMPLETED' && amountMatch && currencyMatch;

    if (!captureOk) {
      await db
        .update(walletTransactions)
        .set({
          payment_status: 'failed',
          provider_order_id: cap.orderId,
          provider_capture_id: cap.captureId,
          description: `${tx.description || ''}\n[PAYPAL_CAPTURE_MISMATCH] ${JSON.stringify({ amount: cap.amount, currency: cap.currency, captureStatus: cap.captureStatus })}`.trim(),
        } as any)
        .where(eq(walletTransactions.id, tx.id));

      return reply.code(400).send({ error: 'paypal_capture_validation_failed' });
    }

    const applied = await applyCompletedDeposit({
      txId: tx.id,
      providerCaptureId: cap.captureId,
      providerOrderId: cap.orderId,
    });

    if (!applied.ok) return reply.code(400).send({ error: applied.reason });

    return reply.send({
      success: true,
      already_completed: applied.alreadyCompleted,
      transaction: applied.tx,
    });
  } catch {
    return reply.code(500).send({ error: 'paypal_capture_failed' });
  }
};
