// =============================================================
// FILE: src/components/admin/db/modules/ModuleValidatePanel.tsx
// =============================================================
'use client';

import React from 'react';
// import { useValidateModuleManifestQuery } from '@/integrations/hooks'; // TODO: Backend endpoint not implemented
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type ModuleValidatePanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleValidatePanel: React.FC<ModuleValidatePanelProps> = ({ module, disabled }) => {
  const t = useAdminT();
  // const { data, isLoading, isFetching, refetch } = useValidateModuleManifestQuery(
  //   { module: [module], includeDbTables: 1 },
  //   { skip: disabled },
  // ); // TODO: Backend endpoint not implemented

  const data: any = null;
  const isLoading = false;
  const isFetching = false;
  const refetch = () => {};

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
          <div className="fw-semibold small">{t('admin.db.modules.validate.title')}</div>
          <div className="text-muted small">
            {t('admin.db.modules.validate.description')}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleRun}
          disabled={disabled || busy}
        >
          {busy ? t('admin.db.modules.validate.checking') : t('admin.db.modules.validate.checkButton')}
        </button>
      </div>

      <div className="mt-3">
        {!data ? (
          <div className="text-muted small">{t('admin.db.modules.validate.noResult')}</div>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={'badge ' + (ok ? 'bg-success' : 'bg-danger')}>
                {ok ? t('admin.db.modules.validate.statusOk') : t('admin.db.modules.validate.statusError')}
              </span>
              <span className="small">
                {t('admin.db.modules.validate.module')} <code>{module}</code>
              </span>
            </div>

            {!!res?.errors?.length && (
              <div className="mb-2">
                <div className="fw-semibold small text-danger">{t('admin.db.modules.validate.errors')}</div>
                <ul className="small text-muted mb-0">
                  {res.errors.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {!!res?.warnings?.length && (
              <div className="mb-2">
                <div className="fw-semibold small">{t('admin.db.modules.validate.warnings')}</div>
                <ul className="small text-muted mb-0">
                  {res.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.summary && (
              <div className="mt-2 text-muted small">
                <div>
                  {t('admin.db.modules.validate.declaredTables')} <strong>{data.summary.totalTablesDeclared}</strong>
                </div>
                <div>
                  {t('admin.db.modules.validate.duplicates')} <strong>{(data.summary.duplicates || []).length}</strong>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
