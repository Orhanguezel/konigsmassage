// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/modules/module-import-panel.tsx
// =============================================================
'use client';

import React, { useMemo, useState, FormEvent } from 'react';
import { toast } from 'sonner';
// import { useImportModuleMutation } from '@/integrations/hooks'; // TODO: Backend endpoint not implemented
import { askConfirm } from '../shared/confirm';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

type TabKey = 'text' | 'file';

export type ModuleImportPanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleImportPanel: React.FC<ModuleImportPanelProps> = ({ module, disabled }) => {
  const t = useAdminT('admin.db.modules.import');
  const [tab, setTab] = useState<TabKey>('text');

  const [sqlText, setSqlText] = useState('');
  const [truncate, setTruncate] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // const [importModule, { isLoading }] = useImportModuleMutation(); // TODO: Backend endpoint not implemented
  const isLoading = false;

  const busy = disabled || isLoading;

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: Backend endpoint for module import not implemented yet
    toast.info(t('notImplemented'));
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: Backend endpoint for module import not implemented yet
    toast.info(t('notImplemented'));
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{t('title')}</div>
            <div className="text-muted-foreground text-xs">
              {t('description', { module })}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="module-import-truncate"
              checked={truncate}
              onCheckedChange={(checked) => setTruncate(!!checked)}
              disabled={busy}
            />
            <Label
              htmlFor="module-import-truncate"
              className="text-xs font-normal cursor-pointer"
            >
              {t('truncate')}
            </Label>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="mb-4 h-8">
            <TabsTrigger value="text" className="text-xs px-3 h-7" disabled={busy}>
              {t('tabs.text')}
            </TabsTrigger>
            <TabsTrigger value="file" className="text-xs px-3 h-7" disabled={busy}>
              {t('tabs.file')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-0 space-y-4">
            <form onSubmit={handleSubmitText} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">
                  {t('text.label')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  className="min-h-[160px] text-xs font-mono"
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  placeholder={t('text.placeholder')}
                  disabled={busy}
                />
              </div>
              <Button type="submit" size="sm" variant="destructive" disabled={busy} className="h-8 text-xs">
                {isLoading ? t('importing') : t('applyButton')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file" className="mt-0 space-y-4">
            <form onSubmit={handleSubmitFile} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">
                  {t('file.label')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  key={fileInputKey}
                  type="file"
                  className="h-8 text-xs flex items-center"
                  accept=".sql,.gz,.sql.gz"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={busy}
                />
              </div>
              <Button type="submit" size="sm" variant="destructive" disabled={busy} className="h-8 text-xs">
                {isLoading ? t('importing') : t('importButton')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
