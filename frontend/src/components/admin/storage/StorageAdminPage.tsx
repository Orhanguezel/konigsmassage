// =============================================================
// FILE: src/components/admin/storage/StorageAdminPage.tsx
// konigsmassage – Storage Admin Sayfası (Header + Liste + Upload)
// =============================================================

'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { StorageHeader } from './StorageHeader';
import { StorageList } from './StorageList';

import type { StorageAsset, StorageListQuery } from '@/integrations/types';
import {
  useListAssetsAdminQuery,
  useCreateAssetAdminMutation,
  useBulkCreateAssetsAdminMutation,
  useDeleteAssetAdminMutation,
} from '@/integrations/rtk/hooks';

const PAGE_SIZE = 24;

type SortValue = NonNullable<StorageListQuery['sort']>;
type OrderValue = NonNullable<StorageListQuery['order']>;

const DEFAULT_SORT: SortValue = 'created_at';
const DEFAULT_ORDER: OrderValue = 'desc';

export type StorageAdminPageProps = {
  /** İsteğe bağlı: başlangıç bucket (slug sayfasından gelebilir) */
  initialBucket?: string;
  /** İsteğe bağlı: başlangıç klasör / folder (slug sayfasından gelebilir) */
  initialFolder?: string;
};

export default function StorageAdminPage({
  initialBucket = 'public',
  initialFolder = '',
}: StorageAdminPageProps) {
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState<string>(initialBucket);
  const [folder, setFolder] = useState<string>(initialFolder);
  const [mime, setMime] = useState('');
  const [sort, setSort] = useState<SortValue>(DEFAULT_SORT);
  const [order, setOrder] = useState<OrderValue>(DEFAULT_ORDER);
  const [page, setPage] = useState(1);

  // File input ref'leri
  const singleInputRef = useRef<HTMLInputElement | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  // Query params
  const queryParams: Partial<StorageListQuery> = useMemo(
    () => ({
      q: search || undefined,
      bucket: bucket || undefined,
      folder: folder || undefined,
      mime: mime || undefined,
      sort,
      order,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [search, bucket, folder, mime, sort, order, page],
  );

  const { data, isLoading, refetch } = useListAssetsAdminQuery(queryParams);

  const total = data?.total ?? data?.items?.length ?? 0;
  const items: StorageAsset[] = data?.items ?? [];

  const [createAsset, { isLoading: creating }] = useCreateAssetAdminMutation();
  const [bulkCreateAssets, { isLoading: bulkCreating }] = useBulkCreateAssetsAdminMutation();
  const [deleteAsset, { isLoading: deleting }] = useDeleteAssetAdminMutation();

  const loading = isLoading || creating || bulkCreating || deleting;

  /* ---------- Filtre değiştiğinde sayfayı resetle ---------- */

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleBucketChange = (v: string) => {
    setBucket(v);
    setPage(1);
  };

  const handleFolderChange = (v: string) => {
    setFolder(v);
    setPage(1);
  };

  const handleMimeChange = (v: string) => {
    setMime(v);
    setPage(1);
  };

  const handleSortChange = (v: SortValue) => {
    setSort(v);
    setPage(1);
  };

  const handleOrderChange = (v: OrderValue) => {
    setOrder(v);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handleRefresh = () => {
    refetch();
  };

  /* ---------- Upload butonları ---------- */

  const handleSingleUploadClick = () => {
    singleInputRef.current?.click();
  };

  const handleBulkUploadClick = () => {
    bulkInputRef.current?.click();
  };

  const currentBucket = bucket || 'public';

  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const res = await createAsset({
        file,
        bucket: currentBucket,
        folder: folder || undefined,
        metadata: null,
      }).unwrap();

      toast.success(`Dosya yüklendi: ${res.name}`);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Dosya yüklenirken hata oluştu.');
    }
  };

  const handleBulkFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!files.length) return;

    try {
      const res = await bulkCreateAssets({
        files,
        bucket: currentBucket,
        folder: folder || undefined,
        metadata: null,
      }).unwrap();

      const successCount = res.items.filter((it) => (it as any).id && !(it as any).error).length;

      if (successCount > 0) {
        toast.success(`Toplam ${successCount} dosya yüklendi.`);
      }

      const errorItems = res.items.filter((it) => (it as any).error) as any[];

      if (errorItems.length > 0) {
        toast.error(`${errorItems.length} dosya yüklenemedi. Detay için console'a bak.`);
        console.error('Bulk upload errors:', errorItems);
      }

      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Toplu yükleme sırasında hata oluştu.');
    }
  };

  /* ---------- Önizleme / Silme ---------- */

  const handlePreview = useCallback((item: StorageAsset) => {
    if (!item.url) return;
    try {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  }, []);

  const handleDelete = useCallback(
    async (item: StorageAsset) => {
      const ok = window.confirm(
        `Bu dosyayı silmek istediğine emin misin?\n\n${item.name} (${item.bucket}/${item.path})`,
      );
      if (!ok) return;

      try {
        await deleteAsset({ id: item.id }).unwrap();
        toast.success('Dosya silindi.');
        refetch();
      } catch (err: any) {
        console.error(err);
        toast.error('Dosya silinirken hata oluştu.');
      }
    },
    [deleteAsset, refetch],
  );

  return (
    <div className="container-fluid p-0">
      {/* Gizli file input'lar */}
      <input
        ref={singleInputRef}
        type="file"
        className="d-none"
        onChange={handleSingleFileChange}
      />
      <input
        ref={bulkInputRef}
        type="file"
        className="d-none"
        multiple
        onChange={handleBulkFilesChange}
      />

      {/* Header */}
      <StorageHeader
        search={search}
        onSearchChange={handleSearchChange}
        bucket={bucket}
        onBucketChange={handleBucketChange}
        folder={folder}
        onFolderChange={handleFolderChange}
        mime={mime}
        onMimeChange={handleMimeChange}
        sort={sort}
        order={order}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
        total={total}
        loading={loading}
        onRefresh={handleRefresh}
        onSingleUploadClick={handleSingleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
      />

      {/* Liste */}
      <StorageList
        items={items}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={handlePageChange}
        onPreview={handlePreview}
        onDelete={handleDelete}
      />
    </div>
  );
}
