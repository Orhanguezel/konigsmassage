// =============================================================
// Admin Storage — list/get/create(multipart)/bulkCreate/patch/delete/bulkDelete/folders/diag
// =============================================================
import { baseApi } from '@/integrations/rtk/baseApi';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { StorageAsset, StorageUpdateInput, StorageListQuery } from '@/integrations/types';

type ListResponse = { items: StorageAsset[]; total: number };

type BulkCreateErrorItem = {
  file: string;
  error: {
    where?: string;
    message?: string;
    http?: number | null;
  };
};

type BulkCreateResponse = {
  count: number;
  items: Array<StorageAsset | BulkCreateErrorItem>;
};

// NULL-güvenli tag helper
const listTags = (items?: StorageAsset[]) =>
  items && items.length
    ? [
        { type: 'Storage' as const, id: 'LIST' as const },
        ...items.map((r) => ({ type: 'Storage' as const, id: r.id })),
      ]
    : [{ type: 'Storage' as const, id: 'LIST' as const }];

// Backend query tipini Record<string, string | number>’e çevir
const toQueryParams = (q?: Partial<StorageListQuery>): Record<string, string | number> => {
  if (!q) return {};
  const params: Record<string, string | number> = {};

  if (q.q) params.q = q.q;
  if (q.bucket) params.bucket = q.bucket;
  if (q.folder != null) params.folder = q.folder;
  if (q.mime) params.mime = q.mime;
  if (typeof q.limit === 'number') params.limit = q.limit;
  if (typeof q.offset === 'number') params.offset = q.offset;
  if (q.sort) params.sort = q.sort;
  if (q.order) params.order = q.order;

  return params;
};

// Hata helper (FetchBaseQueryError union'ı kullan)
const makeCustomError = (message: string, data?: unknown): FetchBaseQueryError =>
  ({
    status: 'CUSTOM_ERROR',
    error: message,
    data,
  } as FetchBaseQueryError);

export const storageAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAssetsAdmin: builder.query<ListResponse, Partial<StorageListQuery> | void>({
      query: (q) => ({
        url: '/admin/storage/assets',
        method: 'GET',
        params: toQueryParams(q as Partial<StorageListQuery>),
      }),
      transformResponse: (data: StorageAsset[], meta) => {
        const headers = meta?.response?.headers;

        const totalStr =
          headers?.get?.('x-total-count') ?? headers?.get?.('X-Total-Count') ?? undefined;

        const total = totalStr ? Number(totalStr) : data?.length ?? 0;
        return { items: data ?? [], total };
      },
      providesTags: (res) => listTags(res?.items),
    }),

    getAssetAdmin: builder.query<StorageAsset, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      providesTags: (res) => (res ? [{ type: 'Storage', id: res.id }] : []),
    }),

    // Tekli create (multipart)
    createAssetAdmin: builder.mutation<
      StorageAsset,
      {
        file: File;
        bucket: string;
        folder?: string;
        metadata?: Record<string, string> | null;
      }
    >({
      async queryFn(args, _api, _extra, baseQuery) {
        try {
          // ✅ multipart order fix:
          // Fastify req.file() kullanırken fields'in mp.fields'e düşmesi için
          // file'dan önce append etmek daha güvenli.
          const fd = new FormData();

          fd.append('bucket', String(args.bucket || 'default'));
          if (args.folder) fd.append('folder', String(args.folder));

          if (args.metadata && typeof args.metadata === 'object') {
            fd.append('metadata', JSON.stringify(args.metadata));
          }

          // dosyayı EN SON ekle
          const filename = args.file?.name || 'file';
          fd.append('file', args.file, filename);

          const res = await baseQuery({
            url: '/admin/storage/assets',
            method: 'POST',
            body: fd,
          });

          if (res.error) {
            return { error: res.error as FetchBaseQueryError };
          }

          return { data: res.data as StorageAsset };
        } catch (e) {
          return {
            error: makeCustomError(
              'create_failed',
              e instanceof Error ? { message: e.message } : e,
            ),
          };
        }
      },
      invalidatesTags: (res) =>
        res
          ? [
              { type: 'Storage', id: res.id },
              { type: 'Storage', id: 'LIST' },
            ]
          : [{ type: 'Storage', id: 'LIST' }],
    }),

    // Çoklu create (multipart; form-level bucket/folder/metadata + birden çok file)
    bulkCreateAssetsAdmin: builder.mutation<
      BulkCreateResponse,
      {
        files: File[];
        bucket: string;
        folder?: string;
        metadata?: Record<string, string> | null;
      }
    >({
      async queryFn(args, _api, _extra, baseQuery) {
        try {
          const fd = new FormData();

          fd.append('bucket', String(args.bucket || 'default'));
          if (args.folder) fd.append('folder', String(args.folder));

          if (args.metadata && typeof args.metadata === 'object') {
            fd.append('metadata', JSON.stringify(args.metadata));
          }

          const files = Array.isArray(args.files) ? args.files : [];
          for (const f of files) {
            if (!f) continue;
            fd.append('files', f, f.name || 'file'); // backend parts() ile okuyor
          }

          const res = await baseQuery({
            url: '/admin/storage/assets/bulk',
            method: 'POST',
            body: fd,
          });

          if (res.error) {
            return { error: res.error as FetchBaseQueryError };
          }

          return { data: res.data as BulkCreateResponse };
        } catch (e) {
          return {
            error: makeCustomError(
              'bulk_create_failed',
              e instanceof Error ? { message: e.message } : e,
            ),
          };
        }
      },
      invalidatesTags: () => [{ type: 'Storage', id: 'LIST' }],
    }),

    patchAssetAdmin: builder.mutation<StorageAsset, { id: string; body: StorageUpdateInput }>({
      query: ({ id, body }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Storage', id: arg.id },
        { type: 'Storage', id: 'LIST' },
      ],
    }),

    deleteAssetAdmin: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Storage', id: arg.id },
        { type: 'Storage', id: 'LIST' },
      ],
    }),

    bulkDeleteAssetsAdmin: builder.mutation<{ deleted: number }, { ids: string[] }>({
      query: ({ ids }) => ({
        url: '/admin/storage/assets/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Storage', id: 'LIST' },
        ...arg.ids.map((id) => ({ type: 'Storage' as const, id })),
      ],
    }),

    listFoldersAdmin: builder.query<string[], void>({
      query: () => ({ url: '/admin/storage/folders', method: 'GET' }),
      providesTags: () => [{ type: 'Storage', id: 'FOLDERS' }],
    }),

    diagCloudinaryAdmin: builder.query<
      { ok: boolean; cloud: string; uploaded?: { public_id: string; secure_url: string } },
      void
    >({
      query: () => ({ url: '/admin/storage/_diag/cloud', method: 'GET' }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useListAssetsAdminQuery,
  useGetAssetAdminQuery,
  useCreateAssetAdminMutation,
  useBulkCreateAssetsAdminMutation,
  usePatchAssetAdminMutation,
  useDeleteAssetAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useListFoldersAdminQuery,
  useDiagCloudinaryAdminQuery,
  useLazyDiagCloudinaryAdminQuery,
} = storageAdminApi;
