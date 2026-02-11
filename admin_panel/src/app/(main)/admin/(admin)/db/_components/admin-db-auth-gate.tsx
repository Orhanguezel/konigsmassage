// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/_components/admin-db-auth-gate.tsx
// FINAL — App Router + shadcn standards
// ✅ No Bootstrap classes
// ✅ No inline styles
// ✅ useRouter from next/navigation
// ✅ shadcn UI components
// =============================================================
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useStatusQuery } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Card, CardContent } from '@/components/ui/card';

export type AdminDbAuthGateProps = {
  children: (ctx: { authed: boolean; adminSkip: boolean }) => React.ReactNode;
};

export const AdminDbAuthGate: React.FC<AdminDbAuthGateProps> = ({ children }) => {
  const router = useRouter();
  const t = useAdminT();

  const { data: statusData, isLoading: statusLoading, isError: statusError } = useStatusQuery();

  const authed = !!statusData?.authenticated;

  // status bitmeden VEYA authed değilken admin endpoint'leri skip edilecek
  const adminSkip = statusLoading || !authed;

  useEffect(() => {
    if (statusLoading) return;
    if (statusError || !authed) router.push('/login');
  }, [statusLoading, statusError, authed, router]);

  // Loading state
  if (statusLoading || !statusData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('admin.db.auth.loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated — redirect handled by useEffect, render nothing
  if (!authed) return null;

  return <>{children({ authed, adminSkip })}</>;
};
