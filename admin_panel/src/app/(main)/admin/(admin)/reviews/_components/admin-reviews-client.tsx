'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/reviews/admin-reviews-client.tsx
// FINAL — Admin Reviews List (App Router + shadcn)
// ✅ FULLY FIXED - Type safety issues resolved
// ✅ FIXED - resolveAdminApiLocale usage corrected
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, RefreshCcw, Search, Trash2, Pencil, Loader2, Star, CheckCircle2, XCircle } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { resolveAdminApiLocale } from '../../../../../../i18n/adminLocale';
import { localeShortClientOr } from '../../../../../../i18n/localeShortClient';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AdminLocaleSelect, type AdminLocaleOption } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { AdminReviewDto, AdminReviewListQueryParams } from '@/integrations/shared';
import {
  useListReviewsAdminQuery,
  useUpdateReviewAdminMutation,
  useDeleteReviewAdminMutation,
} from '@/integrations/hooks';

type ApprovedFilter = 'all' | 'approved' | 'unapproved';
type ActiveFilter = 'all' | 'active' | 'inactive';

type Filters = {
  search: string;
  approvedFilter: ApprovedFilter;
  activeFilter: ActiveFilter;
  minRating: string;
  maxRating: string;
  locale: string;
};

function fmtDate(val: string | null | undefined) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function truncate(text: string | null | undefined, max = 60) {
  const t = text || '';
  if (t.length <= max) return t || '-';
  return t.slice(0, max - 1) + '…';
}

function getErrMsg(e: unknown): string {
  const anyErr = e as any;
  return (
    anyErr?.data?.error?.message ||
    anyErr?.data?.message ||
    anyErr?.message ||
    'İşlem başarısız'
  );
}

