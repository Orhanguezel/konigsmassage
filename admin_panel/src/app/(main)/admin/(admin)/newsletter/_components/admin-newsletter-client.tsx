'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/newsletter/admin-newsletter-client.tsx
// FINAL — Admin Newsletter Subscribers
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Search, Trash2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Switch } from '@/components/ui/switch';
import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type {
  NewsletterAdminSubscriber,
  NewsletterAdminListParams,
  NewsletterAdminUpdateBody,
} from '@/integrations/shared';
import {
  useListNewsletterAdminQuery,
  useUpdateNewsletterAdminMutation,
  useRemoveNewsletterAdminMutation,
} from '@/integrations/hooks';

type Filters = {
  q: string;
  verified: 'all' | 'yes' | 'no';
  subscribed: 'all' | 'yes' | 'no';
  orderBy: 'created_at' | 'updated_at' | 'email' | 'verified';
  order: 'asc' | 'desc';
};

type EditState = {
  id: string;
  verified: boolean;
  subscribed: boolean;
  meta: Record<string, any> | null;
};

export default function AdminNewsletterClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.newsletter ?? {};
  const common = copy.common;

  const [filters, setFilters] = React.useState<Filters>({
    q: '',
    verified: 'all',
    subscribed: 'all',
    orderBy: 'created_at',
    order: 'desc',
  });

  const listParams = React.useMemo(() => {
    const p: NewsletterAdminListParams = {
      q: filters.q.trim() || undefined,
      orderBy: filters.orderBy,
      order: filters.order,
      limit: 200,
      offset: 0,
    };
    if (filters.verified !== 'all') p.verified = filters.verified === 'yes';
    if (filters.subscribed !== 'all') p.subscribed = filters.subscribed === 'yes';
    return p;
  }, [filters]);

  const listQ = useListNewsletterAdminQuery(listParams, { refetchOnMountOrArgChange: true });
  const rows = (listQ.data?.data ?? []) as NewsletterAdminSubscriber[];

  const [updateSub, updateState] = useUpdateNewsletterAdminMutation();
  const [removeSub, removeState] = useRemoveNewsletterAdminMutation();

  const busy = listQ.isFetching || updateState.isLoading || removeState.isLoading;

  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState<EditState | null>(null);

  function openEdit(item: NewsletterAdminSubscriber) {
    setEdit({
      id: item.id,
      verified: item.is_verified,
      subscribed: item.is_subscribed,
      meta: item.meta ?? null,
    });
    setOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setOpen(false);
    setEdit(null);
  }

  async function onSave() {
    if (!edit) return;

    const body: NewsletterAdminUpdateBody = {
      verified: edit.verified,
      subscribed: edit.subscribed,
      meta: edit.meta ?? null,
    };

    try {
      await updateSub({ id: edit.id, body }).unwrap();
      toast.success(common?.actions?.save || '');
      closeModal();
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  async function onDelete(item: NewsletterAdminSubscriber) {
    if (!window.confirm(page?.delete_confirm || '')) return;
    try {
      await removeSub({ id: item.id }).unwrap();
      toast.success(common?.actions?.delete || '');
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{page?.title}</h1>
          <p className="text-sm text-muted-foreground">{page?.subtitle}</p>
        </div>

        <Button variant="outline" size="sm" onClick={() => listQ.refetch()} disabled={busy}>
          <RefreshCcw className="mr-2 size-4" />
          {common?.actions?.refresh}
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{page?.filters_title}</CardTitle>
          <CardDescription>{page?.filters_desc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>{common?.actions?.search}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder={page?.search_ph}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{page?.verified_label}</Label>
            <Select
              value={filters.verified}
              onValueChange={(v) => setFilters((p) => ({ ...p, verified: v as Filters['verified'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{page?.filter_all}</SelectItem>
                <SelectItem value="yes">{page?.filter_yes}</SelectItem>
                <SelectItem value="no">{page?.filter_no}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{page?.subscribed_label}</Label>
            <Select
              value={filters.subscribed}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, subscribed: v as Filters['subscribed'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{page?.filter_all}</SelectItem>
                <SelectItem value="yes">{page?.filter_yes}</SelectItem>
                <SelectItem value="no">{page?.filter_no}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{page?.order_label}</Label>
            <Select
              value={filters.order}
              onValueChange={(v) => setFilters((p) => ({ ...p, order: v as Filters['order'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{page?.order_desc}</SelectItem>
                <SelectItem value="asc">{page?.order_asc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{page?.list_title}</CardTitle>
          <CardDescription>{page?.list_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{page?.col_email}</TableHead>
                <TableHead>{page?.col_verified}</TableHead>
                <TableHead>{page?.col_subscribed}</TableHead>
                <TableHead>{page?.col_created}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !busy && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_verified ? 'secondary' : 'outline'}>
                      {item.is_verified ? page?.filter_yes : page?.filter_no}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_subscribed ? 'secondary' : 'outline'}>
                      {item.is_subscribed ? page?.filter_yes : page?.filter_no}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.created_at?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} disabled={busy}>
                        <Pencil className="mr-2 size-4" />
                        {common?.actions?.edit}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(item)} disabled={busy}>
                        <Trash2 className="mr-2 size-4" />
                        {common?.actions?.delete}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => (v ? null : closeModal())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{page?.edit_title}</DialogTitle>
          </DialogHeader>

          {edit && (
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={edit.verified}
                  onCheckedChange={(v) => setEdit((p) => (p ? { ...p, verified: v } : p))}
                />
                <Label>{page?.verified_label}</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={edit.subscribed}
                  onCheckedChange={(v) => setEdit((p) => (p ? { ...p, subscribed: v } : p))}
                />
                <Label>{page?.subscribed_label}</Label>
              </div>

              <AdminJsonEditor
                label={page?.meta_label}
                value={edit.meta ?? {}}
                onChange={(next) => setEdit((p) => (p ? { ...p, meta: next } : p))}
                helperText={page?.meta_help}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={busy}>
              {common?.actions?.cancel}
            </Button>
            <Button onClick={onSave} disabled={busy}>
              {common?.actions?.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
