'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/email-templates/[id]/admin-email-templates-detail-client.tsx
// FINAL — Admin Email Template Create/Edit Form (App Router + shadcn)
// - Modern UI with shadcn/ui components
// - Tailwind CSS with dark mode support
// - RTK Query hooks
// - HTML content editor (Textarea)
// - Variables input (comma-separated or JSON)
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Loader2, Code2, Mail } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { localeShortClient, localeShortClientOr } from '../../../../../../i18n/localeShortClient';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { EmailTemplateAdminCreatePayload } from '@/integrations/shared';
import {
  useGetEmailTemplateAdminQuery,
  useCreateEmailTemplateAdminMutation,
  useUpdateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
} from '@/integrations/hooks';

type FormData = {
  template_key: string;
  template_name: string;
  subject: string;
  content: string;
  variables: string; // comma-separated or JSON string
  is_active: boolean;
  locale: string;
};

function getErrMsg(e: unknown): string {
  const anyErr = e as any;
  return (
    anyErr?.data?.error?.message ||
    anyErr?.data?.message ||
    anyErr?.message ||
    'İşlem başarısız'
  );
}

function parseVariables(input: string): string[] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try JSON first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((v) => typeof v === 'string' && v.trim());
      }
    } catch {
      // Fall through to comma-separated
    }
  }

  // Comma-separated
  return trimmed
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function stringifyVariables(vars: string[] | null | undefined): string {
  if (!vars || vars.length === 0) return '';
  return vars.join(', ');
}

