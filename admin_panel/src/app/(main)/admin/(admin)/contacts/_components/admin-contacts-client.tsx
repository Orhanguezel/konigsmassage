'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/contacts/admin-contacts-client.tsx
// FINAL — Admin Contacts (App Router + shadcn)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Search, Trash2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

import type { ContactView, ContactStatus } from '@/integrations/shared';
import {
  useListContactsAdminQuery,
  useUpdateContactAdminMutation,
  useDeleteContactAdminMutation,
} from '@/integrations/hooks';

type Filters = {
  search: string;
  status: '' | ContactStatus;
  onlyUnresolved: boolean;
  orderBy: 'created_at' | 'updated_at' | 'status' | 'name';
  order: 'asc' | 'desc';
};

type EditState = {
  id: string;
  status: ContactStatus;
  is_resolved: boolean;
  admin_note: string;
};

export default function AdminContactsClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.contacts ?? {};
  const common = copy.common;

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    status: '',
    onlyUnresolved: false,
    orderBy: 'created_at',
    order: 'desc',
  });

  const listParams = React.useMemo(
    () => ({
      search: filters.search.trim() || undefined,
      status: filters.status || undefined,
      resolved: filters.onlyUnresolved ? false : undefined,
      orderBy: filters.orderBy,
      order: filters.order,
      limit: 200,
      offset: 0,
    }),
    [filters],
  );

  const listQ = useListContactsAdminQuery(listParams, { refetchOnMountOrArgChange: true });

  const [rows, setRows] = React.useState<ContactView[]>([]);
  React.useEffect(() => {
    setRows((listQ.data as ContactView[]) ?? []);
  }, [listQ.data]);

  const [updateContact, updateState] = useUpdateContactAdminMutation();
  const [removeContact, removeState] = useDeleteContactAdminMutation();

  const busy = listQ.isLoading || listQ.isFetching || updateState.isLoading || removeState.isLoading;

  const [editOpen, setEditOpen] = React.useState(false);
  const [editState, setEditState] = React.useState<EditState | null>(null);

  function openEdit(item: ContactView) {
    setEditState({
      id: item.id,
      status: item.status,
      is_resolved: !!item.is_resolved,
      admin_note: item.admin_note ?? '',
    });
    setEditOpen(true);
  }

  function closeEdit() {
    if (busy) return;
    setEditOpen(false);
    setEditState(null);
  }

  async function onSaveEdit() {
    if (!editState) return;
    try {
      await updateContact({
        id: editState.id,
        patch: {
          status: editState.status,
          is_resolved: editState.is_resolved,
          admin_note: editState.admin_note.trim() || null,
        },
      }).unwrap();
      toast.success(common?.actions?.save || '');
      closeEdit();
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || common?.states?.error || '');
    }
  }

  async function onDelete(item: ContactView) {
    if (!window.confirm(page?.delete_confirm || '')) return;

    try {
      await removeContact(item.id).unwrap();
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => listQ.refetch()}
          disabled={busy}
        >
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
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder={page?.search_ph}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{page?.status_label}</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, status: v === 'all' ? '' : (v as ContactStatus) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={page?.status_all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{page?.status_all}</SelectItem>
                <SelectItem value="new">{page?.status_new}</SelectItem>
                <SelectItem value="in_progress">{page?.status_in_progress}</SelectItem>
                <SelectItem value="closed">{page?.status_closed}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{page?.order_by_label}</Label>
            <Select
              value={filters.orderBy}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, orderBy: v as Filters['orderBy'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">{page?.order_by_created}</SelectItem>
                <SelectItem value="updated_at">{page?.order_by_updated}</SelectItem>
                <SelectItem value="status">{page?.order_by_status}</SelectItem>
                <SelectItem value="name">{page?.order_by_name}</SelectItem>
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

          <div className="flex items-center gap-2">
            <Switch
              checked={filters.onlyUnresolved}
              onCheckedChange={(v) => setFilters((p) => ({ ...p, onlyUnresolved: v }))}
            />
            <Label>{page?.only_unresolved}</Label>
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
                <TableHead>{page?.col_name}</TableHead>
                <TableHead>{page?.col_email}</TableHead>
                <TableHead>{page?.col_subject}</TableHead>
                <TableHead>{page?.col_status}</TableHead>
                <TableHead>{page?.col_created}</TableHead>
                <TableHead className="text-right">{page?.col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !busy && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    {common?.states?.empty}
                  </TableCell>
                </TableRow>
              )}

              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>
                    {item.status === 'new' ? (
                      <Badge variant="secondary">new</Badge>
                    ) : item.status === 'in_progress' ? (
                      <Badge>in_progress</Badge>
                    ) : (
                      <Badge variant="outline">closed</Badge>
                    )}
                  </TableCell>
                  <TableCell>{typeof item.created_at === 'string' ? item.created_at.slice(0, 10) : ''}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                        disabled={busy}
                      >
                        <Pencil className="mr-2 size-4" />
                        {common?.actions?.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(item)}
                        disabled={busy}
                      >
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

      <Dialog open={editOpen} onOpenChange={(v) => (v ? null : closeEdit())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{page?.edit_title}</DialogTitle>
            <DialogDescription>{page?.edit_desc}</DialogDescription>
          </DialogHeader>

          {editState && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{page?.status_label}</Label>
                <Select
                  value={editState.status}
                  onValueChange={(v) =>
                    setEditState((p) => (p ? { ...p, status: v as ContactStatus } : p))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{page?.status_new}</SelectItem>
                    <SelectItem value="in_progress">{page?.status_in_progress}</SelectItem>
                    <SelectItem value="closed">{page?.status_closed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editState.is_resolved}
                  onCheckedChange={(v) =>
                    setEditState((p) => (p ? { ...p, is_resolved: v } : p))
                  }
                />
                <Label>{page?.resolved_label}</Label>
              </div>

              <div className="space-y-2">
                <Label>{page?.admin_note_label}</Label>
                <Textarea
                  value={editState.admin_note}
                  onChange={(e) =>
                    setEditState((p) => (p ? { ...p, admin_note: e.target.value } : p))
                  }
                  placeholder={page?.admin_note_ph}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={busy}>
              {common?.actions?.cancel}
            </Button>
            <Button onClick={onSaveEdit} disabled={busy || !editState}>
              {common?.actions?.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
