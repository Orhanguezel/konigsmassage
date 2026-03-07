import type { FastifyInstance, RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';
import { users } from '../auth/schema';
import { wallets, walletTransactions } from './schema';
import {
  adminAdjustSchema,
  adminDepositListQuerySchema,
  adminRejectDepositSchema,
  adminStatusSchema,
  adminTransactionStatusSchema,
} from './validation';
import {
  applyCompletedDeposit,
  getOrCreateWallet,
  rejectPendingDeposit,
} from './service';

const BASE = '/wallets';
const TX_BASE = '/wallet_transactions';
const DEP_BASE = '/wallet_deposits';

function getAdminId(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  return String(u?.id ?? u?.sub ?? '');
}

const listWalletsAdmin: RouteHandler = async (req, reply) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select({
      id: wallets.id,
      user_id: wallets.user_id,
      email: users.email,
      full_name: users.full_name,
      balance: wallets.balance,
      total_earnings: wallets.total_earnings,
      total_withdrawn: wallets.total_withdrawn,
      currency: wallets.currency,
      status: wallets.status,
      created_at: wallets.created_at,
      updated_at: wallets.updated_at,
    })
    .from(wallets)
    .leftJoin(users, eq(wallets.user_id, users.id))
    .orderBy(desc(wallets.created_at))
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(wallets);

  reply.header('x-total-count', String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

const getWalletAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .select({
      id: wallets.id,
      user_id: wallets.user_id,
      email: users.email,
      full_name: users.full_name,
      balance: wallets.balance,
      total_earnings: wallets.total_earnings,
      total_withdrawn: wallets.total_withdrawn,
      currency: wallets.currency,
      status: wallets.status,
      created_at: wallets.created_at,
      updated_at: wallets.updated_at,
    })
    .from(wallets)
    .leftJoin(users, eq(wallets.user_id, users.id))
    .where(eq(wallets.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'wallet_not_found' });
  return reply.send(row);
};

const updateWalletStatusAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = adminStatusSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  await db.update(wallets).set({ status: parsed.data.status }).where(eq(wallets.id, id));
  return reply.send({ success: true });
};

const adjustWalletAdmin: RouteHandler = async (req, reply) => {
  const parsed = adminAdjustSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const { user_id, type, amount, purpose, description, payment_status } = parsed.data;
  const wallet = await getOrCreateWallet(user_id);

  const txId = randomUUID();
  await db.insert(walletTransactions).values({
    id: txId,
    wallet_id: wallet.id,
    user_id,
    type,
    amount: amount.toFixed(2),
    currency: wallet.currency,
    purpose,
    description: description ?? null,
    payment_method: 'admin_manual',
    payment_status,
    is_admin_created: 1,
  } as any);

  if (type === 'credit' && payment_status === 'completed') {
    await applyCompletedDeposit({ txId, approvedBy: getAdminId(req) });
  }

  return reply.send({ success: true, transaction_id: txId });
};

const listTransactionsAdmin: RouteHandler = async (req, reply) => {
  const { walletId } = req.params as { walletId: string };
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.wallet_id, walletId))
    .orderBy(desc(walletTransactions.created_at))
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(walletTransactions)
    .where(eq(walletTransactions.wallet_id, walletId));

  reply.header('x-total-count', String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

const updateTransactionStatusAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = adminTransactionStatusSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, id)).limit(1);
  if (!tx) return reply.code(404).send({ error: 'transaction_not_found' });

  const newStatus = parsed.data.payment_status;

  if (newStatus === 'completed' && tx.type === 'credit') {
    const applied = await applyCompletedDeposit({ txId: tx.id, approvedBy: getAdminId(req) });
    if (!applied.ok) return reply.code(400).send({ error: applied.reason });
    return reply.send({ success: true, transaction: applied.tx });
  }

  await db
      .update(walletTransactions)
      .set({ payment_status: newStatus, approved_by: getAdminId(req) } as any)
      .where(eq(walletTransactions.id, id));

  return reply.send({ success: true });
};

const listDepositsAdmin: RouteHandler = async (req, reply) => {
  const parsed = adminDepositListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const q = parsed.data;
  const offset = (q.page - 1) * q.limit;
  const filters = [eq(walletTransactions.purpose, 'deposit' as any)];

  if (q.payment_status) filters.push(eq(walletTransactions.payment_status, q.payment_status));
  if (q.payment_method) filters.push(eq(walletTransactions.payment_method, q.payment_method));
  if (q.user_id) filters.push(eq(walletTransactions.user_id, q.user_id));

  const rows = await db
    .select({
      id: walletTransactions.id,
      wallet_id: walletTransactions.wallet_id,
      user_id: walletTransactions.user_id,
      amount: walletTransactions.amount,
      currency: walletTransactions.currency,
      payment_method: walletTransactions.payment_method,
      payment_status: walletTransactions.payment_status,
      transaction_ref: walletTransactions.transaction_ref,
      provider_order_id: walletTransactions.provider_order_id,
      provider_capture_id: walletTransactions.provider_capture_id,
      description: walletTransactions.description,
      approved_by: walletTransactions.approved_by,
      approved_at: walletTransactions.approved_at,
      created_at: walletTransactions.created_at,
      user_email: users.email,
      user_full_name: users.full_name,
    })
    .from(walletTransactions)
    .leftJoin(users, eq(walletTransactions.user_id, users.id))
    .where(and(...filters))
    .orderBy(desc(walletTransactions.created_at))
    .limit(q.limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(walletTransactions)
    .where(and(...filters));

  reply.header('x-total-count', String(count));
  return reply.send({ data: rows, page: q.page, limit: q.limit });
};

const approveDepositAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const applied = await applyCompletedDeposit({
    txId: id,
    approvedBy: getAdminId(req),
  });

  if (!applied.ok) return reply.code(400).send({ error: applied.reason });
  return reply.send({ success: true, already_completed: applied.alreadyCompleted, transaction: applied.tx });
};

const rejectDepositAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = adminRejectDepositSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const res = await rejectPendingDeposit({
    txId: id,
    approvedBy: getAdminId(req),
    reason: parsed.data.reason,
  });

  if (!res.ok) return reply.code(400).send({ error: res.reason });
  return reply.send({ success: true, transaction: res.tx });
};

export async function registerWalletAdmin(app: FastifyInstance) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authz: any = { preHandler: [requireAuth, requireAdmin] };

  app.get(BASE, authz, listWalletsAdmin);
  app.get(`${BASE}/:id`, authz, getWalletAdmin);
  app.patch(`${BASE}/:id/status`, authz, updateWalletStatusAdmin);
  app.post(`${BASE}/adjust`, authz, adjustWalletAdmin);
  app.get(`${BASE}/:walletId/transactions`, authz, listTransactionsAdmin);

  app.patch(`${TX_BASE}/:id/status`, authz, updateTransactionStatusAdmin);

  app.get(DEP_BASE, authz, listDepositsAdmin);
  app.post(`${DEP_BASE}/:id/approve`, authz, approveDepositAdmin);
  app.post(`${DEP_BASE}/:id/reject`, authz, rejectDepositAdmin);
}
