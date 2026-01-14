// =============================================================
// FILE: src/integrations/db/types/common.ts
// =============================================================

/** Genel satır tipi */
export type UnknownRow = Record<string, unknown>;

export type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false';

export type SortDirection = 'asc' | 'desc';
