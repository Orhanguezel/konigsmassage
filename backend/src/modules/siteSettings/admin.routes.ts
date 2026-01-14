// src/modules/siteSettings/admin.routes.ts

import type { FastifyInstance } from 'fastify';
import {
  adminGetSettingsAggregate,
  adminUpsertSettingsAggregate,
  adminListSiteSettings,
  adminGetSiteSettingByKey,
  adminCreateSiteSetting,
  adminUpdateSiteSetting,
  adminBulkUpsertSiteSettings,
  adminDeleteManySiteSettings,
  adminDeleteSiteSetting,
  adminGetAppLocales,
  adminGetDefaultLocale,
} from './admin.controller';

const BASE = '/site-settings'; // hyphen
const LEGACY = '/site_settings'; // underscore

export async function registerSiteSettingsAdmin(app: FastifyInstance) {
  // Aggregate
  app.get(`${BASE}`, { config: { auth: true } }, adminGetSettingsAggregate);
  app.put(`${BASE}`, { config: { auth: true } }, adminUpsertSettingsAggregate);

  // ✅ META (STATIC) - 반드시 :key öncesi
  app.get(`${BASE}/app-locales`, { config: { auth: true } }, adminGetAppLocales);
  app.get(`${BASE}/default-locale`, { config: { auth: true } }, adminGetDefaultLocale);

  // List (STATIC) - :key öncesi
  app.get(`${BASE}/list`, { config: { auth: true } }, adminListSiteSettings);

  // Granular
  app.get(`${BASE}/:key`, { config: { auth: true } }, adminGetSiteSettingByKey);
  app.post(`${BASE}`, { config: { auth: true } }, adminCreateSiteSetting);
  app.put(`${BASE}/:key`, { config: { auth: true } }, adminUpdateSiteSetting);
  app.post(`${BASE}/bulk-upsert`, { config: { auth: true } }, adminBulkUpsertSiteSettings);
  app.delete(`${BASE}`, { config: { auth: true } }, adminDeleteManySiteSettings);
  app.delete(`${BASE}/:key`, { config: { auth: true } }, adminDeleteSiteSetting);

  // ✅ Legacy yönlendirmeler (tam)
  app.get(LEGACY, { config: { auth: true } }, adminGetSettingsAggregate);
  app.put(LEGACY, { config: { auth: true } }, adminUpsertSettingsAggregate);

  app.get(`${LEGACY}/list`, { config: { auth: true } }, adminListSiteSettings);
  app.get(`${LEGACY}/app-locales`, { config: { auth: true } }, adminGetAppLocales);
  app.get(`${LEGACY}/default-locale`, { config: { auth: true } }, adminGetDefaultLocale);

  // İstersen legacy :key da ekleyebilirsin (opsiyonel)
  app.get(`${LEGACY}/:key`, { config: { auth: true } }, adminGetSiteSettingByKey);
  app.put(`${LEGACY}/:key`, { config: { auth: true } }, adminUpdateSiteSetting);
}
