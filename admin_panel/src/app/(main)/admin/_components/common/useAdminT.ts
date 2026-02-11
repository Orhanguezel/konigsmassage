'use client';

import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useAdminTranslations, type TranslateFn } from '../../../../../i18n/adminUi';

/**
 * Convenience hook: reads admin locale from preferences store
 * and returns a translation function bound to that locale.
 *
 * Usage: const t = useAdminT();
 */
export function useAdminT(): TranslateFn {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  return useAdminTranslations(adminLocale || undefined);
}
