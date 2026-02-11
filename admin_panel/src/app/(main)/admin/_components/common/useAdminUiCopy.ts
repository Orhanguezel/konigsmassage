'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/common/useAdminUiCopy.ts
// FINAL — Admin UI copy hook (site_settings.ui_admin)
// =============================================================

import { useMemo } from 'react';

import { useGetSiteSettingAdminByKeyQuery } from '@/integrations/hooks';
import type { AdminUiCopy } from '@/integrations/shared';
import { normalizeAdminUiCopy } from '@/integrations/shared';

type UseAdminUiCopyResult = {
  copy: AdminUiCopy;
  loading: boolean;
  fetching: boolean;
  error?: unknown;
};

export function useAdminUiCopy(): UseAdminUiCopyResult {
  const q = useGetSiteSettingAdminByKeyQuery('ui_admin');

  const copy = useMemo(() => {
    const val = (q.data as any)?.value;
    return normalizeAdminUiCopy(val);
  }, [q.data]);

  return {
    copy,
    loading: q.isLoading,
    fetching: q.isFetching,
    error: q.error,
  };
}
