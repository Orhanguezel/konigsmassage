// =============================================================
// FILE: src/modules/audit/_longtext.ts
// Drizzle MySQL LONGTEXT helper (version-safe)
// =============================================================

import { customType } from 'drizzle-orm/mysql-core';

export const longtext = customType<{ data: string | null; driverData: string | null }>({
  dataType() {
    return 'longtext';
  },
  toDriver(value) {
    return value ?? null;
  },
  fromDriver(value) {
    return value ?? null;
  },
});
