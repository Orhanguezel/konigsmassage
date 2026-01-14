// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/db_admin.endpoints.ts
// konigsmassage – Admin DB Endpoints (RTK Query)
// CLEAN:
// - Types: db.types.ts tek kaynak
// - Endpoints: db + module + site_settings ui + manifest validate + snapshots
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';

import type {
  DbImportResponse,
  SqlImportTextParams,
  SqlImportUrlParams,
  SqlImportFileParams,
  DbSnapshot,
  CreateDbSnapshotBody,
  DeleteSnapshotResponse,
  SqlImportParams,
  ModuleExportFormat,
  ExportModuleParams,
  ImportModuleBody,
  SiteSettingsUiExportResponse,
  SiteSettingsUiBootstrapBody,
  ManifestValidateQuery,
  ManifestValidateResponse,
} from '@/integrations/types';

/* ---------------- Helpers ---------------- */

const toSqlBlob = (ab: ArrayBuffer) => new Blob([ab], { type: 'application/sql' });
const toJsonBlob = (ab: ArrayBuffer) => new Blob([ab], { type: 'application/json' });

const isFileBody = (v: ImportModuleBody): v is Extract<ImportModuleBody, { file: File }> =>
  typeof (v as any)?.file !== 'undefined' && (v as any)?.file instanceof File;

const normalizeBool01 = (v: any): 0 | 1 => (v === true || v === 1 || v === '1' ? 1 : 0);

