// =============================================================
// FILE: src/components/admin/services/serviceForm/useServiceEditorImageUpload.ts
// konigsmassage – RichContentEditor image upload hook (services)
// =============================================================

import { toast } from 'sonner';
import { useCreateAssetAdminMutation } from '@/integrations/rtk/hooks';

export const useServiceEditorImageUpload = (args: {
  metadata: Record<string, string | number | boolean>;
}) => {
  const [createAssetAdmin] = useCreateAssetAdminMutation();

  const toMeta = (metadata: Record<string, string | number | boolean>) =>
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
      if (!url) throw new Error('Upload başarılı ama URL alınamadı.');
      return url;
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Resim yüklenirken hata oluştu.';
      toast.error(msg);
      return '';
    }
  };

  return { onUpload };
};
