'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type {
  PopupAdminCreateBody,
  PopupAdminView,
  PopupDisplayFrequency,
  PopupLinkTarget,
  PopupTextBehavior,
  PopupType,
} from '@/integrations/shared';
import {
  useCreatePopupAdminMutation,
  useGetPopupAdminQuery,
  useUpdatePopupAdminMutation,
} from '@/integrations/hooks';

type FormState = {
  locale: string;
  type: PopupType;
  title: string;
  content: string;
  target_paths_text: string;
  button_text: string;
  link_url: string;
  link_target: PopupLinkTarget;
  image_url: string;
  image_asset_id: string;
  alt: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_hover_color: string;
  button_text_color: string;
  display_frequency: PopupDisplayFrequency;
  text_behavior: PopupTextBehavior;
  scroll_speed: number;
  is_active: boolean;
  closeable: boolean;
  delay_seconds: number;
  display_order: number;
  start_at: string;
  end_at: string;
};

const emptyForm: FormState = {
  locale: '',
  type: 'topbar',
  title: '',
  content: '',
  target_paths_text: '',
  button_text: '',
  link_url: '',
  link_target: '_self',
  image_url: '',
  image_asset_id: '',
  alt: '',
  background_color: '',
  text_color: '',
  button_color: '',
  button_hover_color: '',
  button_text_color: '',
  display_frequency: 'always',
  text_behavior: 'marquee',
  scroll_speed: 60,
  is_active: true,
  closeable: true,
  delay_seconds: 0,
  display_order: 0,
  start_at: '',
  end_at: '',
};

function asLocalDateTimeValue(v: string | null) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toNullable(v: string) {
  const x = v.trim();
  return x ? x : null;
}

function errMsg(err: unknown, fallback: string) {
  const e = err as any;
  return e?.data?.error || e?.data?.message || e?.error || e?.message || fallback;
}

