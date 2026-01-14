// =============================================================
// FILE: src/components/admin/db/modules/ModuleExportPanel.tsx
// =============================================================
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useExportModuleMutation } from '@/integrations/rtk/hooks';
import { buildDownloadName, triggerDownload } from '../shared/download';

export type ModuleExportPanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleExportPanel: React.FC<ModuleExportPanelProps> = ({ module, disabled }) => {
  const [format, setFormat] = useState<'sql' | 'json'>('sql');
  const [exportModule, { isLoading }] = useExportModuleMutation();

  const handleExport = async () => {
    try {
      const blob = await exportModule({ module, format }).unwrap();
      const ext = format === 'json' ? 'json' : 'sql';
      triggerDownload(blob, buildDownloadName(`module_${module}`, ext));
      toast.success(`${module} export indirildi (${format.toUpperCase()}).`);
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Module export sırasında hata oluştu.');
    }
  };

  return (
    <div className="border rounded-3 p-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <div className="fw-semibold small">Modül Export</div>
          <div className="text-muted small">
            {module} modülüne ait tablolar manifest sırasıyla dışa aktarılır.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            disabled={disabled || isLoading}
          >
            <option value="sql">SQL</option>
            <option value="json">JSON</option>
          </select>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleExport}
            disabled={disabled || isLoading}
          >
            {isLoading ? 'Hazırlanıyor...' : 'İndir'}
          </button>
        </div>
      </div>
    </div>
  );
};
