'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/gutschein/_components/admin-gutschein-client.tsx
// Admin Gift Cards list + detail/edit dialog
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Gift, Loader2, Plus, RefreshCcw, Search, CheckCircle2, Ban, Eye,
} from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import type {
  GutscheinDto, GutscheinListQuery, GutscheinStatus, GutscheinAdminUpdateBody,
} from '@/integrations/shared';
import {
  useListGutscheinsAdminQuery,
  useCreateGutscheinAdminMutation,
  useCancelGutscheinAdminMutation,
  useActivateGutscheinAdminMutation,
  useUpdateGutscheinAdminMutation,
  useListGutscheinProductsAdminQuery,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(val: string | null | undefined, locale?: string) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString(locale || undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(val); }
}

function fmtDateShort(val: string | null | undefined, locale?: string) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString(locale || undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch { return String(val); }
}

function getErrMsg(e: unknown, fallback: string): string {
  const anyErr = e as any;
  return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || fallback;
}

function toDateInputValue(val: string | null | undefined): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch { return ''; }
}

const STATUS_BADGE_MAP: Record<GutscheinStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  active:    'bg-green-100 text-green-800',
  redeemed:  'bg-blue-100 text-blue-800',
  expired:   'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: GutscheinStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_BADGE_MAP[status] ?? 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className={cn('text-sm break-all', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CreateForm = {
  product_id: string; value: string; currency: string; validity_days: string;
  recipient_name: string; recipient_email: string;
  purchaser_name: string; purchaser_email: string; note: string;
};

const EMPTY_CREATE: CreateForm = {
  product_id: '', value: '', currency: 'EUR', validity_days: '365',
  recipient_name: '', recipient_email: '',
  purchaser_name: '', purchaser_email: '', note: '',
};

type EditForm = {
  status: GutscheinStatus;
  recipient_name: string;
  recipient_email: string;
  expires_at: string;
  note: string;
};

