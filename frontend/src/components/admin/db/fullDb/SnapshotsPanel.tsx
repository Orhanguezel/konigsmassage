// =============================================================
// FILE: src/components/admin/db/fullDb/SnapshotsPanel.tsx
// =============================================================
'use client';

import React from 'react';
import { useListDbSnapshotsQuery } from '@/integrations/rtk/hooks';
import { SnapshotsTable } from './SnapshotsTable';

export type SnapshotsPanelProps = {
  adminSkip: boolean;
};

export const SnapshotsPanel: React.FC<SnapshotsPanelProps> = ({ adminSkip }) => {
  const { data, isLoading, isFetching, refetch } = useListDbSnapshotsQuery(undefined, {
    skip: adminSkip,
  });

  const loading = isLoading || isFetching;

  const handleRefetch = () => {
    if (!adminSkip) refetch();
  };

  return <SnapshotsTable items={data ?? []} loading={loading} refetch={handleRefetch} />;
};
