'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/notifications/[id]/admin-notification-detail-client.tsx
// FINAL — Admin Notification Detail/Create (App Router + shadcn)
// - Create new or Edit existing notification
// - Form with validation
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { NotificationView, CreateNotificationBody } from '@/integrations/shared';
import {
  useListNotificationsQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
} from '@/integrations/hooks';

function getErrMsg(e: unknown): string {
  const anyErr = e as any;
  return (
    anyErr?.data?.error?.message ||
    anyErr?.data?.message ||
    anyErr?.message ||
    'İşlem başarısız'
  );
}

const NOTIFICATION_TYPES = [
  'order_created',
  'order_paid',
  'order_failed',
  'booking_created',
  'booking_status_changed',
  'system',
  'custom',
] as const;

type FormData = {
  user_id: string;
  title: string;
  message: string;
  type: string;
};

export default function AdminNotificationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === 'new';

  const { data: items = [] } = useListNotificationsQuery();
  const item = items.find((n) => n.id === id);

  const [createNotification, { isLoading: isCreating }] = useCreateNotificationMutation();
  const [updateNotification, { isLoading: isUpdating }] = useUpdateNotificationMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  const [formData, setFormData] = React.useState<FormData>({
    user_id: '',
    title: '',
    message: '',
    type: 'system',
  });

  // Load existing data
  React.useEffect(() => {
    if (!isNew && item) {
      setFormData({
        user_id: item.user_id || '',
        title: item.title,
        message: item.message,
        type: item.type,
      });
    }
  }, [isNew, item]);

  const busy = isCreating || isUpdating || isDeleting;

  const handleBack = () => {
    router.push('/admin/notifications');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Başlık gerekli');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Mesaj gerekli');
      return;
    }

    try {
      if (isNew) {
        const body: CreateNotificationBody = {
          user_id: formData.user_id.trim() || undefined,
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type as any,
        };
        await createNotification(body).unwrap();
        toast.success('Bildirim oluşturuldu');
        router.push('/admin/notifications');
      } else {
        // Note: notifications endpoint only supports updating is_read
        // For full edit, we'd need backend support
        toast.warning('Bildirimleri düzenleme şu anda desteklenmiyor');
      }
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${item?.title}" bildirimini silmek istediğinize emin misiniz?`)) return;

    try {
      await deleteNotification({ id }).unwrap();
      toast.success('Bildirim silindi');
      router.push('/admin/notifications');
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                {isNew ? 'Yeni Bildirim' : 'Bildirim Detayı'}
              </CardTitle>
              <CardDescription>
                {isNew ? 'Yeni bir bildirim oluşturun' : 'Bildirim detaylarını görüntüleyin'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline" size="sm">
                <ArrowLeft className="mr-2 size-4" />
                Geri
              </Button>
              {!isNew && (
                <Button
                  onClick={handleDelete}
                  disabled={busy}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="mr-2 size-4" />
                  Sil
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {/* User ID (optional) */}
            <div className="space-y-2">
              <Label htmlFor="user_id">
                Kullanıcı ID <span className="text-muted-foreground">(opsiyonel)</span>
              </Label>
              <Input
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData((p) => ({ ...p, user_id: e.target.value }))}
                placeholder="Boş bırakılırsa mevcut kullanıcı"
                disabled={!isNew || busy}
              />
              <p className="text-xs text-muted-foreground">
                Belirli bir kullanıcıya göndermek için UUID girin
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Başlık <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Bildirim başlığı"
                required
                disabled={!isNew || busy}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Mesaj <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                placeholder="Bildirim mesajı"
                rows={4}
                required
                disabled={!isNew || busy}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Tip <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}
                disabled={!isNew || busy}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">custom (özel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            {isNew && (
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" onClick={handleBack} variant="outline" disabled={busy}>
                  İptal
                </Button>
                <Button type="submit" disabled={busy}>
                  <Save className="mr-2 size-4" />
                  {busy ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            )}

            {!isNew && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ℹ️ Bildirimler oluşturulduktan sonra düzenlenemez. Sadece okundu/okunmadı
                  durumu değiştirilebilir.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Detail info (for existing items) */}
      {!isNew && item && (
        <Card>
          <CardHeader>
            <CardTitle>Bildirim Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="text-sm">{item.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kullanıcı ID</p>
                <p className="text-sm">{item.user_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durum</p>
                <p className="text-sm">{item.is_read ? 'Okundu' : 'Okunmadı'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</p>
                <p className="text-sm">
                  {new Date(item.created_at).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
