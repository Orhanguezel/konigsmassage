import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { wallets, walletTransactions } from './schema';

export type PaymentMethod = 'paypal' | 'bank_transfer' | 'admin_manual';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export async function getOrCreateWallet(userId: string) {
  const [existing] = await db.select().from(wallets).where(eq(wallets.user_id, userId)).limit(1);
  if (existing) return existing;

  const id = randomUUID();
  await db.insert(wallets).values({ id, user_id: userId });
  const [created] = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
  return created;
}

export async function createPendingDepositTx(input: {
  walletId: string;
  userId: string;
  amount: number;
  currency: string;
  description?: string | null;
  paymentMethod: PaymentMethod;
  transactionRef?: string | null;
  providerOrderId?: string | null;
}) {
  const id = randomUUID();
  await db.insert(walletTransactions).values({
    id,
    wallet_id: input.walletId,
    user_id: input.userId,
    type: 'credit',
    amount: input.amount.toFixed(2),
    currency: input.currency,
    purpose: 'deposit',
    description: input.description ?? null,
    payment_method: input.paymentMethod,
    payment_status: 'pending',
    transaction_ref: input.transactionRef ?? null,
    provider_order_id: input.providerOrderId ?? null,
    is_admin_created: 0,
  } as any);

  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, id)).limit(1);
  return tx;
}

export async function setProviderOrderId(txId: string, providerOrderId: string) {
  await db
    .update(walletTransactions)
    .set({ provider_order_id: providerOrderId } as any)
    .where(eq(walletTransactions.id, txId));
}

export async function getMyWalletTxById(userId: string, txId: string) {
  const [tx] = await db
    .select()
    .from(walletTransactions)
    .where(and(eq(walletTransactions.id, txId), eq(walletTransactions.user_id, userId)))
    .limit(1);
  return tx ?? null;
}

export async function applyCompletedDeposit(input: {
  txId: string;
  approvedBy?: string | null;
  providerCaptureId?: string | null;
  providerOrderId?: string | null;
}) {
  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, input.txId)).limit(1);
  if (!tx) return { ok: false as const, reason: 'not_found' as const };

  if (tx.payment_status === 'completed') {
    return { ok: true as const, alreadyCompleted: true as const, tx };
  }

  if (tx.payment_status !== 'pending') {
    return { ok: false as const, reason: 'invalid_status' as const };
  }

  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, tx.wallet_id)).limit(1);
  if (!wallet) return { ok: false as const, reason: 'wallet_not_found' as const };

  let appliedNow = false;
  await db.transaction(async (trx) => {
    const updateResult = await trx
      .update(walletTransactions)
      .set({
        payment_status: 'completed',
        approved_at: sql`CURRENT_TIMESTAMP(3)`,
        approved_by: input.approvedBy ?? null,
        provider_capture_id: input.providerCaptureId ?? null,
        provider_order_id: input.providerOrderId ?? tx.provider_order_id ?? null,
      } as any)
      .where(and(eq(walletTransactions.id, tx.id), eq(walletTransactions.payment_status, 'pending')));

    const affected = Number(
      (updateResult as any)?.affectedRows ??
      (updateResult as any)?.rowsAffected ??
      0,
    );
    if (affected !== 1) return;

    appliedNow = true;
    const amount = Number(tx.amount || 0);
    await trx
      .update(wallets)
      .set({
        balance: (Number(wallet.balance) + amount).toFixed(2),
        total_earnings: (Number(wallet.total_earnings) + amount).toFixed(2),
      } as any)
      .where(eq(wallets.id, wallet.id));
  });

  const [updatedTx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, tx.id)).limit(1);
  if (updatedTx?.payment_status === 'completed') {
    return { ok: true as const, alreadyCompleted: !appliedNow, tx: updatedTx };
  }

  return { ok: false as const, reason: 'invalid_status' as const };
}

/**
 * Debit wallet balance for a payment (e.g. booking payment).
 * Creates a completed debit transaction and reduces balance atomically.
 */
export async function spendFromWallet(input: {
  userId: string;
  amount: number;
  currency: string;
  purpose: string;
  description?: string | null;
  transactionRef?: string | null;
}) {
  const wallet = await getOrCreateWallet(input.userId);
  const balance = Number(wallet.balance || 0);

  if (balance < input.amount) {
    return { ok: false as const, reason: 'insufficient_balance' as const };
  }

  const id = randomUUID();

  await db.transaction(async (trx) => {
    await trx.insert(walletTransactions).values({
      id,
      wallet_id: wallet.id,
      user_id: input.userId,
      type: 'debit',
      amount: input.amount.toFixed(2),
      currency: input.currency,
      purpose: input.purpose,
      description: input.description ?? null,
      payment_method: 'admin_manual',
      payment_status: 'completed',
      transaction_ref: input.transactionRef ?? null,
      is_admin_created: 0,
      approved_at: sql`CURRENT_TIMESTAMP(3)`,
    } as any);

    await trx
      .update(wallets)
      .set({
        balance: (balance - input.amount).toFixed(2),
        total_withdrawn: (Number(wallet.total_withdrawn) + input.amount).toFixed(2),
      } as any)
      .where(eq(wallets.id, wallet.id));
  });

  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, id)).limit(1);
  return { ok: true as const, tx };
}

export async function rejectPendingDeposit(input: { txId: string; approvedBy?: string | null; reason?: string | null }) {
  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, input.txId)).limit(1);
  if (!tx) return { ok: false as const, reason: 'not_found' as const };
  if (tx.payment_status === 'completed') return { ok: false as const, reason: 'already_completed' as const };

  await db
    .update(walletTransactions)
    .set({
      payment_status: 'failed',
      approved_at: sql`CURRENT_TIMESTAMP(3)`,
      approved_by: input.approvedBy ?? null,
      description: input.reason ? `${tx.description ?? ''}\n[REJECT_REASON] ${input.reason}`.trim() : tx.description,
    } as any)
    .where(eq(walletTransactions.id, input.txId));

  const [updatedTx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, input.txId)).limit(1);
  return { ok: true as const, tx: updatedTx };
}
