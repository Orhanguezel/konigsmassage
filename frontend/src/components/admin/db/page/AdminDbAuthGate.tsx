// =============================================================
// FILE: src/components/admin/db/page/AdminDbAuthGate.tsx
// =============================================================
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStatusQuery } from '@/integrations/rtk/hooks';

export type AdminDbAuthGateProps = {
  children: (ctx: { authed: boolean; adminSkip: boolean }) => React.ReactNode;
};

export const AdminDbAuthGate: React.FC<AdminDbAuthGateProps> = ({ children }) => {
  const router = useRouter();

  const { data: statusData, isLoading: statusLoading, isError: statusError } = useStatusQuery();
  const authed = !!statusData?.authenticated;

  // status bitmeden VEYA authed değilken admin endpoint'leri skip edilecek
  const adminSkip = statusLoading || !authed;

  useEffect(() => {
    if (statusLoading) return;
    if (statusError || !authed) router.push('/login');
  }, [statusLoading, statusError, authed, router]);

  if (statusLoading || !statusData) {
    return (
      <div className="container-fluid py-3">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: '16rem' }}
        >
          <div className="text-center">
            <div className="spinner-border text-secondary" role="status" />
            <div className="text-muted small mt-2">Admin paneli yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!authed) return null;

  return <>{children({ authed, adminSkip })}</>;
};
