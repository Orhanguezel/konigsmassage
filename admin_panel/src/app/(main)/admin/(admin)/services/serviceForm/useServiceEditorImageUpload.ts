// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/_components/serviceForm/useServiceEditorImageUpload.ts
// guezelwebdesign – RichContentEditor image upload hook (services) (FINAL)
// =============================================================

import { toast } from 'sonner';
import { useCreateAssetAdminMutation } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type MetaValue = string | number | boolean;

export const useServiceEditorImageUpload = (args: { metadata: Record<string, MetaValue> }) => {
  const [createAssetAdmin] = useCreateAssetAdminMutation();
  const t = useAdminT();

  const toMeta = (metadata: Record<string, MetaValue>) =>
    Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)]));

  const onUpload = async (file: File): Promise<string> => {
    try {
      const res = await createAssetAdmin({
        file,
        bucket: 'public',
        folder: 'services/content',
        metadata: toMeta(args.metadata),
      } as any).unwrap();

      const url = (res as any)?.url as string | undefined;
      if (!url) throw new Error(t('admin.services.upload.noUrl'));
      return url;
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        t('admin.services.upload.error');
      toast.error(msg);
      return '';
    }
  };

  return { onUpload };
};
