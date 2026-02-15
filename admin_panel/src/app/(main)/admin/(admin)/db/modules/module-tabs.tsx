// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/modules/module-tabs.tsx
// =============================================================
'use client';

import React, { useMemo, useState } from 'react';
import { ModuleExportPanel } from './module-export-panel';
import { ModuleImportPanel } from './module-import-panel';
import { ModuleValidatePanel } from './module-validate-panel';
import { SiteSettingsUiPanel } from './site-settings-ui-panel';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type TabKey = 'export' | 'import' | 'validate' | 'ui';

const MODULE_OPTIONS = [
  'site_settings',
  'products',
  'categories',
  'subcategories',
  'services',
  'faqs',
  'custom_pages',
  'menuitem',
  'slider',
  'footer_sections',
  'library',
  'reviews',
  'support',
  'users',
  'offers',
  'storage',
] as const;

export type ModuleTabsProps = {
  adminSkip: boolean;
};

export const ModuleTabs: React.FC<ModuleTabsProps> = ({ adminSkip }) => {
  const t = useAdminT('admin.db.modules');
  const [moduleKey, setModuleKey] = useState<string>('products');
  const [tab, setTab] = useState<TabKey>('export');

  const showUiTab = moduleKey === 'site_settings';

  const headerText = useMemo(() => {
    const mod = moduleKey.replace(/_/g, ' ');
    return mod.charAt(0).toUpperCase() + mod.slice(1);
  }, [moduleKey]);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">{t('title')}</CardTitle>
          <CardDescription className="text-xs">
            {t('selected', { module: headerText })}
          </CardDescription>
        </div>

        <Select
          value={moduleKey}
          onValueChange={(v) => {
            setModuleKey(v);
            if (v !== 'site_settings' && tab === 'ui') {
              setTab('export');
            }
          }}
          disabled={adminSkip}
        >
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((k) => (
              <SelectItem key={k} value={k} className="text-xs">
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="px-0">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="mb-4 h-9">
            <TabsTrigger value="export" className="text-xs px-3" disabled={adminSkip}>
              {t('tabs.export')}
            </TabsTrigger>
            <TabsTrigger value="import" className="text-xs px-3" disabled={adminSkip}>
              {t('tabs.import')}
            </TabsTrigger>
            <TabsTrigger value="validate" className="text-xs px-3" disabled={adminSkip}>
              {t('tabs.validate')}
            </TabsTrigger>
            {showUiTab && (
              <TabsTrigger value="ui" className="text-xs px-3" disabled={adminSkip}>
                {t('tabs.ui')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="export" className="mt-0">
            <ModuleExportPanel module={moduleKey} disabled={adminSkip} />
          </TabsContent>
          <TabsContent value="import" className="mt-0">
            <ModuleImportPanel module={moduleKey} disabled={adminSkip} />
          </TabsContent>
          <TabsContent value="validate" className="mt-0">
            <ModuleValidatePanel module={moduleKey} disabled={adminSkip} />
          </TabsContent>
          {showUiTab && (
            <TabsContent value="ui" className="mt-0">
              <SiteSettingsUiPanel disabled={adminSkip} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
