// =============================================================
// FILE: src/components/admin/db/modules/ModuleExportPanel.tsx
// =============================================================
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
// import { useExportModuleMutation } from '@/integrations/hooks'; // TODO: Backend endpoint not implemented
import { buildDownloadName, triggerDownload } from '../shared/download';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type ModuleExportPanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleExportPanel: React.FC<ModuleExportPanelProps> = ({ module, disabled }) => {
  const t = useAdminT();
  const [format, setFormat] = useState<'sql' | 'json'>('sql');
  // const [exportModule, { isLoading }] = useExportModuleMutation(); // TODO: Not implemented
  const isLoading = false;

  const handleExport = async () => {
    // TODO: Backend module export endpoint not implemented yet
    toast.info(t('admin.db.modules.export.notImplemented'));
    /* try {
      const blob = await exportModule({ module, format }).unwrap();
      const ext = format === 'json' ? 'json' : 'sql';
      triggerDownload(blob, buildDownloadName(`module_${module}`, ext));
      toast.success(t('admin.db.modules.export.success', { module, format: format.toUpperCase() }));
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('admin.db.modules.export.error'));
    } */
  };

  return (
    <div className="border rounded-3 p-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <div className="fw-semibold small">{t('admin.db.modules.export.title')}</div>
          <div className="text-muted small">
            {t('admin.db.modules.export.description', { module })}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            disabled={disabled || isLoading}
          >
            <option value="sql">{t('admin.db.modules.export.format.sql')}</option>
            <option value="json">{t('admin.db.modules.export.format.json')}</option>
          </select>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleExport}
            disabled={disabled || isLoading}
          >
            {isLoading ? t('admin.db.modules.export.preparing') : t('admin.db.modules.export.downloadButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