function itemToEditForm(item: GutscheinDto): EditForm {
  return {
    status:          item.status,
    recipient_name:  item.recipient_name ?? '',
    recipient_email: item.recipient_email ?? '',
    expires_at:      toDateInputValue(item.expires_at),
    note:            item.note ?? '',
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminGutscheinClient() {
  const router        = useRouter();
  const t             = useAdminT('admin.gutschein');
  const adminUiLocale = usePreferencesStore((s) => s.adminLocale);

  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [search, setSearch]             = React.useState('');

  const queryParams = React.useMemo((): GutscheinListQuery => {
    const out: GutscheinListQuery = {};
    if (statusFilter !== 'all') out.status = statusFilter as GutscheinStatus;
    if (search.trim()) out.q = search.trim();
    return out;
  }, [statusFilter, search]);

  const { data: result, isLoading, isFetching, refetch } = useListGutscheinsAdminQuery(queryParams);
  const { data: productsResult } = useListGutscheinProductsAdminQuery();

  const [createGutschein,  { isLoading: creating }]   = useCreateGutscheinAdminMutation();
  const [cancelGutschein,  { isLoading: cancelling }]  = useCancelGutscheinAdminMutation();
  const [activateGutschein,{ isLoading: activating }]  = useActivateGutscheinAdminMutation();
  const [updateGutschein,  { isLoading: updating }]    = useUpdateGutscheinAdminMutation();

  const items    = result?.data ?? [];
  const total    = result?.total ?? 0;
  const products = productsResult?.data ?? [];

  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [itemToCancel,     setItemToCancel]     = React.useState<GutscheinDto | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createForm,       setCreateForm]       = React.useState<CreateForm>(EMPTY_CREATE);
  const [detailItem,       setDetailItem]       = React.useState<GutscheinDto | null>(null);
  const [editForm,         setEditForm]         = React.useState<EditForm | null>(null);

  const busy = isLoading || isFetching || creating || cancelling || activating || updating;

  React.useEffect(() => {
    if (!createForm.product_id) return;
    const prod = products.find((p) => p.id === createForm.product_id);
    if (prod) {
      setCreateForm((prev) => ({
        ...prev,
        value:         prod.value,
        validity_days: String(prod.validity_days),
        currency:      prod.currency,
      }));
    }
  }, [createForm.product_id, products]);

  const handleCancelClick = (item: GutscheinDto) => {
    setItemToCancel(item);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!itemToCancel) return;
    try {
      await cancelGutschein({ id: itemToCancel.id }).unwrap();
      toast.success(t('messages.cancelled', {}, 'Gift card cancelled.'));
      setCancelDialogOpen(false);
      setItemToCancel(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.cancelError', {}, 'Failed to cancel.')));
    }
  };

  const handleActivate = async (item: GutscheinDto) => {
    try {
      await activateGutschein({ id: item.id }).unwrap();
      toast.success(t('messages.activated', {}, 'Gift card activated.'));
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.activateError', {}, 'Failed to activate.')));
    }
  };

  const handleCreate = async () => {
    const value = parseFloat(createForm.value);
    if (!value || value <= 0) {
      toast.error(t('messages.valueRequired', {}, 'Please enter a valid value.'));
      return;
    }
    try {
      await createGutschein({
        product_id:      createForm.product_id || undefined,
        value,
        currency:        createForm.currency || 'EUR',
        validity_days:   parseInt(createForm.validity_days) || 365,
        recipient_name:  createForm.recipient_name || undefined,
        recipient_email: createForm.recipient_email || undefined,
        purchaser_name:  createForm.purchaser_name || undefined,
        purchaser_email: createForm.purchaser_email || undefined,
        note:            createForm.note || undefined,
      }).unwrap();
      toast.success(t('messages.created', {}, 'Gift card created.'));
      setCreateDialogOpen(false);
      setCreateForm(EMPTY_CREATE);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.createError', {}, 'Failed to create gift card.')));
    }
  };

  const openDetail = (item: GutscheinDto) => {
    setDetailItem(item);
    setEditForm(itemToEditForm(item));
  };

  const handleSaveEdit = async () => {
    if (!detailItem || !editForm) return;
    const body: GutscheinAdminUpdateBody = {};
    if (editForm.status !== detailItem.status)
      body.status = editForm.status;
    if ((editForm.recipient_name || null) !== detailItem.recipient_name)
      body.recipient_name = editForm.recipient_name || null;
    if ((editForm.recipient_email || null) !== detailItem.recipient_email)
      body.recipient_email = editForm.recipient_email || null;
    if (editForm.expires_at !== toDateInputValue(detailItem.expires_at))
      body.expires_at = editForm.expires_at || null;
    if ((editForm.note || null) !== detailItem.note)
      body.admin_note = editForm.note || null;

    if (Object.keys(body).length === 0) {
      toast.info('No changes.');
      return;
    }
    try {
      await updateGutschein({ id: detailItem.id, body }).unwrap();
      toast.success(t('messages.updated', {}, 'Gift card updated.'));
      setDetailItem(null);
      setEditForm(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.updateError', {}, 'Failed to update.')));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="size-5" />
                  {t('title', {}, 'Gift Cards')}
                </CardTitle>
                <CardDescription>{t('description', {}, 'Manage gift cards.')}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/admin/gutschein/products')} disabled={busy}>
                  {t('actions.products', {}, 'Products')}
                </Button>
                <Button onClick={() => { setCreateForm(EMPTY_CREATE); setCreateDialogOpen(true); }} disabled={busy} className="gap-2">
                  <Plus className="size-4" />
                  {t('actions.create', {}, 'New Gift Card')}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="search" className="text-sm">{t('filters.searchLabel', {}, 'Search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('filters.searchPlaceholder', {}, 'KM-XXXX-XXXX or email...')}
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    disabled={busy} className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusFilter" className="text-sm">{t('filters.statusLabel', {}, 'Status')}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={busy}>
                  <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filters.all', {}, 'All')}</SelectItem>
                    {(['pending','active','redeemed','expired','cancelled'] as const).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={() => refetch()} disabled={busy} className="w-full gap-2">
                  <RefreshCcw className={cn('size-4', isFetching && 'animate-spin')} />
                  {t('actions.refresh', {}, 'Refresh')}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{t('labels.total', { total }, `Total: ${total}`)}</span>
              {isFetching && <Loader2 className="size-4 animate-spin" />}
            </div>
          </CardContent>
        </Card>

        {/* Desktop table */}
        <Card className="hidden xl:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.code', {}, 'Code')}</TableHead>
                  <TableHead>{t('table.value', {}, 'Value')}</TableHead>
                  <TableHead>{t('table.status', {}, 'Status')}</TableHead>
                  <TableHead>{t('table.payment', {}, 'Payment')}</TableHead>
                  <TableHead>{t('table.purchaser', {}, 'Purchaser')}</TableHead>
                  <TableHead>{t('table.recipient', {}, 'Recipient')}</TableHead>
                  <TableHead>{t('table.expires', {}, 'Expires')}</TableHead>
                  <TableHead className="w-36 text-right">{t('table.actions', {}, 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="size-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {t('table.empty', {}, 'No gift cards found.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{item.code}</span>
                        {item.is_admin_created && <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{item.value} {item.currency}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.payment_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.purchaser_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{item.purchaser_email || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.recipient_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{item.recipient_email || ''}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateShort(item.expires_at, adminUiLocale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" title="Details" onClick={() => openDetail(item)} disabled={busy}>
                            <Eye className="size-4" />
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="ghost" size="icon-sm" title="Activate" onClick={() => handleActivate(item)} disabled={busy}>
                              <CheckCircle2 className="size-4 text-green-600" />
                            </Button>
                          )}
                          {(item.status === 'pending' || item.status === 'active') && (
                            <Button variant="ghost" size="icon-sm" title="Cancel" onClick={() => handleCancelClick(item)} disabled={busy}>
                              <Ban className="size-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile cards */}
        <div className="space-y-4 xl:hidden">
          {isLoading ? (
            <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="size-5 animate-spin" /></CardContent></Card>
          ) : items.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{t('table.empty', {}, 'No gift cards found.')}</CardContent></Card>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-semibold">{item.code}</div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        {item.is_admin_created && <Badge variant="outline" className="text-xs">Admin</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.value} {item.currency}</div>
                      <Badge variant="outline" className="text-xs">{item.payment_status}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('table.purchaser', {}, 'Purchaser')}</p>
                      <p>{item.purchaser_name || '-'}</p>
                      {item.purchaser_email && <p className="text-xs text-muted-foreground">{item.purchaser_email}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('table.recipient', {}, 'Recipient')}</p>
                      <p>{item.recipient_name || '-'}</p>
                      {item.recipient_email && <p className="text-xs text-muted-foreground">{item.recipient_email}</p>}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t('labels.expires', {}, 'Expires')}: {fmtDateShort(item.expires_at, adminUiLocale)}
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => openDetail(item)} disabled={busy} className="gap-1.5">
                      <Eye className="size-3.5" />{t('actions.edit', {}, 'Details')}
                    </Button>
                    {item.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => handleActivate(item)} disabled={busy} className="gap-1.5">
                        <CheckCircle2 className="size-3.5 text-green-600" />{t('actions.activate', {}, 'Activate')}
                      </Button>
                    )}
                    {(item.status === 'pending' || item.status === 'active') && (
                      <Button variant="outline" size="sm" onClick={() => handleCancelClick(item)} disabled={busy} className="gap-1.5">
                        <Ban className="size-3.5 text-destructive" />{t('actions.cancel', {}, 'Cancel')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelDialog.title', {}, 'Cancel Gift Card')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cancelDialog.description', { code: itemToCancel?.code ?? '' }, `Cancel ${itemToCancel?.code}?`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancelDialog.keep', {}, 'Keep')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-destructive text-destructive-foreground">
              {t('cancelDialog.confirm', {}, 'Cancel Card')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('create.title', {}, 'Create Gift Card')}</DialogTitle>
            <DialogDescription>{t('create.description', {}, 'Admin-created gift cards are immediately marked as paid.')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('create.template', {}, 'Template (optional)')}</Label>
              <Select value={createForm.product_id} onValueChange={(v) => setCreateForm((prev) => ({ ...prev, product_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Custom —</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.value} {p.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('create.value', {}, 'Value')} *</Label>
                <Input type="number" min={0.01} step={0.01} placeholder="50.00" value={createForm.value}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, value: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('create.currency', {}, 'Currency')}</Label>
                <Select value={createForm.currency} onValueChange={(v) => setCreateForm((prev) => ({ ...prev, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="TRY">TRY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('create.validityDays', {}, 'Validity (days)')}</Label>
              <Input type="number" min={1} value={createForm.validity_days}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, validity_days: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('create.purchaserName', {}, 'Purchaser Name')}</Label>
                <Input placeholder="John Doe" value={createForm.purchaser_name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, purchaser_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('create.purchaserEmail', {}, 'Purchaser Email')}</Label>
                <Input type="email" placeholder="john@example.com" value={createForm.purchaser_email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, purchaser_email: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('create.recipientName', {}, 'Recipient Name')}</Label>
                <Input placeholder="Jane Doe" value={createForm.recipient_name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, recipient_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('create.recipientEmail', {}, 'Recipient Email')}</Label>
                <Input type="email" placeholder="jane@example.com" value={createForm.recipient_email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, recipient_email: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('create.note', {}, 'Internal Note')}</Label>
              <Textarea rows={2} placeholder="Optional..." value={createForm.note}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, note: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>{t('create.cancel', {}, 'Cancel')}</Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating && <Loader2 className="size-4 animate-spin" />}
              {t('create.submit', {}, 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Edit dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) { setDetailItem(null); setEditForm(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailItem && editForm && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <Gift className="size-4 shrink-0" />
                  <span className="font-mono">{detailItem.code}</span>
                  <StatusBadge status={detailItem.status} />
                </DialogTitle>
                <DialogDescription>
                  {detailItem.value} {detailItem.currency}
                  {detailItem.created_at && ` · ${fmtDate(detailItem.created_at, adminUiLocale)}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Read-only info */}
                <div className="rounded-lg border border-border bg-muted/40 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Purchaser" value={detailItem.purchaser_name} />
                  <InfoRow label="Purchaser Email" value={detailItem.purchaser_email} />
                  <InfoRow label="Payment Status" value={<Badge variant="outline" className="text-xs">{detailItem.payment_status}</Badge>} />
                  <InfoRow label="Order Ref" value={detailItem.order_ref} mono />
                  {detailItem.redeemed_at && <InfoRow label="Redeemed At" value={fmtDate(detailItem.redeemed_at, adminUiLocale)} />}
                  {detailItem.personal_message && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Personal Message</p>
                      <p className="rounded bg-background border border-border p-2 text-sm italic">{detailItem.personal_message}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Editable fields */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Edit</p>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm((prev) => prev && ({ ...prev, status: v as GutscheinStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['pending','active','redeemed','expired','cancelled'] as GutscheinStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Recipient Name</Label>
                      <Input value={editForm.recipient_name}
                        onChange={(e) => setEditForm((prev) => prev && ({ ...prev, recipient_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient Email</Label>
                      <Input type="email" value={editForm.recipient_email}
                        onChange={(e) => setEditForm((prev) => prev && ({ ...prev, recipient_email: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Expires At</Label>
                    <Input type="date" value={editForm.expires_at}
                      onChange={(e) => setEditForm((prev) => prev && ({ ...prev, expires_at: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Note</Label>
                    <Textarea rows={2} value={editForm.note} placeholder="Optional..."
                      onChange={(e) => setEditForm((prev) => prev && ({ ...prev, note: e.target.value }))} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDetailItem(null); setEditForm(null); }} disabled={updating}>Close</Button>
                <Button onClick={handleSaveEdit} disabled={updating} className="gap-2">
                  {updating && <Loader2 className="size-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
