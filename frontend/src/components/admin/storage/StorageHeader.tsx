// =============================================================
// FILE: src/components/admin/storage/StorageHeader.tsx
// konigsmassage – Storage Header + Filtreler
// =============================================================

import React from 'react';

export type StorageHeaderProps = {
  search: string;
  onSearchChange: (v: string) => void;

  bucket: string;
  onBucketChange: (v: string) => void;

  folder: string;
  onFolderChange: (v: string) => void;

  mime: string;
  onMimeChange: (v: string) => void;

  sort: 'created_at' | 'name' | 'size';
  order: 'asc' | 'desc';
  onSortChange: (v: 'created_at' | 'name' | 'size') => void;
  onOrderChange: (v: 'asc' | 'desc') => void;

  total: number;
  loading: boolean;

  onRefresh: () => void;
  onSingleUploadClick: () => void;
  onBulkUploadClick: () => void;
};

// Mevcut modül klasörleri – selector
const MODULE_FOLDERS: { value: string; label: string }[] = [
  { value: 'about', label: 'About' },
  { value: 'news', label: 'News' },
  { value: 'product', label: 'Product' },
  { value: 'sparepart', label: 'Spare Part' },
  { value: 'library', label: 'Library' },
  { value: 'servicesreferences', label: 'Services / References' },
];

export const StorageHeader: React.FC<StorageHeaderProps> = ({
  search,
  onSearchChange,
  bucket,
  onBucketChange,
  folder,
  onFolderChange,
  mime,
  onMimeChange,
  sort,
  order,
  onSortChange,
  onOrderChange,
  total,
  loading,
  onRefresh,
  onSingleUploadClick,
  onBulkUploadClick,
}) => {
  return (
    <div className="row mb-3">
      {/* Sol: başlık */}
      <div className="col-12 col-lg-6 mb-2 mb-lg-0">
        <h1 className="h4 mb-1">Dosya Kütüphanesi</h1>
        <p className="text-muted small mb-0">
          Storage modülündeki dosyaları listeleyip; bucket, modül klasörü ve MIME türüne göre
          filtreleyebilir, tekli veya çoklu yükleme yapabilirsin.
        </p>
        <div className="text-muted small mt-1">
          Toplam kayıt: <strong>{total}</strong>
          {loading && <span className="ms-2 spinner-border spinner-border-sm" />}
        </div>
      </div>

      {/* Sağ: filtreler */}
      <div className="col-12 col-lg-6 d-flex align-items-end justify-content-lg-end">
        <div className="d-flex flex-column flex-sm-row flex-wrap gap-2 w-100 w-sm-auto">
          {/* Arama */}
          <div className="input-group input-group-sm">
            <span className="input-group-text">Ara</span>
            <input
              type="text"
              className="form-control"
              placeholder="İsim veya path içinde ara"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Bucket */}
          <div className="input-group input-group-sm">
            <span className="input-group-text">Bucket</span>
            <input
              type="text"
              className="form-control"
              placeholder="Örn: public"
              value={bucket}
              onChange={(e) => onBucketChange(e.target.value)}
            />
          </div>

          {/* Folder – modül selectörü */}
          <div className="input-group input-group-sm">
            <span className="input-group-text">Klasör</span>
            <select
              className="form-select"
              value={folder}
              onChange={(e) => onFolderChange(e.target.value)}
            >
              <option value="">Tüm klasörler</option>
              {MODULE_FOLDERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* MIME */}
          <div className="input-group input-group-sm">
            <span className="input-group-text">MIME</span>
            <input
              type="text"
              className="form-control"
              placeholder="Örn: image/"
              value={mime}
              onChange={(e) => onMimeChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Alt satır: sıralama + aksiyonlar */}
      <div className="col-12 mt-2 d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-md-between">
        <div className="d-flex flex-wrap gap-2 small">
          {/* Sıralama alanı */}
          <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
            <span className="input-group-text">Sırala</span>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as 'created_at' | 'name' | 'size')}
            >
              <option value="created_at">Oluşturma tarihi</option>
              <option value="name">İsim</option>
              <option value="size">Boyut</option>
            </select>
            <select
              className="form-select"
              style={{ maxWidth: 110 }}
              value={order}
              onChange={(e) => onOrderChange(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-end mt-2 mt-md-0">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            Yenile
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={onSingleUploadClick}
          >
            + Tekli Yükle
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onBulkUploadClick}>
            + Toplu Yükle
          </button>
        </div>
      </div>
    </div>
  );
};
