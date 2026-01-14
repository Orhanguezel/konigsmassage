import type { FastifyInstance } from 'fastify';
import {
  listSiteSettings,
  getSiteSettingByKey,
  getAppLocalesPublic,
  getDefaultLocalePublic,
} from './controller';

const BASE = '/site_settings';

export async function registerSiteSettings(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { public: true } }, listSiteSettings);

  // ✅ META önce
  app.get(`${BASE}/app-locales`, { config: { public: true } }, getAppLocalesPublic);
  app.get(`${BASE}/default-locale`, { config: { public: true } }, getDefaultLocalePublic);

  // ✅ En sona param route
  app.get(`${BASE}/:key`, { config: { public: true } }, getSiteSettingByKey);
}