export default function AdminPopupForm({ id }: { id?: string }) {
  const isNew = !id || id === 'new';
  const numericId = isNew ? undefined : Number(id);

  const t = useAdminT('admin.popups');
  const router = useRouter();
  const sp = useSearchParams();

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  const urlLocale = sp?.get('locale')?.trim().toLowerCase() || '';

  const effectiveLocale = React.useMemo(() => {
    if (urlLocale && localeOptions.some((o: any) => o.value === urlLocale)) return urlLocale;
    if (defaultLocaleFromDb) return defaultLocaleFromDb;
    return localeOptions[0]?.value || 'de';
  }, [urlLocale, localeOptions, defaultLocaleFromDb]);

  // Fetch existing popup for edit mode
  const detailQ = useGetPopupAdminQuery(
    { id: numericId!, locale: effectiveLocale },
    { skip: isNew || !numericId },
  );

  const [form, setForm] = React.useState<FormState>({ ...emptyForm, locale: effectiveLocale });
  const [initialized, setInitialized] = React.useState(false);

  // Populate form when data loads (edit mode)
  React.useEffect(() => {
    if (isNew && !initialized) {
      setForm((p) => ({ ...p, locale: effectiveLocale }));
      setInitialized(true);
      return;
    }

    if (!isNew && detailQ.data && !initialized) {
      const item = detailQ.data;
      setForm({
        locale: effectiveLocale,
        type: item.type,
        title: item.title,
        content: item.content ?? '',
        target_paths_text: item.target_paths.join('\n'),
        button_text: item.button_text ?? '',
        link_url: item.link_url ?? '',
        link_target: item.link_target ?? '_self',
        image_url: item.image_url ?? '',
        image_asset_id: item.image_asset_id ?? '',
        alt: item.alt ?? '',
        background_color: item.background_color ?? '',
        text_color: item.text_color ?? '',
        button_color: item.button_color ?? '',
        button_hover_color: item.button_hover_color ?? '',
        button_text_color: item.button_text_color ?? '',
        display_frequency: item.display_frequency,
        text_behavior: item.text_behavior ?? 'marquee',
        scroll_speed: item.scroll_speed ?? 60,
        is_active: item.is_active,
        closeable: item.closeable,
        delay_seconds: item.delay_seconds,
        display_order: item.display_order,
        start_at: asLocalDateTimeValue(item.start_at),
        end_at: asLocalDateTimeValue(item.end_at),
      });
      setInitialized(true);
    }
  }, [isNew, detailQ.data, effectiveLocale, initialized]);

  // Re-fetch when locale changes in edit mode
  React.useEffect(() => {
    if (!isNew && initialized) {
      setInitialized(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLocale]);

  const [createPopup, createState] = useCreatePopupAdminMutation();
  const [updatePopup, updateState] = useUpdatePopupAdminMutation();

  const busy = createState.isLoading || updateState.isLoading || detailQ.isFetching;

  const typeOptions: Array<{ value: PopupType; label: string }> = [
    { value: 'topbar', label: t('types.topbar', {}, 'Top-Leiste') },
    { value: 'sidebar_top', label: t('types.sidebarTop', {}, 'Sidebar oben') },
    { value: 'sidebar_center', label: t('types.sidebarCenter', {}, 'Sidebar mitte') },
    { value: 'sidebar_bottom', label: t('types.sidebarBottom', {}, 'Sidebar unten') },
  ];
  const frequencyOptions: Array<{ value: PopupDisplayFrequency; label: string }> = [
    { value: 'always', label: t('frequency.always', {}, 'Immer') },
    { value: 'once', label: t('frequency.once', {}, 'Einmal') },
    { value: 'daily', label: t('frequency.daily', {}, 'Täglich') },
  ];
  const linkTargetOptions: Array<{ value: PopupLinkTarget; label: string }> = [
    { value: '_self', label: t('linkTargets.self', {}, 'Gleicher Tab') },
    { value: '_blank', label: t('linkTargets.blank', {}, 'Neuer Tab') },
  ];
  const textBehaviorOptions: Array<{ value: PopupTextBehavior; label: string }> = [
    { value: 'marquee', label: t('textBehavior.marquee', {}, 'Lauftext') },
    { value: 'static', label: t('textBehavior.static', {}, 'Statisch') },
  ];

  function buildBody(): PopupAdminCreateBody {
    return {
      locale: form.locale || effectiveLocale || undefined,
      type: form.type,
      title: form.title.trim(),
      content: toNullable(form.content),
      target_paths: form.target_paths_text
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      button_text: toNullable(form.button_text),
      link_url: toNullable(form.link_url),
      link_target: form.link_target,
      image_url: toNullable(form.image_url),
      image_asset_id: toNullable(form.image_asset_id),
      alt: toNullable(form.alt),
      background_color: toNullable(form.background_color),
      text_color: toNullable(form.text_color),
      button_color: toNullable(form.button_color),
      button_hover_color: toNullable(form.button_hover_color),
      button_text_color: toNullable(form.button_text_color),
      display_frequency: form.display_frequency,
      text_behavior: form.text_behavior,
      scroll_speed: Number(form.scroll_speed || 60),
      is_active: form.is_active,
      closeable: form.closeable,
      delay_seconds: Number(form.delay_seconds || 0),
      display_order: Number(form.display_order || 0),
      start_at: form.start_at || null,
      end_at: form.end_at || null,
    };
  }

  async function onSave() {
    if (!form.title.trim()) {
      toast.error(t('messages.titleRequired', {}, 'Titel ist erforderlich'));
      return;
    }

    try {
      const body = buildBody();
      if (numericId) {
        await updatePopup({ id: numericId, body }).unwrap();
      } else {
        await createPopup(body).unwrap();
      }
      toast.success(t('messages.saved', {}, 'Gespeichert'));
      router.push(`/admin/popups?locale=${effectiveLocale}`);
    } catch (e) {
      toast.error(errMsg(e, t('messages.failed', {}, 'Vorgang fehlgeschlagen')));
    }
  }

  function goBack() {
    router.push(`/admin/popups?locale=${effectiveLocale}`);
  }

  if (!isNew && detailQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        {t('states.loading', {}, 'Laden...')}
      </div>
    );
  }

  if (!isNew && detailQ.isError) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-destructive">{t('states.loadError', {}, 'Popup konnte nicht geladen werden.')}</p>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 size-4" />
          {t('actions.back', {}, 'Zurück')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeft className="mr-2 size-4" />
          {t('actions.back', {}, 'Zurück')}
        </Button>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">
            {isNew ? t('modal.new', {}, 'Popup erstellen') : t('modal.edit', {}, 'Popup bearbeiten')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNew
              ? t('form.newDesc', {}, 'Neues Popup erstellen')
              : t('form.editDesc', {}, 'Popup-Inhalt und Einstellungen bearbeiten')}
          </p>
        </div>
      </div>

      {/* --- Content Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sectionContent', {}, 'Inhalt')}</CardTitle>
          <CardDescription>{t('form.sectionContentDesc', {}, 'Titel, Text und Sprache')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>{t('form.title', {}, 'Titel')}</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>{t('form.locale', {}, 'Sprache')}</Label>
              <Select
                value={form.locale}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, locale: v }));
                  const params = new URLSearchParams(sp?.toString() || '');
                  params.set('locale', v);
                  router.replace(`/admin/popups/${id ?? 'new'}?${params.toString()}`);
                }}
                disabled={localesLoading || localeOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localeOptions.map((opt: any) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {String(opt.label ?? opt.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>{t('form.content', {}, 'Inhalt')}</Label>
              <Textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.buttonText', {}, 'Button-Text')}</Label>
              <Input
                value={form.button_text}
                onChange={(e) => setForm((p) => ({ ...p, button_text: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('form.linkUrl', {}, 'Link')}</Label>
              <Input value={form.link_url} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>{t('form.targetPaths', {}, 'Zielseiten')}</Label>
              <Textarea
                rows={3}
                value={form.target_paths_text}
                onChange={(e) => setForm((p) => ({ ...p, target_paths_text: e.target.value }))}
                placeholder={'/services\n/services/*'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Display Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sectionDisplay', {}, 'Anzeige')}</CardTitle>
          <CardDescription>{t('form.sectionDisplayDesc', {}, 'Typ, Verhalten und Reihenfolge')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('form.type', {}, 'Typ')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as PopupType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.frequency', {}, 'Frequenz')}</Label>
              <Select
                value={form.display_frequency}
                onValueChange={(v) => setForm((p) => ({ ...p, display_frequency: v as PopupDisplayFrequency }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.order', {}, 'Reihenfolge')}</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value || 0) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.linkTarget', {}, 'Link-Ziel')}</Label>
              <Select
                value={form.link_target}
                onValueChange={(v) => setForm((p) => ({ ...p, link_target: v as PopupLinkTarget }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {linkTargetOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.textBehavior', {}, 'Textverhalten')}</Label>
              <Select
                value={form.text_behavior}
                onValueChange={(v) => setForm((p) => ({ ...p, text_behavior: v as PopupTextBehavior }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textBehaviorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.scrollSpeed', {}, 'Scroll-Geschwindigkeit')}</Label>
              <Input
                type="number"
                min={10}
                max={500}
                value={form.scroll_speed}
                onChange={(e) => setForm((p) => ({ ...p, scroll_speed: Number(e.target.value || 60) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('form.delay', {}, 'Verzögerung (Sek.)')}</Label>
              <Input
                type="number"
                value={form.delay_seconds}
                onChange={(e) => setForm((p) => ({ ...p, delay_seconds: Number(e.target.value || 0) }))}
              />
            </div>

            <div className="flex items-center gap-6 pt-7">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                />
                <Label>{t('form.active', {}, 'Aktiv')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.closeable}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, closeable: v }))}
                />
                <Label>{t('form.closeable', {}, 'Schließbar')}</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Schedule Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sectionSchedule', {}, 'Zeitplan')}</CardTitle>
          <CardDescription>{t('form.sectionScheduleDesc', {}, 'Start- und Enddatum')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('form.start', {}, 'Start')}</Label>
              <Input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.end', {}, 'Ende')}</Label>
              <Input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Image Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sectionImage', {}, 'Bild')}</CardTitle>
          <CardDescription>{t('form.sectionImageDesc', {}, 'Bild-URL oder Asset')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('form.imageUrl', {}, 'Bild-URL')}</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.imageAsset', {}, 'Bild-Asset-ID')}</Label>
              <Input
                value={form.image_asset_id}
                onChange={(e) => setForm((p) => ({ ...p, image_asset_id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.alt', {}, 'Alt-Text')}</Label>
              <Input value={form.alt} onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Colors Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sectionColors', {}, 'Farben')}</CardTitle>
          <CardDescription>{t('form.sectionColorsDesc', {}, 'Hintergrund-, Text- und Button-Farben')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('form.bgColor', {}, 'Hintergrundfarbe')}</Label>
              <Input
                value={form.background_color}
                onChange={(e) => setForm((p) => ({ ...p, background_color: e.target.value }))}
                placeholder="#0f172a"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.textColor', {}, 'Textfarbe')}</Label>
              <Input
                value={form.text_color}
                onChange={(e) => setForm((p) => ({ ...p, text_color: e.target.value }))}
                placeholder="#ffffff"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.buttonColor', {}, 'Button-Farbe')}</Label>
              <Input
                value={form.button_color}
                onChange={(e) => setForm((p) => ({ ...p, button_color: e.target.value }))}
                placeholder="#111827"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.buttonHoverColor', {}, 'Button-Hover-Farbe')}</Label>
              <Input
                value={form.button_hover_color}
                onChange={(e) => setForm((p) => ({ ...p, button_hover_color: e.target.value }))}
                placeholder="#1f2937"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.buttonTextColor', {}, 'Button-Textfarbe')}</Label>
              <Input
                value={form.button_text_color}
                onChange={(e) => setForm((p) => ({ ...p, button_text_color: e.target.value }))}
                placeholder="#ffffff"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Save Bar --- */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={goBack} disabled={busy}>
          {t('actions.cancel', {}, 'Abbrechen')}
        </Button>
        <Button onClick={onSave} disabled={busy}>
          <Save className="mr-2 size-4" />
          {t('actions.save', {}, 'Speichern')}
        </Button>
      </div>
    </div>
  );
}
