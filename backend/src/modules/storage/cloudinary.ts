// =============================================================
// FILE: src/modules/storage/cloudinary.ts
// konigsmassage – Storage Provider (LOCAL + Cloudinary)
// -------------------------------------------------------------
// Amaç: STORAGE_DRIVER (local | cloudinary) + Cloudinary key'leri
//  - Öncelik: site_settings (runtime) → ENV (fallback)
// FIXES:
//  - Signed varsa signed, yoksa DB’den cloudinary_unsigned_preset ile unsigned
//  - PDF ve non-image dosyalar: ✅ HER ZAMAN LOCAL (stabil public /uploads)
//  - LOCAL folder normalize:
//      * baş/son slash temizle
//      * "uploads/" prefix gelirse kırp (double uploads bug fix)
//  - uploadLocal: resource_type doğru (image vs raw)
// =============================================================

import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/core/env';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getStorageSettings, type StorageSettings } from '@/modules/siteSettings/service';

type Driver = 'local' | 'cloudinary';

export type Cfg = {
  driver: Driver;
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  defaultFolder?: string;

  // ✅ DB’den gelecek: cloudinary_unsigned_preset
  unsignedUploadPreset?: string | null;

  localRoot?: string | null;
  localBaseUrl?: string | null;
};

export type UploadResult = {
  public_id: string;
  secure_url: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  resource_type?: string | null;
  version?: number | null;
  etag?: string | null;
};

export type RenameResult = {
  public_id: string;
  secure_url?: string;
  version?: number;
  format?: string;
};

/* -------------------------------------------------------------------------- */
/*                            CONFIG (CACHED)                                 */
/* -------------------------------------------------------------------------- */

let cachedCfg: Cfg | null = null;
let cachedAt = 0;
const CFG_CACHE_MS = 30_000; // 30sn cache

const envDriver = (): Driver =>
  (env.STORAGE_DRIVER || '').toLowerCase() === 'cloudinary' ? 'cloudinary' : 'local';

async function loadStorageSettingsSafe(): Promise<StorageSettings | null> {
  try {
    return await getStorageSettings();
  } catch {
    return null;
  }
}

/**
 * Cloudinary / Local config:
 *  1) site_settings (getStorageSettings)
 *  2) .env fallback (CLOUDINARY_* + LOCAL_STORAGE_*)
 *
 * ✅ FIX:
 * - cloudinary driver için iki mod:
 *    - SIGNED: cloudName + apiKey + apiSecret
 *    - UNSIGNED: cloudName + unsignedUploadPreset
 */
export async function getCloudinaryConfig(): Promise<Cfg | null> {
  const now = Date.now();
  if (cachedCfg && now - cachedAt < CFG_CACHE_MS) return cachedCfg;

  const settings = await loadStorageSettingsSafe();

  const driverFromSettings = (settings?.driver || '').toLowerCase() as Driver | '';
  const driver: Driver =
    driverFromSettings === 'cloudinary' || driverFromSettings === 'local'
      ? driverFromSettings
      : envDriver();

  const cloudName =
    settings?.cloudName || env.CLOUDINARY_CLOUD_NAME || (driver === 'local' ? 'local' : '');

  const apiKey = settings?.apiKey || env.CLOUDINARY_API_KEY || undefined;
  const apiSecret = settings?.apiSecret || env.CLOUDINARY_API_SECRET || undefined;

  const cfg: Cfg = {
    driver,
    cloudName,
    apiKey,
    apiSecret,
    defaultFolder: settings?.folder ?? undefined,
    unsignedUploadPreset: settings?.unsignedUploadPreset ?? null,
    localRoot: settings?.localRoot ?? env.LOCAL_STORAGE_ROOT ?? null,
    localBaseUrl: settings?.localBaseUrl ?? env.LOCAL_STORAGE_BASE_URL ?? null,
  };

  // Cloudinary driver ise: cloudName + apiKey en azından olmalı
  if (driver === 'cloudinary') {
    if (!cfg.cloudName || !cfg.apiKey) {
      cachedCfg = null;
      cachedAt = now;
      return null;
    }

    cloudinary.config({
      cloud_name: cfg.cloudName,
      api_key: cfg.apiKey,
      api_secret: cfg.apiSecret, // undefined olabilir (unsigned mode)
      secure: true,
    });

    // api_secret yoksa preset şart
    if (!cfg.apiSecret && !cfg.unsignedUploadPreset) {
      cachedCfg = null;
      cachedAt = now;
      return null;
    }
  }

  cachedCfg = cfg;
  cachedAt = now;
  return cfg;
}

/* -------------------------------------------------------------------------- */
/*                              LOCAL UPLOAD                                  */
/* -------------------------------------------------------------------------- */

type UpOpts = { folder?: string; publicId?: string; mime?: string };

