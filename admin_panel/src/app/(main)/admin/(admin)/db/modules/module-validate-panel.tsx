// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/modules/module-validate-panel.tsx
// =============================================================
'use client';

import React from 'react';
// import { useValidateModuleManifestQuery } from '@/integrations/hooks'; // TODO: Backend endpoint not implemented
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export type ModuleValidatePanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleValidatePanel: React.FC<ModuleValidatePanelProps> = ({ module, disabled }) => {
  const t = useAdminT('admin.db.modules.validate');
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
            onClick={handleRun}
            disabled={disabled || busy}
            className="h-8 text-xs shrink-0"
          >
            {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {busy ? t('checking') : t('checkButton')}
          </Button>
        </div>

        <div className="mt-2">
          {!data ? (
            <div className="text-muted-foreground text-xs italic">{t('noResult')}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={ok ? 'outline' : 'destructive'} 
                  className={ok ? 'h-6 border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400' : 'h-6'}
                >
                  {ok ? t('statusOk') : t('statusError')}
                </Badge>
                <span className="text-xs">
                  {t('module')} <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{module}</code>
                </span>
              </div>

              {!!res?.errors?.length && (
                <div className="space-y-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <AlertCircle className="size-3.5" />
                    {t('errors')}
                  </div>
                  <ul className="text-[11px] space-y-1 ml-5 list-disc">
                    {res.errors.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!!res?.warnings?.length && (
                <div className="space-y-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-500">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <AlertCircle className="size-3.5" />
                    {t('warnings')}
                  </div>
                  <ul className="text-[11px] space-y-1 ml-5 list-disc">
                    {res.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.summary && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t text-[11px] text-muted-foreground">
                  <div>
                    {t('declaredTables')}: <strong className="text-foreground">{data.summary.totalTablesDeclared}</strong>
                  </div>
                  <div>
                    {t('duplicates')}: <strong className="text-foreground">{(data.summary.duplicates || []).length}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
