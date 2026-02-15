// =============================================================
// FILE: src/app.ts
// FIX: Audit module single-entry mount (registerAudit) + remove duplicate stream mount
// =============================================================

import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import authPlugin from './plugins/authPlugin';
import mysqlPlugin from '@/plugins/mysql';
import staticUploads from './plugins/staticUploads';
import { localeMiddleware } from '@/common/middleware/locale';

import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';

// Public modüller
import { registerAuth } from '@/modules/auth/router';
import { registerStorage } from '@/modules/storage/router';
import { registerProfiles } from '@/modules/profiles/router';
import { registerCustomPages } from '@/modules/customPages/router';
import { registerSiteSettings } from '@/modules/siteSettings/router';
import { registerUserRoles } from '@/modules/userRoles/router';
import { registerFaqs } from '@/modules/faqs/router';
import { registerServices } from '@/modules/services/router';
import { registerMenuItems } from '@/modules/menuItems/router';
import { registerSlider } from '@/modules/slider/router';
import { registerContacts } from '@/modules/contact/router';
import { registerEmailTemplates } from '@/modules/email-templates/router';
import { registerMail } from '@/modules/mail/router';
import { registerFooterSections } from '@/modules/footerSections/router';
import { registerNewsletter } from '@/modules/newsletter/router';
import { registerNotifications } from '@/modules/notifications/router';
import { registerReviews } from '@/modules/review/router';
import { registerSupport } from '@/modules/support/router';
import { registerBookings } from '@/modules/bookings/router';
import { registerAvailability } from '@/modules/availability/router';
import { registerResources } from '@/modules/resources/router';
import { registerChat } from '@/modules/chat/router';

// ✅ Audit: plugin + admin routes ayrı import
import { requestLoggerPlugin } from '@/modules/audit/requestLogger.plugin';
import { registerAuditAdmin } from '@/modules/audit/admin.routes';
import { registerAuditStream } from '@/modules/audit/stream.routes';

// Admin modüller
import { registerCustomPagesAdmin } from '@/modules/customPages/admin.routes';
import { registerSiteSettingsAdmin } from '@/modules/siteSettings/admin.routes';
import { registerUserAdmin } from '@/modules/auth/admin.routes';
import { registerFaqsAdmin } from '@/modules/faqs/admin.routes';
import { registerServicesAdmin } from '@/modules/services/admin.routes';
import { registerStorageAdmin } from '@/modules/storage/admin.routes';
import { registerMenuItemsAdmin } from '@/modules/menuItems/admin.routes';
import { registerSliderAdmin } from '@/modules/slider/admin.routes';
import { registerContactsAdmin } from '@/modules/contact/admin.routes';
import { registerDbAdmin } from '@/modules/db_admin/admin.routes';
import { registerEmailTemplatesAdmin } from '@/modules/email-templates/admin.routes';
import { registerFooterSectionsAdmin } from '@/modules/footerSections/admin.routes';
import { registerNewsletterAdmin } from '@/modules/newsletter/admin.routes';
import { registerReviewsAdmin } from '@/modules/review/admin.routes';
import { registerSupportAdmin } from '@/modules/support/admin.routes';
import { registerDashboardAdmin } from '@/modules/dashboard/admin.routes';
import { registerBookingsAdmin } from '@/modules/bookings/admin.routes';
import { registerAvailabilityAdmin } from '@/modules/availability/admin.routes';
import { registerResourcesAdmin } from '@/modules/resources/admin.routes';
import { registerReportsAdmin } from '@/modules/reports/admin.routes';
import { registerTelegram } from '@/modules/telegram/router';
import { registerTelegramAdmin } from '@/modules/telegram/admin.routes';
import { registerChatAdmin } from '@/modules/chat/admin.routes';


function parseCorsOrigins(v?: string | string[]): boolean | string[] {
  if (!v) return true;
  if (Array.isArray(v)) return v;
  const s = String(v).trim();
  if (!s) return true;
  const arr = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return arr.length ? arr : true;
}

export async function createApp() {
  const { default: buildFastify } = (await import('fastify')) as unknown as {
    default: (opts?: Parameters<FastifyInstance['log']['child']>[0]) => FastifyInstance;
  };

  const app = buildFastify({
    logger: env.NODE_ENV !== 'production',
  }) as FastifyInstance;

  await app.register(cors, {
    origin: parseCorsOrigins(env.CORS_ORIGIN as any),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-lang',
      'Prefer',
      'Accept',
      'Accept-Language',
      'X-Locale',
      'x-skip-auth',
      'Range',
    ],
    exposedHeaders: ['x-total-count', 'content-range', 'range'],
  });

  const cookieSecret =
    (globalThis as any).Bun?.env?.COOKIE_SECRET ?? process.env.COOKIE_SECRET ?? 'cookie-secret';

  await app.register(cookie, {
    secret: cookieSecret,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      path: '/',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
    },
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
  });

  app.addHook('onRequest', localeMiddleware);

  await app.register(authPlugin);
  await app.register(mysqlPlugin);

  app.get('/health', async () => ({ ok: true }));

  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  await app.register(staticUploads);

  await app.register(
    async (api) => {
      api.get('/health', async () => ({ ok: true }));

      // ✅ Audit request logger — /api scope'unda TÜM istekleri loglar
      // Direkt çağrı: encapsulation bypass (register değil, doğrudan hook)
      await requestLoggerPlugin(api, {});

      // Audit admin endpoints + SSE stream
      await api.register(async (i) => {
        await registerAuditAdmin(i);
        await registerAuditStream(i);
      }, { prefix: '/admin' });
      await api.register(async (i) => registerCustomPagesAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerSiteSettingsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerUserAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerFaqsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerServicesAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerStorageAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerMenuItemsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerSliderAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerContactsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerDbAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerEmailTemplatesAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerFooterSectionsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerNewsletterAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerReviewsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerSupportAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerDashboardAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerBookingsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerAvailabilityAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerResourcesAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerReportsAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerChatAdmin(i), { prefix: '/admin' });
      await api.register(async (i) => registerTelegramAdmin(i), { prefix: '/admin' });

      // --- Public modüller: /api/...
      await registerAuth(api);
      await registerStorage(api);
      await registerProfiles(api);
      await registerCustomPages(api);
      await registerSiteSettings(api);
      await registerUserRoles(api);
      await registerFaqs(api);
      await registerServices(api);
      await registerMenuItems(api);
      await registerSlider(api);
      await registerContacts(api);
      await registerEmailTemplates(api);
      await registerMail(api);
      await registerFooterSections(api);
      await registerNewsletter(api);
      await registerNotifications(api);
      await registerReviews(api);
      await registerSupport(api);
      await registerBookings(api);
      await registerAvailability(api);
      await registerResources(api);
      await registerTelegram(api);
      await registerChat(api);
    },
    { prefix: '/api' },
  );

  registerErrorHandlers(app);
  return app;
}