export default function AdminEmailTemplatesDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === 'new';

  // Locale management
  const { localeOptions, defaultLocaleFromDb, coerceLocale, loading: localesLoading } = useAdminLocales();

  // RTK Query - only fetch if editing
  const {
    data: existingItem,
    isLoading: loadingItem,
    error: loadError,
  } = useGetEmailTemplateAdminQuery(
    { id },
    { skip: isNew }
  );

  const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateAdminMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateAdminMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateAdminMutation();

  // Form state
  const [formData, setFormData] = React.useState<FormData>({
    template_key: '',
    template_name: '',
    subject: '',
    content: '',
    variables: '',
    is_active: true,
    locale:
      defaultLocaleFromDb ||
      localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de', 'de') ||
      '',
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Load existing data
  React.useEffect(() => {
    if (!isNew && existingItem) {
      // For edit mode, we might have translations
      // Use the first translation or default to empty
      const firstTranslation = existingItem.translations?.[0];

      setFormData({
        template_key: existingItem.template_key || '',
        template_name: firstTranslation?.template_name || '',
        subject: firstTranslation?.subject || '',
        content: firstTranslation?.content || '',
        variables: stringifyVariables(existingItem.variables),
        is_active: existingItem.is_active,
        locale:
          firstTranslation?.locale ||
          defaultLocaleFromDb ||
          localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de', 'de') ||
          '',
      });
    }
  }, [existingItem, isNew, defaultLocaleFromDb]);

  // Update default locale if needed
  React.useEffect(() => {
    if (isNew && defaultLocaleFromDb && !formData.locale) {
      setFormData((prev) => ({ ...prev, locale: defaultLocaleFromDb }));
    }
  }, [isNew, defaultLocaleFromDb, formData.locale]);

  const busy = isCreating || isUpdating || isDeleting || loadingItem;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.template_key.trim()) {
      toast.error('Template Key gerekli');
      return;
    }

    if (!formData.template_name.trim()) {
      toast.error('Template Name gerekli');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Subject gerekli');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content gerekli');
      return;
    }

    // ✅ Sadece locale normalize et
    const apiLocale = localeShortClient(formData.locale);
    const parsedVariables = parseVariables(formData.variables);

    try {
      if (isNew) {
        const payload: EmailTemplateAdminCreatePayload = {
          template_key: formData.template_key.trim(),
          template_name: formData.template_name.trim(),
          subject: formData.subject.trim(),
          content: formData.content.trim(),
          variables: parsedVariables,
          is_active: formData.is_active,
          locale: apiLocale,
        };

        await createTemplate(payload).unwrap();
        toast.success('Şablon oluşturuldu');
        router.push('/admin/email-templates');
      } else {
        await updateTemplate({
          id,
          body: {
            template_key: formData.template_key.trim(),
            template_name: formData.template_name.trim(),
            subject: formData.subject.trim(),
            content: formData.content.trim(),
            variables: parsedVariables,
            is_active: formData.is_active,
            locale: apiLocale,
          },
        }).unwrap();
        toast.success('Şablon güncellendi');
      }
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isNew) return;

    try {
      await deleteTemplate({ id }).unwrap();
      toast.success('Şablon silindi');
      router.push('/admin/email-templates');
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFormData((prev) => ({ ...prev, locale: coerced }));
  };

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-destructive">
              Kayıt yüklenemedi: {getErrMsg(loadError)}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/email-templates')}
              className="mt-4 gap-2"
            >
              <ArrowLeft className="size-4" />
              Listeye Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNew && loadingItem) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span>Yükleniyor...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>
                  {isNew ? 'Yeni Email Template' : 'Email Template Düzenle'}
                </CardTitle>
                <CardDescription>
                  {isNew
                    ? 'Yeni bir email şablonu oluşturun'
                    : 'Mevcut email şablonunu düzenleyin'}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/email-templates')}
                disabled={busy}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Geri
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Section 1: Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Locale */}
              <div>
                <AdminLocaleSelect
                  value={formData.locale}
                  onChange={handleLocaleChange}
                  options={localeOptions}
                  loading={localesLoading}
                  disabled={busy}
                />
              </div>

              {/* Active */}
              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-sm">
                  Durum
                </Label>
                <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                    disabled={busy}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer text-sm">
                    {formData.is_active ? (
                      <Badge variant="default">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Pasif</Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Template Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Şablon Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Key */}
            <div className="space-y-2">
              <Label htmlFor="template_key" className="text-sm">
                <div className="flex items-center gap-2">
                  <Code2 className="size-4" />
                  Template Key <span className="text-destructive">*</span>
                </div>
              </Label>
              <Input
                id="template_key"
                value={formData.template_key}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, template_key: e.target.value }))
                }
                placeholder="welcome_email"
                disabled={busy || !isNew} // Key cannot be changed after creation
                required
              />
              <p className="text-xs text-muted-foreground">
                Benzersiz anahtar (değiştirilemez). Örn: welcome_email, password_reset
              </p>
            </div>

            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="template_name" className="text-sm">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, template_name: e.target.value }))
                }
                placeholder="Hoş Geldiniz Emaili"
                disabled={busy}
                required
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  Subject <span className="text-destructive">*</span>
                </div>
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Hoş Geldiniz {{name}}!"
                disabled={busy}
                required
              />
              <p className="text-xs text-muted-foreground">
                Email konusu. Değişkenler için &#123;&#123;variable&#125;&#125; kullanın.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email İçeriği</CardTitle>
            <CardDescription>
              HTML içerik. Değişkenler için &#123;&#123;variable&#125;&#125; formatını kullanın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm">
                HTML Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder={`<html>
  <body>
    <h1>Merhaba {{name}}!</h1>
    <p>Hoş geldiniz...</p>
  </body>
</html>`}
                disabled={busy}
                rows={12}
                required
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Değişkenler</CardTitle>
            <CardDescription>
              Email içeriğinde kullanılan değişkenleri tanımlayın (opsiyonel)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variables */}
            <div className="space-y-2">
              <Label htmlFor="variables" className="text-sm">
                Variables
              </Label>
              <Textarea
                id="variables"
                value={formData.variables}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, variables: e.target.value }))
                }
                placeholder='name, email, url veya ["name", "email", "url"]'
                disabled={busy}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Virgülle ayrılmış (name, email, url) veya JSON array formatında ([&quot;name&quot;, &quot;email&quot;])
              </p>
            </div>

            {/* Show detected variables if editing */}
            {!isNew && (existingItem?.translations?.[0]?.detected_variables ?? []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">İçerikte Tespit Edilen Değişkenler</Label>
                <div className="flex flex-wrap gap-1">
                  {(existingItem?.translations?.[0]?.detected_variables ?? []).map((v) => (
                    <Badge key={v} variant="secondary">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-between">
            <div>
              {!isNew && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={busy}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      Sil
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/email-templates')}
                disabled={busy}
              >
                İptal
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{formData.template_key || 'Bu şablon'}</strong> silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