export const dbAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* ---------------------------------------------------------
     * FULL DB EXPORT SQL: GET /admin/db/export -> Blob
     * --------------------------------------------------------- */
    exportSql: b.mutation<Blob, void>({
      query: () => ({
        url: '/admin/db/export',
        method: 'GET',
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) => toSqlBlob(ab),
    }),

    /* ---------------------------------------------------------
     * FULL DB EXPORT JSON: GET /admin/db/export?format=json -> Blob
     * --------------------------------------------------------- */
    exportJson: b.mutation<Blob, void>({
      query: () => ({
        url: '/admin/db/export',
        method: 'GET',
        params: { format: 'json' },
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) => toJsonBlob(ab),
    }),

    /* ---------------------------------------------------------
     * IMPORT (TEXT): POST /admin/db/import-sql
     * Body: { sql, truncateBefore?, dryRun? }
     * --------------------------------------------------------- */
    importSqlText: b.mutation<DbImportResponse, SqlImportTextParams>({
      query: (body) => ({
        url: '/admin/db/import-sql',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'DbSnapshot' as const, id: 'LIST' },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * IMPORT (URL): POST /admin/db/import-url
     * Body: { url, truncateBefore?, dryRun? }
     * --------------------------------------------------------- */
    importSqlUrl: b.mutation<DbImportResponse, SqlImportUrlParams>({
      query: (body) => ({
        url: '/admin/db/import-url',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'DbSnapshot' as const, id: 'LIST' },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * IMPORT (FILE): POST /admin/db/import-file (multipart)
     * --------------------------------------------------------- */
    importSqlFile: b.mutation<DbImportResponse, SqlImportFileParams>({
      query: ({ file, truncateBefore }) => {
        const form = new FormData();
        form.append('file', file, file.name);

        if (typeof truncateBefore !== 'undefined') {
          form.append('truncateBefore', String(!!truncateBefore));
          form.append('truncate_before_import', String(!!truncateBefore)); // legacy
        }

        return {
          url: '/admin/db/import-file',
          method: 'POST',
          body: form,
        };
      },
      invalidatesTags: [
        { type: 'DbSnapshot' as const, id: 'LIST' },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * (LEGACY) importSql -> /admin/db/import-file
     * --------------------------------------------------------- */
    importSql: b.mutation<DbImportResponse, { file: File } & Partial<SqlImportParams>>({
      query: ({ file, truncate_before_import }) => {
        const form = new FormData();
        form.append('file', file, file.name);

        if (typeof truncate_before_import !== 'undefined') {
          form.append('truncateBefore', String(!!truncate_before_import));
          form.append('truncate_before_import', String(!!truncate_before_import));
        }

        return {
          url: '/admin/db/import-file',
          method: 'POST',
          body: form,
        };
      },
      invalidatesTags: [
        { type: 'DbSnapshot' as const, id: 'LIST' },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * MODULE EXPORT: GET /admin/db/export-module?module=...&format=sql|json
     * --------------------------------------------------------- */
    exportModule: b.mutation<Blob, ExportModuleParams>({
      query: ({ module, format }) => ({
        url: '/admin/db/export-module',
        method: 'GET',
        params: { module, format: (format ?? 'sql') as ModuleExportFormat },
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer, _meta, arg) =>
        (arg?.format ?? 'sql') === 'json' ? toJsonBlob(ab) : toSqlBlob(ab),
    }),

    /* ---------------------------------------------------------
     * MODULE IMPORT: POST /admin/db/import-module
     * - JSON body (sqlText) veya multipart (file)
     * --------------------------------------------------------- */
    importModule: b.mutation<DbImportResponse, ImportModuleBody>({
      query: (body) => {
        if (isFileBody(body)) {
          const form = new FormData();
          form.append('module', body.module);
          form.append('file', body.file, body.file.name);
          if (typeof body.truncateBefore !== 'undefined') {
            form.append('truncateBefore', String(!!body.truncateBefore));
          }
          return { url: '/admin/db/import-module', method: 'POST', body: form };
        }

        return {
          url: '/admin/db/import-module',
          method: 'POST',
          body: {
            module: body.module,
            sqlText: body.sqlText,
            truncateBefore: body.truncateBefore ?? true,
          },
        };
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: 'DbAdmin' as const, id: 'STATE' },
        { type: 'DbModule' as const, id: arg.module },
        { type: 'DbSnapshot' as const, id: 'LIST' },
      ],
    }),

    /* ---------------------------------------------------------
     * SITE SETTINGS UI EXPORT: GET /admin/db/site-settings/ui-export
     * --------------------------------------------------------- */
    exportSiteSettingsUiJson: b.query<SiteSettingsUiExportResponse, void>({
      query: () => ({
        url: '/admin/db/site-settings/ui-export',
        method: 'GET',
      }),
      providesTags: [{ type: 'DbModule' as const, id: 'site_settings' }],
    }),

    /* ---------------------------------------------------------
     * SITE SETTINGS UI BOOTSTRAP: POST /admin/db/site-settings/ui-bootstrap
     * --------------------------------------------------------- */
    bootstrapSiteSettingsUiLocale: b.mutation<DbImportResponse, SiteSettingsUiBootstrapBody>({
      query: (body) => ({
        url: '/admin/db/site-settings/ui-bootstrap',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'DbAdmin' as const, id: 'STATE' },
        { type: 'DbModule' as const, id: 'site_settings' },
      ],
    }),

    /* ---------------------------------------------------------
     * MANIFEST VALIDATION: GET /admin/db/modules/validate
     * Optional: ?module=products&module=site_settings&includeDbTables=1
     * --------------------------------------------------------- */
    validateModuleManifest: b.query<ManifestValidateResponse, ManifestValidateQuery | void>({
      query: (arg) => {
        const a = (arg ?? {}) as ManifestValidateQuery;

        const params: Record<string, any> = {};

        if (typeof a.includeDbTables !== 'undefined') {
          params.includeDbTables = normalizeBool01(a.includeDbTables);
        }

        if (typeof a.module !== 'undefined') {
          params.module = a.module;
        }

        return {
          url: '/admin/db/modules/validate',
          method: 'GET',
          params,
        };
      },
      providesTags: [{ type: 'DbManifest' as const, id: 'VALIDATION' }],
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT LIST: GET /admin/db/snapshots
     * --------------------------------------------------------- */
    listDbSnapshots: b.query<DbSnapshot[], void>({
      query: () => ({
        url: '/admin/db/snapshots',
        method: 'GET',
      }),
      providesTags: (res) =>
        res && res.length
          ? [
              { type: 'DbSnapshot' as const, id: 'LIST' },
              ...res.map((s) => ({ type: 'DbSnapshot' as const, id: s.id })),
            ]
          : [{ type: 'DbSnapshot' as const, id: 'LIST' }],
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT CREATE: POST /admin/db/snapshots
     * --------------------------------------------------------- */
    createDbSnapshot: b.mutation<DbSnapshot, CreateDbSnapshotBody | void>({
      query: (body) => ({
        url: '/admin/db/snapshots',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: [{ type: 'DbSnapshot' as const, id: 'LIST' }],
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT RESTORE: POST /admin/db/snapshots/:id/restore
     * --------------------------------------------------------- */
    restoreDbSnapshot: b.mutation<
      DbImportResponse,
      { id: string; dryRun?: boolean; truncateBefore?: boolean }
    >({
      query: ({ id, dryRun, truncateBefore }) => ({
        url: `/admin/db/snapshots/${encodeURIComponent(id)}/restore`,
        method: 'POST',
        body: {
          truncateBefore: truncateBefore ?? true,
          dryRun: dryRun ?? false,
        },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'DbSnapshot' as const, id: 'LIST' },
        { type: 'DbSnapshot' as const, id: arg.id },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT DELETE: DELETE /admin/db/snapshots/:id
     * --------------------------------------------------------- */
    deleteDbSnapshot: b.mutation<DeleteSnapshotResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/db/snapshots/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'DbSnapshot' as const, id: 'LIST' },
        { type: 'DbSnapshot' as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useExportSqlMutation,
  useExportJsonMutation,
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
  useImportSqlMutation,

  useExportModuleMutation,
  useImportModuleMutation,

  useExportSiteSettingsUiJsonQuery,
  useBootstrapSiteSettingsUiLocaleMutation,

  useValidateModuleManifestQuery,

  useListDbSnapshotsQuery,
  useCreateDbSnapshotMutation,
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
} = dbAdminApi;
