'use client';

import { useGetMyProfileQuery } from '@/integrations/rtk/hooks';
import type { Profile } from '@/integrations/rtk/public/profiles.endpoints';

type UseProfileOptions = {
  enabled?: boolean;
};

export function useProfile(opts?: UseProfileOptions): { data: Profile | undefined } {
  const { data } = useGetMyProfileQuery(undefined, {
    skip: opts?.enabled === false,
  });
  return { data: data ?? undefined };
}
