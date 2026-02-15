// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/modules/module-export-panel.tsx
// =============================================================
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
// import { useExportModuleMutation } from '@/integrations/hooks'; // TODO: Backend endpoint not implemented
import { buildDownloadName, triggerDownload } from '../shared/download';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export type ModuleExportPanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleExportPanel: React.FC<ModuleExportPanelProps> = ({ module, disabled }) => {
  const t = useAdminT('admin.db.modules.export');
  const [format, setFormat] = useState<'sql' | 'json'>('sql');
  // const [exportModule, { isLoading }] = useExportModuleMutation(); // TODO: Not implemented
  const isLoading = false;

  const handleExport = async () => {
    // TODO: Backend module export endpoint not implemented yet
    toast.info(t('notImplemented'));
    /* try {
      const blob = await exportModule({ module, format }).unwrap();
      const ext = format === 'json' ? 'json' : 'sql';
      triggerDownload(blob, buildDownloadName(`module_${module}`, ext));
      toast.success(t('success', { module, format: format.toUpperCase() }));
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('error'));
    } */
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-semibold text-sm">{t('title')}</div>
          <div className="text-muted-foreground text-xs">
            {t('description', { module })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={format}
            onValueChange={(v) => setFormat(v as 'sql' | 'json')}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sql" className="text-xs">{t('format.sql')}</SelectItem>
              <SelectItem value="json" className="text-xs">{t('format.json')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={disabled || isLoading}
            className="h-8 text-xs"
          >
            {isLoading ? t('preparing') : t('downloadButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