function guessExt(mime?: string): string {
  if (!mime) return '';
  const m = mime.toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return '.jpg';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  if (m === 'application/pdf') return '.pdf';
  if (m === 'text/plain') return '.txt';
  if (m === 'application/zip') return '.zip';
  if (m === 'application/msword') return '.doc';
  if (m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return '.docx';
  if (m === 'application/vnd.ms-excel') return '.xls';
  if (m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return '.xlsx';
  if (m === 'application/vnd.ms-powerpoint') return '.ppt';
  if (m === 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    return '.pptx';
  return '';
}

/**
 * ✅ Folder normalize (double uploads fix):
 * - trim
 * - remove leading/trailing slashes
 * - if starts with "uploads/" => remove it
 * - if equals "uploads" => empty
 */
function normalizeLocalFolder(raw?: string | null, fallback?: string | null): string {
  let f = String(raw ?? fallback ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  if (!f) return '';

  const lower = f.toLowerCase();
  if (lower === 'uploads') return '';
  if (lower.startsWith('uploads/')) f = f.slice('uploads/'.length);

  // collapse // just in case
  f = f.replace(/\/{2,}/g, '/');

  return f;
}

async function uploadLocal(cfg: Cfg, buffer: Buffer, opts: UpOpts): Promise<UploadResult> {
  const fallbackRoot = path.join(process.cwd(), 'uploads');
  let root = cfg.localRoot || env.LOCAL_STORAGE_ROOT || fallbackRoot;

  const mime = String(opts.mime ?? '').toLowerCase();
  const isImage = mime.startsWith('image/');

  // ✅ double uploads fix burada
  const folder = normalizeLocalFolder(opts.folder ?? null, cfg.defaultFolder ?? null);

  const ext = guessExt(opts.mime);

  let baseName =
    (opts.publicId && String(opts.publicId).replace(/^\/+/, '')) ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (ext && !baseName.includes('.')) baseName += ext;

  const relativePath = folder ? `${folder}/${baseName}` : baseName;

  let absDir = path.join(root, folder || '.');
  let absFile = path.join(root, relativePath);

  try {
    await fs.mkdir(absDir, { recursive: true });
  } catch (err: any) {
    // permission fallback
    if (err?.code === 'EACCES' || err?.code === 'EPERM') {
      root = fallbackRoot;
      absDir = path.join(root, folder || '.');
      absFile = path.join(root, relativePath);
      await fs.mkdir(absDir, { recursive: true });
    } else {
      throw err;
    }
  }

  await fs.writeFile(absFile, buffer);

  // base url: normalde '/uploads' (nginx static)
  const baseUrlRaw = cfg.localBaseUrl || env.LOCAL_STORAGE_BASE_URL || '/uploads';
  const baseUrl = baseUrlRaw.replace(/\/+$/g, '');

  // relativePath hiçbir zaman "uploads/..." ile başlamamalı
  const rel = relativePath.replace(/^\/+/, '');

  const url = `${baseUrl}/${rel}`;

  return {
    public_id: relativePath, // bucket/path değil, local relative path
    secure_url: url,
    bytes: buffer.length,
    width: null,
    height: null,
    format: ext ? ext.replace('.', '') : null,
    resource_type: isImage ? 'image' : 'raw',
    version: null,
    etag: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                     CLOUDINARY (SIGNED/UNSIGNED)                           */
/* -------------------------------------------------------------------------- */

function pickResourceType(mime?: string): 'auto' | 'image' | 'raw' | 'video' {
  const m = (mime || '').toLowerCase();
  if (m === 'application/pdf') return 'raw';
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  return 'auto';
}

export async function uploadBufferAuto(
  cfg: Cfg,
  buffer: Buffer,
  opts: UpOpts,
): Promise<UploadResult> {
  const driver: Driver = cfg.driver ?? envDriver();
  const mime = String(opts.mime ?? '').toLowerCase();

  // ✅ HARD RULE: Non-image (PDF dahil) HER ZAMAN LOCAL
  // Cloudinary raw + preview + access mode sorunlarını sıfırlamak için
  const isImage = mime.startsWith('image/');
  if (!isImage) {
    console.debug?.('[storage] uploadBufferAuto FORCE LOCAL (non-image)', {
      mime,
      folder: opts.folder ?? cfg.defaultFolder,
      publicId: opts.publicId,
      bytes: buffer.length,
      driver,
    });
    return uploadLocal(cfg, buffer, opts);
  }

  // Local driver ise zaten local
  if (driver === 'local') {
    console.debug?.('[storage] uploadBufferAuto LOCAL', {
      folder: opts.folder ?? cfg.defaultFolder,
      publicId: opts.publicId,
      bytes: buffer.length,
    });
    return uploadLocal(cfg, buffer, opts);
  }

  // Buradan sonrası: image/* + cloudinary
  const folder = opts.folder ?? cfg.defaultFolder;

  const canSigned = !!cfg.cloudName && !!cfg.apiKey && !!cfg.apiSecret;
  const canUnsigned = !!cfg.cloudName && !!cfg.unsignedUploadPreset;

  if (!canSigned && !canUnsigned) {
    throw Object.assign(new Error('cloudinary_not_configured'), { http_code: 501 });
  }

  const resource_type = pickResourceType(opts.mime); // image/*
  console.debug?.('[storage] uploadBufferAuto CLOUDINARY start', {
    cloud: cfg.cloudName,
    folder,
    publicId: opts.publicId,
    mime: opts.mime,
    bytes: buffer.length,
    mode: canSigned ? 'signed' : 'unsigned',
    resource_type,
    preset: canSigned ? undefined : cfg.unsignedUploadPreset,
  });

  try {
    const rawResult = await new Promise<unknown>((resolve, reject) => {
      const params: Record<string, any> = {
        folder,
        public_id: opts.publicId,
        resource_type,
        overwrite: true,
      };

      // ✅ unsigned ise preset zorunlu
      if (!canSigned) {
        params.upload_preset = cfg.unsignedUploadPreset;
      }

      const stream = cloudinary.uploader.upload_stream(params, (err, res) => {
        if (err || !res) return reject(err ?? new Error('upload_failed'));
        resolve(res);
      });

      stream.end(buffer);
    });

    const r = rawResult as {
      public_id?: string;
      secure_url?: string;
      bytes?: number;
      width?: number;
      height?: number;
      format?: string;
      resource_type?: string;
      version?: number;
      etag?: string;
    };

    if (!r.public_id || !r.secure_url) {
      console.error('[storage] uploadBufferAuto CLOUDINARY invalid_response', {
        cloud: cfg.cloudName,
        folder,
        publicId: opts.publicId,
      });
      throw new Error('cloudinary_invalid_response');
    }

    console.debug?.('[storage] uploadBufferAuto CLOUDINARY ok', {
      cloud: cfg.cloudName,
      public_id: r.public_id,
      bytes: r.bytes,
      format: r.format,
      resource_type: r.resource_type,
    });

    return {
      public_id: r.public_id,
      secure_url: r.secure_url,
      bytes: typeof r.bytes === 'number' ? r.bytes : buffer.length,
      width: typeof r.width === 'number' ? r.width : null,
      height: typeof r.height === 'number' ? r.height : null,
      format: r.format ?? null,
      resource_type: r.resource_type ?? null,
      version: typeof r.version === 'number' ? r.version : null,
      etag: r.etag ?? null,
    };
  } catch (e) {
    const err = e as any;
    console.error('[storage] uploadBufferAuto CLOUDINARY failed', {
      cloud: cfg.cloudName,
      folder,
      publicId: opts.publicId,
      mime: opts.mime,
      bytes: buffer.length,
      err_name: err?.name,
      err_msg: err?.message,
      http_code: err?.http_code,
      cld_error: err?.error ?? null,
    });
    throw e;
  }
}

/* -------------------------------------------------------------------------- */
/*                       DELETE / RENAME (LOCAL+CLD)                           */
/* -------------------------------------------------------------------------- */

export async function destroyCloudinaryById(
  publicId: string,
  resourceType?: string,
  provider?: string,
): Promise<void> {
  const cfg = await getCloudinaryConfig();

  const driverFromProvider: Driver | null =
    provider === 'local' ? 'local' : provider === 'cloudinary' ? 'cloudinary' : null;

  const driver: Driver = driverFromProvider ?? cfg?.driver ?? envDriver();

  if (driver === 'local') {
    const root = cfg?.localRoot || env.LOCAL_STORAGE_ROOT || path.join(process.cwd(), 'uploads');
    const rel = publicId.replace(/^\/+/, '');
    const abs = path.join(root, rel);
    try {
      await fs.unlink(abs);
    } catch {}
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType ?? 'image',
    invalidate: true,
  });
}

export async function renameCloudinaryPublicId(
  oldPublicId: string,
  newPublicId: string,
  resourceType: string = 'image',
  provider?: string,
): Promise<RenameResult> {
  const cfg = await getCloudinaryConfig();

  const driverFromProvider: Driver | null =
    provider === 'local' ? 'local' : provider === 'cloudinary' ? 'cloudinary' : null;

  const driver: Driver = driverFromProvider ?? cfg?.driver ?? envDriver();

  if (driver === 'local') {
    const root = cfg?.localRoot || env.LOCAL_STORAGE_ROOT || path.join(process.cwd(), 'uploads');
    const oldRel = oldPublicId.replace(/^\/+/, '');
    const newRel = newPublicId.replace(/^\/+/, '');
    const oldAbs = path.join(root, oldRel);
    const newAbs = path.join(root, newRel);

    await fs.mkdir(path.dirname(newAbs), { recursive: true });
    try {
      await fs.rename(oldAbs, newAbs);
    } catch {}

    const baseUrlRaw = cfg?.localBaseUrl || env.LOCAL_STORAGE_BASE_URL || '/uploads';
    const baseUrl = baseUrlRaw.replace(/\/+$/g, '');
    const rel = newRel.replace(/^\/+/, '');

    return { public_id: newRel, secure_url: `${baseUrl}/${rel}` };
  }

  const raw = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
    resource_type: resourceType,
    overwrite: true,
  });

  const r = raw as { public_id?: string; secure_url?: string; version?: number; format?: string };

  return {
    public_id: r.public_id ?? newPublicId,
    secure_url: r.secure_url,
    version: r.version,
    format: r.format,
  };
}
