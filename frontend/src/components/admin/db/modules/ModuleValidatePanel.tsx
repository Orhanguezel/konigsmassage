// =============================================================
// FILE: src/components/admin/db/modules/ModuleValidatePanel.tsx
// =============================================================
'use client';

import React from 'react';
import { useValidateModuleManifestQuery } from '@/integrations/rtk/hooks';

export type ModuleValidatePanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleValidatePanel: React.FC<ModuleValidatePanelProps> = ({ module, disabled }) => {
  const { data, isLoading, isFetching, refetch } = useValidateModuleManifestQuery(
    { module: [module], includeDbTables: 1 },
    { skip: disabled },
  );

  const busy = isLoading || isFetching;

  const handleRun = () => {
    if (!disabled) refetch();
  };

  const res = data?.results?.[0];
  const ok = res?.ok;

  return (
    <div className="border rounded-3 p-3">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <div className="fw-semibold small">Manifest Doğrulama</div>
          <div className="text-muted small">
            Manifest’teki tablolar DB’de var mı? duplicate var mı? sıralama güvenli mi?
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleRun}
          disabled={disabled || busy}
        >
          {busy ? 'Kontrol ediliyor...' : 'Kontrol Et'}
        </button>
      </div>

      <div className="mt-3">
        {!data ? (
          <div className="text-muted small">Henüz sonuç yok.</div>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={'badge ' + (ok ? 'bg-success' : 'bg-danger')}>
                {ok ? 'OK' : 'HATALI'}
              </span>
              <span className="small">
                Modül: <code>{module}</code>
              </span>
            </div>

            {!!res?.errors?.length && (
              <div className="mb-2">
                <div className="fw-semibold small text-danger">Errors</div>
                <ul className="small text-muted mb-0">
                  {res.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {!!res?.warnings?.length && (
              <div className="mb-2">
                <div className="fw-semibold small">Warnings</div>
                <ul className="small text-muted mb-0">
                  {res.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.summary && (
              <div className="mt-2 text-muted small">
                <div>
                  Declared tables: <strong>{data.summary.totalTablesDeclared}</strong>
                </div>
                <div>
                  Duplicates: <strong>{(data.summary.duplicates || []).length}</strong>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
