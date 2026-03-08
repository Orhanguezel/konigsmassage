'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/gutschein/products/_components/admin-gutschein-products-client.tsx
// Admin Gift Card Products (templates) — RTK Query + shadcn/ui + i18n
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { Textarea } from '@/components/ui/textarea';

import type {
  GutscheinProductDto,
  GutscheinProductCreateBody,
  GutscheinProductUpdateBody,
} from '@/integrations/shared';
import {
  useListGutscheinProductsAdminQuery,
  useCreateGutscheinProductAdminMutation,
  useUpdateGutscheinProductAdminMutation,
  useDeleteGutscheinProductAdminMutation,
} from '@/integrations/hooks';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

function fmtDate(val: string | null | undefined, locale?: string) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString(locale || undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function getErrMsg(e: unknown, fallback: string): string {
  const anyErr = e as any;
  return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || fallback;
}

type ProductForm = {
  name: string;
  value: string;
  currency: string;
  validity_days: string;
  description: string;
  is_active: boolean;
  display_order: string;
};

const EMPTY_FORM: ProductForm = {
  name: '',
  value: '',
  currency: 'EUR',
  validity_days: '365',
  description: '',
  is_active: true,
  display_order: '0',
};

function productToForm(p: GutscheinProductDto): ProductForm {
  return {
    name: p.name,
    value: p.value,
    currency: p.currency,
    validity_days: String(p.validity_days),
    description: p.description ?? '',
    is_active: p.is_active,
    display_order: String(p.display_order),
  };
}

export default function AdminGutscheinProductsClient() {
  const router = useRouter();
  const t = useAdminT('admin.gutschein');
  const adminUiLocale = usePreferencesStore((s) => s.adminLocale);

  const { data: result, isLoading, isFetching, refetch } = useListGutscheinProductsAdminQuery();
  const [createProduct, { isLoading: creating }] = useCreateGutscheinProductAdminMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateGutscheinProductAdminMutation();
  const [deleteProduct, { isLoading: deletingProduct }] = useDeleteGutscheinProductAdminMutation();

  const items = result?.data ?? [];
  const total = result?.total ?? 0;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<GutscheinProductDto | null>(null);
  const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<GutscheinProductDto | null>(null);

  const busy = isLoading || isFetching || creating || updating || deletingProduct;

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: GutscheinProductDto) => {
    setEditItem(item);
    setForm(productToForm(item));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const value = parseFloat(form.value);
    if (!form.name.trim()) {
      toast.error(t('products.messages.nameRequired', {}, 'Name is required.'));
      return;
    }
    if (!value || value <= 0) {
      toast.error(t('products.messages.valueRequired', {}, 'Please enter a valid value.'));
      return;
    }

    const payload = {
      name: form.name.trim(),
      value,
      currency: form.currency || 'EUR',
      validity_days: parseInt(form.validity_days) || 365,
      description: form.description.trim() || undefined,
      is_active: form.is_active,
      display_order: parseInt(form.display_order) || 0,
    };

    try {
      if (editItem) {
        await updateProduct({ id: editItem.id, body: payload as GutscheinProductUpdateBody }).unwrap();
        toast.success(t('products.messages.updated', {}, 'Product updated.'));
      } else {
        await createProduct(payload as GutscheinProductCreateBody).unwrap();
        toast.success(t('products.messages.created', {}, 'Product created.'));
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('products.messages.error', {}, 'Failed to save product.')));
    }
  };

  const handleDeleteClick = (item: GutscheinProductDto) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteProduct({ id: itemToDelete.id }).unwrap();
      toast.success(t('products.messages.deleted', {}, 'Product deleted.'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('products.messages.deleteError', {}, 'Failed to delete.')));
    }
  };

  const handleToggleActive = async (item: GutscheinProductDto) => {
    try {
      await updateProduct({ id: item.id, body: { is_active: !item.is_active } }).unwrap();
      toast.success(t('products.messages.updated', {}, 'Updated.'));
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('products.messages.toggleError', {}, 'Failed to update status.')));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => router.push('/admin/gutschein')}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <CardTitle>{t('products.title', {}, 'Gift Card Products')}</CardTitle>
                </div>
                <CardDescription>
                  {t('products.description', {}, 'Define gift card templates.')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={busy}
                  className="gap-2"
                >
                  <RefreshCcw className={cn('size-4', isFetching && 'animate-spin')} />
                  {t('actions.refresh', {}, 'Refresh')}
                </Button>
                <Button onClick={openCreate} disabled={busy} className="gap-2">
                  <Plus className="size-4" />
                  {t('products.create', {}, 'New Product')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {t('labels.total', { total }, `Total: ${total}`)}
            </div>
          </CardContent>
        </Card>

        {/* Table (desktop) */}
        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products.table.name', {}, 'Name')}</TableHead>
                  <TableHead>{t('products.table.value', {}, 'Value')}</TableHead>
                  <TableHead>{t('products.table.validity', {}, 'Validity')}</TableHead>
                  <TableHead>{t('products.table.order', {}, 'Order')}</TableHead>
                  <TableHead className="w-20 text-center">
                    {t('products.table.active', {}, 'Active')}
                  </TableHead>
                  <TableHead>{t('products.table.created', {}, 'Created')}</TableHead>
                  <TableHead className="w-24 text-right">
                    {t('products.table.actions', {}, 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t('products.empty', {}, 'No products yet.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.value} {item.currency}
                      </TableCell>
                      <TableCell>{item.validity_days}d</TableCell>
                      <TableCell>{item.display_order}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(item.created_at, adminUiLocale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Pencil className="size-3.5" />
                            {t('admin.common.edit', {}, 'Edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={t('actions.delete', {}, 'Delete')}
                            onClick={() => handleDeleteClick(item)}
                            disabled={busy}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cards (mobile) */}
        <div className="space-y-4 lg:hidden">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin" />
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('products.empty', {}, 'No products yet.')}
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className={!item.is_active ? 'opacity-60' : ''}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm font-semibold">
                        {item.value} {item.currency}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.validity_days}d validity
                      </div>
                    </div>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => handleToggleActive(item)}
                      disabled={busy}
                    />
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Pencil className="size-3.5" />
                      {t('admin.common.edit', {}, 'Edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                      disabled={busy}
                      className="gap-1.5"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.deleteDialog.title', {}, 'Delete Product')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.deleteDialog.description', { name: itemToDelete?.name ?? '' }, `Permanently delete "${itemToDelete?.name}"? This cannot be undone.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('products.deleteDialog.keep', {}, 'Keep')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              {t('products.deleteDialog.confirm', {}, 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem
                ? t('products.form.editTitle', {}, 'Edit Product')
                : t('products.form.title', {}, 'New Gift Card Product')}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? t('products.form.editDescription', {}, 'Update the gift card template.')
                : t('products.form.description', {}, 'Create a new gift card template.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('products.form.name', {}, 'Name')} *</Label>
              <Input
                placeholder={t('products.form.namePlaceholder', {}, 'Gift Card 50 €')}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.form.value', {}, 'Value')} *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder={t('products.form.valuePlaceholder', {}, '50.00')}
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('products.form.currency', {}, 'Currency')}</Label>
                <Input
                  placeholder="EUR"
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.form.validityDays', {}, 'Validity (days)')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.validity_days}
                  onChange={(e) => setForm((prev) => ({ ...prev, validity_days: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('products.form.displayOrder', {}, 'Display Order')}</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, display_order: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('products.form.productDescription', {}, 'Description')}</Label>
              <Textarea
                placeholder={t('products.form.descriptionPlaceholder', {}, 'Optional description...')}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, is_active: v }))}
              />
              <Label htmlFor="is_active">
                {t('products.form.isActive', {}, 'Active (visible to customers)')}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={creating || updating}
            >
              <X className="size-4 mr-1" />
              {t('products.form.cancel', {}, 'Cancel')}
            </Button>
            <Button onClick={handleSave} disabled={creating || updating} className="gap-2">
              {(creating || updating) && <Loader2 className="size-4 animate-spin" />}
              <Save className="size-4" />
              {editItem
                ? t('products.form.save', {}, 'Save Changes')
                : t('products.form.create', {}, 'Create Product')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