function RatingStars({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Locale management
  const { localeOptions, defaultLocaleFromDb, coerceLocale, loading: localesLoading } = useAdminLocales();

  // ✅ FIX: Ensure localeOptions has correct type
  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const urlLocale = searchParams.get('locale') || '';
  const initialLocale = urlLocale || defaultLocaleFromDb || localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de') || '';

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    approvedFilter: 'all',
    activeFilter: 'all',
    minRating: '',
    maxRating: '',
    locale: initialLocale,
  });

  // Update URL when locale changes
  React.useEffect(() => {
    if (!filters.locale) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', filters.locale);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters.locale, router, searchParams]);

  // Build query params
  const queryParams = React.useMemo((): AdminReviewListQueryParams => {
    // ✅ FIXED: Correct usage of resolveAdminApiLocale with all parameters
    const apiLocale = filters.locale || resolveAdminApiLocale(localeOptions, defaultLocaleFromDb, 'de');

    return {
      search: filters.search || undefined,
      approved:
        filters.approvedFilter === 'approved'
          ? true
          : filters.approvedFilter === 'unapproved'
            ? false
            : undefined,
      active:
        filters.activeFilter === 'active'
          ? true
          : filters.activeFilter === 'inactive'
            ? false
            : undefined,
      minRating: filters.minRating ? Number(filters.minRating) : undefined,
      maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
      locale: apiLocale,
      orderBy: 'created_at',
      order: 'desc',
    };
  }, [filters, localeOptions, defaultLocaleFromDb]);

  // RTK Query
  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
  } = useListReviewsAdminQuery(queryParams);

  const [updateReview] = useUpdateReviewAdminMutation();
  const [deleteReview] = useDeleteReviewAdminMutation();

  const items = result?.items || [];
  const total = result?.total || 0;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<AdminReviewDto | null>(null);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleApprovedFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, approvedFilter: value as ApprovedFilter }));
  };

  const handleActiveFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, activeFilter: value as ActiveFilter }));
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFilters((prev) => ({ ...prev, locale: coerced }));
  };

  const handleToggleActive = async (item: AdminReviewDto) => {
    try {
      await updateReview({
        id: item.id,
        patch: { is_active: !item.is_active },
      }).unwrap();
      toast.success(item.is_active ? 'Pasif yapıldı' : 'Aktif yapıldı');
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleToggleApproved = async (item: AdminReviewDto) => {
    try {
      await updateReview({
        id: item.id,
        patch: { is_approved: !item.is_approved },
      }).unwrap();
      toast.success(item.is_approved ? 'Onay kaldırıldı' : 'Onaylandı');
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleEdit = (item: AdminReviewDto) => {
    router.push(`/admin/reviews/${item.id}`);
  };

  const handleDeleteClick = (item: AdminReviewDto) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteReview({ id: itemToDelete.id }).unwrap();
      toast.success('Kayıt silindi');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const busy = isLoading;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>Reviews & Testimonials</CardTitle>
                <CardDescription>
                  Müşteri yorumlarını ve değerlendirmelerini yönetin.
                </CardDescription>
              </div>
              <Button
                onClick={() => router.push('/admin/reviews/new')}
                disabled={busy}
                className="gap-2"
              >
                <Plus className="size-4" />
                Yeni Ekle
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="search" className="text-sm">
                  Ara
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="İsim, email, yorum..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={busy}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Approved Filter */}
              <div className="space-y-2">
                <Label htmlFor="approvedFilter" className="text-sm">
                  Onay Durumu
                </Label>
                <Select
                  value={filters.approvedFilter}
                  onValueChange={handleApprovedFilterChange}
                  disabled={busy}
                >
                  <SelectTrigger id="approvedFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="approved">Onaylı</SelectItem>
                    <SelectItem value="unapproved">Onaysız</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filter */}
              <div className="space-y-2">
                <Label htmlFor="activeFilter" className="text-sm">
                  Durum
                </Label>
                <Select
                  value={filters.activeFilter}
                  onValueChange={handleActiveFilterChange}
                  disabled={busy}
                >
                  <SelectTrigger id="activeFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rating & Locale Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Min Rating */}
              <div className="space-y-2">
                <Label htmlFor="minRating" className="text-sm">
                  Min. Rating
                </Label>
                <Input
                  id="minRating"
                  type="number"
                  min={0}
                  max={5}
                  value={filters.minRating}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minRating: e.target.value }))}
                  placeholder="0"
                  disabled={busy}
                />
              </div>

              {/* Max Rating */}
              <div className="space-y-2">
                <Label htmlFor="maxRating" className="text-sm">
                  Max. Rating
                </Label>
                <Input
                  id="maxRating"
                  type="number"
                  min={0}
                  max={5}
                  value={filters.maxRating}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxRating: e.target.value }))}
                  placeholder="5"
                  disabled={busy}
                />
              </div>

              {/* Locale - ✅ FIXED: Using safeLocaleOptions */}
              <div>
                <AdminLocaleSelect
                  value={filters.locale}
                  onChange={handleLocaleChange}
                  options={safeLocaleOptions}
                  loading={localesLoading}
                  disabled={busy}
                />
              </div>

              {/* Refresh */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={busy}
                  className="w-full gap-2"
                >
                  <RefreshCcw
                    className={cn('size-4', isFetching && 'animate-spin')}
                  />
                  Yenile
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                Toplam <strong>{total}</strong> kayıt
              </span>
              {isFetching && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Yükleniyor...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table (Desktop) - Same as before */}
        <Card className="hidden xl:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim & Email</TableHead>
                  <TableHead className="w-32">Rating</TableHead>
                  <TableHead>Yorum</TableHead>
                  <TableHead className="w-24 text-center">Onaylı</TableHead>
                  <TableHead className="w-24 text-center">Aktif</TableHead>
                  <TableHead className="w-32">Locale</TableHead>
                  <TableHead className="w-44">Tarih</TableHead>
                  <TableHead className="w-44 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" />
                        <span>Yükleniyor...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{item.email || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RatingStars rating={item.rating} />
                          <span className="text-xs text-muted-foreground">({item.rating})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{truncate(item.comment, 50)}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleApproved(item)}
                          disabled={busy}
                        >
                          {item.is_approved ? (
                            <CheckCircle2 className="size-4 text-green-600" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                        />
                      </TableCell>
                      <TableCell>
                        {item.locale_resolved || item.submitted_locale ? (
                          <Badge variant="outline">
                            {item.locale_resolved || item.submitted_locale}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{fmtDate(item.created_at)}</div>
                        <div className="text-[10px]">
                          Güncelleme: {fmtDate(item.updated_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Pencil className="size-3.5" />
                            Düzenle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Trash2 className="size-3.5" />
                            Sil
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

        {/* Cards (Mobile) - Same as before */}
        <div className="space-y-4 xl:hidden">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>Yükleniyor...</span>
                </div>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Kayıt bulunamadı.
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{item.name || '-'}</h3>
                      <p className="text-xs text-muted-foreground">{item.email || '-'}</p>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={item.rating} />
                        <span className="text-xs text-muted-foreground">({item.rating})</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.locale_resolved || item.submitted_locale ? (
                        <Badge variant="outline">
                          {item.locale_resolved || item.submitted_locale}
                        </Badge>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleApproved(item)}
                          disabled={busy}
                          title={item.is_approved ? 'Onaylı' : 'Onaysız'}
                        >
                          {item.is_approved ? (
                            <CheckCircle2 className="size-4 text-green-600" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Yorum</Label>
                    <p className="text-sm">{truncate(item.comment, 120)}</p>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Oluşturma: {fmtDate(item.created_at)}</div>
                    <div>Güncelleme: {fmtDate(item.updated_at)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Pencil className="size-3.5" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Trash2 className="size-3.5" />
                      Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{itemToDelete?.name || 'Bu kayıt'}</strong> tarafından yapılan yorum silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}