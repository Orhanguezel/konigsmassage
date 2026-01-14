// =============================================================
// FILE: src/components/admin/db/fullDb/FullDbImportPanel.tsx
// =============================================================
'use client';

import React, { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { errorText } from '../shared/errorText';
import { askConfirm } from '../shared/confirm';
import { HelpHint } from '../shared/HelpHint';
import { HelpBlock } from '../shared/HelpBlock';

import {
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
} from '@/integrations/rtk/hooks';

type TabKey = 'text' | 'url' | 'file';

export const FullDbImportPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('text');

  const [sqlText, setSqlText] = useState('');
  const [truncateText, setTruncateText] = useState(true);
  const [dryRunText, setDryRunText] = useState(false);

  const [url, setUrl] = useState('');
  const [truncateUrl, setTruncateUrl] = useState(true);
  const [dryRunUrl, setDryRunUrl] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [truncateFile, setTruncateFile] = useState(true);

  const [fileInputKey, setFileInputKey] = useState(0);

  const [importText, { isLoading: isImportingText }] = useImportSqlTextMutation();
  const [importUrl, { isLoading: isImportingUrl }] = useImportSqlUrlMutation();
  const [importFile, { isLoading: isImportingFile }] = useImportSqlFileMutation();

  const busy = isImportingText || isImportingUrl || isImportingFile;

  const activeLabel = useMemo(() => {
    if (activeTab === 'text') return 'SQL Metni';
    if (activeTab === 'url') return "URL'den";
    return 'Dosyadan';
  }, [activeTab]);

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    if (!sqlText.trim()) return toast.error('SQL metni boş olamaz.');

    if (!dryRunText) {
      const ok = askConfirm(
        "Bu SQL script'i doğrudan veritabanına uygulamak üzeresin.\n\n" +
          `Truncate: ${truncateText ? 'EVET (tüm tabloları boşalt)' : 'Hayır'}\n` +
          'Devam etmek istiyor musun?',
      );
      if (!ok) return;
    }

    try {
      const res = await importText({
        sql: sqlText,
        truncateBefore: truncateText,
        dryRun: dryRunText,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, 'SQL import (metin) hatası.'),
        );
      }

      if (res.dryRun) toast.success('Dry run başarılı. Değişiklikler geriye alındı.');
      else {
        toast.success('SQL metni başarıyla içe aktarıldı.');
        setSqlText('');
      }
    } catch (err: any) {
      toast.error(errorText(err, 'SQL import (metin) sırasında hata oluştu.'));
    }
  };

  const handleSubmitUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return toast.error("Önce geçerli bir .sql veya .sql.gz URL'i gir.");

    if (!dryRunUrl) {
      const ok = askConfirm(
        "Bu URL'den indirilen SQL dump veritabanına uygulanacak.\n\n" +
          `URL: ${url}\n` +
          `Truncate: ${truncateUrl ? 'EVET (tüm tabloları boşalt)' : 'Hayır'}\n\n` +
          'Devam etmek istiyor musun?',
      );
      if (!ok) return;
    }

    try {
      const res = await importUrl({
        url: url.trim(),
        truncateBefore: truncateUrl,
        dryRun: dryRunUrl,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, 'SQL import (URL) hatası.'),
        );
      }

      if (res.dryRun) toast.success('Dry run başarılı. Değişiklikler geriye alındı.');
      else {
        toast.success("URL'den SQL dump başarıyla içe aktarıldı.");
        setUrl('');
      }
    } catch (err: any) {
      toast.error(errorText(err, 'SQL import (URL) sırasında hata oluştu.'));
    }
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Önce .sql veya .gz dosyası seç.');

    const ok = askConfirm(
      'Seçtiğin SQL dosyası veritabanına uygulanacak.\n\n' +
        `Dosya: ${file.name}\n` +
        `Truncate: ${truncateFile ? 'EVET (tüm tabloları boşalt)' : 'Hayır'}\n\n` +
        'Bu işlem geri alınamaz. Devam etmek istiyor musun?',
    );
    if (!ok) return;

    try {
      const res = await importFile({ file, truncateBefore: truncateFile }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, 'SQL import (dosya) hatası.'),
        );
      }

      toast.success('Dosyadan SQL dump başarıyla içe aktarıldı.');
      setFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err: any) {
      toast.error(errorText(err, 'SQL import (dosya) sırasında hata oluştu.'));
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header py-2 d-flex justify-content-between align-items-center flex-wrap gap-2 position-relative">
        <span className="small fw-semibold d-inline-flex align-items-center gap-2 flex-wrap">
          SQL İçe Aktar (IMPORT) <span className="text-muted">— {activeLabel}</span>
          <HelpHint icon="question" title="Import açıklaması" align="end">
            <HelpBlock headline="SQL Import (Full DB)">
              <ul className="mb-0 ps-3">
                <li>Bu panel tam veritabanına SQL dump uygular (metin / URL / dosya).</li>
                <li>
                  <strong>Truncate</strong>: import öncesi tabloları boşaltır. Prod ortamında çok
                  risklidir.
                </li>
                <li>
                  <strong>Dry run</strong>: desteklenen akışlarda prova çalıştırmasıdır (rollback).
                </li>
              </ul>
            </HelpBlock>
          </HelpHint>
        </span>

        {busy && <span className="badge bg-secondary small">İşlem devam ediyor...</span>}
      </div>

      <div className="card-body position-relative">
        <p className="text-muted small mb-3">
          <strong>DİKKAT:</strong> Bu işlemler veritabanı içeriğini kalıcı olarak değiştirebilir.
          Özellikle <code>truncate</code> işaretliyken devam etmeden önce mutlaka bir snapshot al.
        </p>

        <ul className="nav nav-tabs small mb-3 flex-wrap">
          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (activeTab === 'text' ? 'active' : '')}
              onClick={() => setActiveTab('text')}
              disabled={busy}
            >
              SQL Metni
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (activeTab === 'url' ? 'active' : '')}
              onClick={() => setActiveTab('url')}
              disabled={busy}
            >
              URL&apos;den
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (activeTab === 'file' ? 'active' : '')}
              onClick={() => setActiveTab('file')}
              disabled={busy}
            >
              Dosyadan
            </button>
          </li>
        </ul>

        {activeTab === 'text' && (
          <form onSubmit={handleSubmitText}>
            <div className="mb-2 position-relative">
              <label className="form-label small d-flex align-items-center gap-1 flex-wrap">
                SQL Script (utf8) <span className="text-danger">*</span>
                <HelpHint icon="question" title="SQL metni ipuçları">
                  <HelpBlock headline="SQL Metni">
                    <ul className="mb-0 ps-3">
                      <li>Buraya tam SQL script’i yapıştırılır.</li>
                      <li>
                        Çok büyük dump’larda tarayıcı yavaşlayabilir; dosya import daha uygundur.
                      </li>
                      <li>İçerik doğru encoding (utf8) olmalıdır.</li>
                    </ul>
                  </HelpBlock>
                </HelpHint>
              </label>

              <textarea
                className="form-control form-control-sm"
                rows={8}
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                placeholder="Buraya tam SQL script'ini yapıştır."
                disabled={busy}
              />
            </div>

            <div className="d-flex flex-wrap gap-3 mb-3">
              <div className="form-check position-relative">
                <input
                  id="import-text-truncate"
                  className="form-check-input"
                  type="checkbox"
                  checked={truncateText}
                  onChange={(e) => setTruncateText(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-text-truncate">
                  İşlemden önce TÜM tabloları <strong>TRUNCATE</strong> et
                  <HelpHint icon="bulb" title="Truncate nedir?">
                    <HelpBlock headline="TruncateBefore">
                      <div>
                        Import öncesi tablolar boşaltılır. Yanlış kullanım veri kaybına yol açar.
                        Prod’da işlem öncesi snapshot almak zorunlu kabul edilmelidir.
                      </div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>

              <div className="form-check position-relative">
                <input
                  id="import-text-dryrun"
                  className="form-check-input"
                  type="checkbox"
                  checked={dryRunText}
                  onChange={(e) => setDryRunText(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-text-dryrun">
                  Dry run (prova, değişiklikleri geriye al)
                  <HelpHint icon="question" title="Dry run nasıl çalışır?">
                    <HelpBlock headline="Dry Run">
                      <div>
                        Backend destekliyorsa SQL transaction içinde çalışır ve rollback yapar. Bazı
                        DDL işlemleri MySQL’de implicit commit yapabilir; %100 garanti değildir.
                      </div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
              {isImportingText ? 'İçe aktarılıyor...' : "SQL'i Uygula"}
            </button>
          </form>
        )}

        {activeTab === 'url' && (
          <form onSubmit={handleSubmitUrl}>
            <div className="mb-2 position-relative">
              <label className="form-label small d-flex align-items-center gap-1 flex-wrap">
                SQL Dump URL (.sql veya .sql.gz) <span className="text-danger">*</span>
                <HelpHint icon="question" title="URL import ipuçları">
                  <HelpBlock headline="URL Import">
                    <ul className="mb-0 ps-3">
                      <li>HTTPS kullanılması önerilir.</li>
                      <li>.sql.gz dump’lar büyük veride daha hızlı taşınır.</li>
                      <li>Yetki/koruma isteyen URL’ler backend tarafından indirilemeyebilir.</li>
                    </ul>
                  </HelpBlock>
                </HelpHint>
              </label>

              <input
                type="url"
                className="form-control form-control-sm"
                placeholder="https://.../dump.sql veya dump.sql.gz"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="d-flex flex-wrap gap-3 mb-3">
              <div className="form-check position-relative">
                <input
                  id="import-url-truncate"
                  className="form-check-input"
                  type="checkbox"
                  checked={truncateUrl}
                  onChange={(e) => setTruncateUrl(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-url-truncate">
                  İşlemden önce TÜM tabloları <strong>TRUNCATE</strong> et
                  <HelpHint icon="bulb" title="Truncate nedir?">
                    <HelpBlock headline="TruncateBefore">
                      <div>
                        Import öncesi tablolar boşaltılır. Prod’da snapshot almadan ilerleme.
                      </div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>

              <div className="form-check position-relative">
                <input
                  id="import-url-dryrun"
                  className="form-check-input"
                  type="checkbox"
                  checked={dryRunUrl}
                  onChange={(e) => setDryRunUrl(e.target.checked)}
                  disabled={busy}
                />
                <label className="form-check-label small" htmlFor="import-url-dryrun">
                  Dry run (prova, değişiklikleri geriye al)
                  <HelpHint icon="question" title="Dry run nasıl çalışır?">
                    <HelpBlock headline="Dry Run">
                      <div>
                        Backend destekliyorsa transaction + rollback yapar. Büyük dump’larda süre ve
                        kaynak tüketimi artar.
                      </div>
                    </HelpBlock>
                  </HelpHint>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
              {isImportingUrl ? 'İçe aktarılıyor...' : "URL'den İçe Aktar"}
            </button>
          </form>
        )}

        {activeTab === 'file' && (
          <form onSubmit={handleSubmitFile}>
            <div className="mb-2 position-relative">
              <label className="form-label small d-flex align-items-center gap-1 flex-wrap">
                SQL Dump Dosyası (.sql veya .gz) <span className="text-danger">*</span>
                <HelpHint icon="question" title="Dosya import ipuçları">
                  <HelpBlock headline="Dosyadan Import">
                    <ul className="mb-0 ps-3">
                      <li>En stabil yöntemdir (büyük dump’lar için önerilir).</li>
                      <li>Dosya import akışında dry run yoktur.</li>
                      <li>Nginx/Fastify body limit ayarları dosya boyutunu etkileyebilir.</li>
                    </ul>
                  </HelpBlock>
                </HelpHint>
              </label>

              <input
                key={fileInputKey}
                type="file"
                className="form-control form-control-sm"
                accept=".sql,.gz,.sql.gz"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={busy}
              />

              {file && (
                <div className="text-muted small mt-1">
                  Seçili dosya: <code>{file.name}</code>
                </div>
              )}

              <div className="text-muted small mt-1">
                Not: Dosyadan import akışında <strong>dry run</strong> yoktur (sadece truncate
                uygulanır).
              </div>
            </div>

            <div className="form-check mb-3 position-relative">
              <input
                id="import-file-truncate"
                className="form-check-input"
                type="checkbox"
                checked={truncateFile}
                onChange={(e) => setTruncateFile(e.target.checked)}
                disabled={busy}
              />
              <label className="form-check-label small" htmlFor="import-file-truncate">
                İşlemden önce TÜM tabloları <strong>TRUNCATE</strong> et
                <HelpHint icon="bulb" title="Truncate nedir?">
                  <HelpBlock headline="TruncateBefore">
                    <div>
                      Dosya import’ta en kritik seçenek budur. Açıkken import öncesi tablolar
                      tamamen boşaltılır. Snapshot almayı zorunlu kabul et.
                    </div>
                  </HelpBlock>
                </HelpHint>
              </label>
            </div>

            <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
              {isImportingFile ? 'İçe aktarılıyor...' : 'Dosyadan İçe Aktar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
