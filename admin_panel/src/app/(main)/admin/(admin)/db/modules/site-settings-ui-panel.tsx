// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/modules/site-settings-ui-panel.tsx
// =============================================================
'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
// import {
//   useBootstrapSiteSettingsUiLocaleMutation,
//   useExportSiteSettingsUiJsonQuery,
// } from '@/integrations/hooks'; // TODO: Backend endpoints not implemented
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download, Zap } from 'lucide-react';

export type SiteSettingsUiPanelProps = {
  disabled: boolean;
};

export const SiteSettingsUiPanel: React.FC<SiteSettingsUiPanelProps> = ({ disabled }) => {
  const t = useAdminT('admin.db.modules.ui');
  // const { data, isLoading, isFetching } = useExportSiteSettingsUiJsonQuery(undefined, {
  //   skip: disabled,
  // }); // TODO: Backend endpoint not implemented

  const data: any = null;
  const isLoading = false;
  const isFetching = false;

  const [locale, setLocale] = useState('en');
  const [fromLocale, setFromLocale] = useState('de');
  const [overwrite, setOverwrite] = useState(false);
  const [onlyUiKeys, setOnlyUiKeys] = useState(true);

  // const [bootstrap, { isLoading: isBootstrapping }] = useBootstrapSiteSettingsUiLocaleMutation(); // TODO: Backend endpoint not implemented
  const bootstrap = (_params: any) => ({ unwrap: async () => ({ ok: false, error: 'Not implemented' }) });
  const isBootstrapping = false;

  const busy = disabled || isLoading || isFetching || isBootstrapping;

  const locales = useMemo(() => data?.locales ?? ['tr', 'en', 'de'], [data?.locales]);

  const handleDownloadJson = () => {
    if (!data) return toast.error(t('downloadError'));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, buildDownloadName('site_settings_ui', 'json'));
    toast.success(t('downloadSuccess'));
  };

  const handleBootstrap = async () => {
    try {
      const res = await bootstrap({ locale, fromLocale, overwrite, onlyUiKeys }).unwrap();
      if (!res?.ok) return toast.error(res?.error || t('bootstrapError'));
      toast.success(t('bootstrapSuccess'));
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('bootstrapErrorGeneric'));
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{t('title')}</div>
            <div className="text-muted-foreground text-xs">
              {t('description')}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadJson}
            disabled={busy || !data}
            className="h-8 text-xs shrink-0"
          >
            <Download className="mr-2 size-3.5" />
            {t('downloadButton')}
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">{t('targetLocale')}</Label>
            <Select
              value={locale}
              onValueChange={setLocale}
              disabled={busy}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((l: string) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t('sourceLocale')}</Label>
            <Select
              value={fromLocale}
              onValueChange={setFromLocale}
              disabled={busy}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((l: string) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 pb-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ui-overwrite"
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(!!checked)}
                disabled={busy}
              />
              <Label htmlFor="ui-overwrite" className="text-xs font-normal cursor-pointer">
                {t('overwrite')}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ui-onlyUi"
                checked={onlyUiKeys}
                onCheckedChange={(checked) => setOnlyUiKeys(!!checked)}
                disabled={busy}
              />
              <Label htmlFor="ui-onlyUi" className="text-xs font-normal cursor-pointer">
                {t('onlyUiKeys')}
              </Label>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleBootstrap}
            disabled={busy}
            className="h-8 text-xs w-full sm:w-auto ml-auto bg-yellow-500 hover:bg-yellow-600 text-black border-none"
          >
            {isBootstrapping ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            ) : (
              <Zap className="mr-2 size-3.5" />
            )}
            {isBootstrapping ? t('applying') : t('bootstrapButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
