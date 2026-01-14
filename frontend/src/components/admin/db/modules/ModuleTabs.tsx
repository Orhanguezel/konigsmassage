// =============================================================
// FILE: src/components/admin/db/modules/ModuleTabs.tsx
// =============================================================
'use client';

import React, { useMemo, useState } from 'react';
import { ModuleExportPanel } from './ModuleExportPanel';
import { ModuleImportPanel } from './ModuleImportPanel';
import { ModuleValidatePanel } from './ModuleValidatePanel';
import { SiteSettingsUiPanel } from './SiteSettingsUiPanel';

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
  const [moduleKey, setModuleKey] = useState<string>('products');
  const [tab, setTab] = useState<TabKey>('export');

  const showUiTab = moduleKey === 'site_settings';

  const headerText = useMemo(() => {
    const t = moduleKey.replace(/_/g, ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }, [moduleKey]);

  return (
    <div className="card mb-3">
      <div className="card-header py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <div className="small fw-semibold">Modül Bazlı DB Yönetimi</div>
          <div className="text-muted small">Seçili modül: {headerText}</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={moduleKey}
            onChange={(e) => setModuleKey(e.target.value)}
            disabled={adminSkip}
          >
            {MODULE_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-body">
        <ul className="nav nav-tabs small mb-3 flex-wrap">
          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (tab === 'export' ? 'active' : '')}
              onClick={() => setTab('export')}
              disabled={adminSkip}
            >
              Export
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (tab === 'import' ? 'active' : '')}
              onClick={() => setTab('import')}
              disabled={adminSkip}
            >
              Import
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={'nav-link py-1 px-2 ' + (tab === 'validate' ? 'active' : '')}
              onClick={() => setTab('validate')}
              disabled={adminSkip}
            >
              Manifest Validate
            </button>
          </li>

          {showUiTab && (
            <li className="nav-item">
              <button
                type="button"
                className={'nav-link py-1 px-2 ' + (tab === 'ui' ? 'active' : '')}
                onClick={() => setTab('ui')}
                disabled={adminSkip}
              >
                UI Export/Bootstrap
              </button>
            </li>
          )}
        </ul>

        {tab === 'export' && <ModuleExportPanel module={moduleKey} disabled={adminSkip} />}
        {tab === 'import' && <ModuleImportPanel module={moduleKey} disabled={adminSkip} />}
        {tab === 'validate' && <ModuleValidatePanel module={moduleKey} disabled={adminSkip} />}
        {tab === 'ui' && showUiTab && <SiteSettingsUiPanel disabled={adminSkip} />}
      </div>
    </div>
  );
};
