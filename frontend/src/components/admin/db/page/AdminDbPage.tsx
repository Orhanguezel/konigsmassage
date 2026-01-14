// =============================================================
// FILE: src/components/admin/db/page/AdminDbPage.tsx
// =============================================================
'use client';

import React from 'react';
import { AdminDbAuthGate } from './AdminDbAuthGate';

import { FullDbHeader } from '../fullDb/FullDbHeader';
import { FullDbImportPanel } from '../fullDb/FullDbImportPanel';
import { SnapshotsPanel } from '../fullDb/SnapshotsPanel';
import { ModuleTabs } from '../modules/ModuleTabs';

import { HelpHint } from '../shared/HelpHint';
import { HelpBlock } from '../shared/HelpBlock';

export const AdminDbPage: React.FC = () => {
  return (
    <AdminDbAuthGate>
      {({ adminSkip }) => (
        <div className="container-fluid py-3">
          <div className="mb-3 position-relative">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4 className="h5 mb-0">Veritabanı Yönetimi</h4>

              <HelpHint icon="bulb" title="Bu sayfa ne yapar?">
                <HelpBlock headline="DB Admin ekranı">
                  <ul className="mb-0 ps-3">
                    <li>
                      <strong>Full DB</strong>: tüm veritabanını export/import edersin.
                    </li>
                    <li>
                      <strong>Snapshot</strong>: riskli işlem öncesi geri dönüş noktası alır,
                      restore edersin.
                    </li>
                    <li>
                      <strong>Module Export/Import</strong>: yalnızca seçilen modül tablolarını
                      taşır (örn. products).
                    </li>
                    <li>
                      <strong>UI (site_settings ui_*)</strong>: locale bazlı UI metinlerini toplu
                      export/bootstrap eder.
                    </li>
                  </ul>
                </HelpBlock>
              </HelpHint>
            </div>

            <p className="text-muted small mb-0 mt-1">
              Snapshot noktaları oluştur, tam yedek indir, SQL import uygula veya modül bazlı
              export/import yap.
            </p>
          </div>

          {/* Full DB ops */}
          <FullDbHeader />
          <FullDbImportPanel />
          <SnapshotsPanel adminSkip={adminSkip} />

          {/* Module ops */}
          <ModuleTabs adminSkip={adminSkip} />
        </div>
      )}
    </AdminDbAuthGate>
  );
};
