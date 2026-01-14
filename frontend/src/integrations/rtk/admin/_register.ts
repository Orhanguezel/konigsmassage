// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/_register.ts
// konigsmassage Admin RTK Query endpoint registry (single import point)
//  - IMPORTANT: Import this file EXACTLY ONCE in admin bootstrap
// =============================================================

/**
 * Admin tarafındaki RTK Query injectEndpoints importlarını tek yerde toplar.
 * Admin component'leri endpoints/admin/*.ts dosyalarını import etmemeli.
 * Hook exportları için hooks.ts (barrel) kullanılacak.
 */

// -------------------------
// Core / Auth / Dashboard
// -------------------------
import './auth.admin.endpoints';
import './dashboard_admin.endpoints';
import './db_admin.endpoints';



// -------------------------
// Content / CMS (Site içeriği)
// -------------------------

import './services_admin.endpoints';
import './reviews_admin.endpoints';
import './sliders_admin.endpoints';
import './faqs_admin.endpoints';
import './custom_pages_admin.endpoints';
import './menu_items_admin.endpoints';
import './footer_sections_admin.endpoints';

// -------------------------
// Communication / Contacts / Newsletter
// -------------------------
import './contacts_admin.endpoints';
import './newsletter_admin.endpoints';
import './email_templates_admin.endpoints';

// -------------------------
// System / Infra
// -------------------------
import './site_settings_admin.endpoints';
import './storage_admin.endpoints';
import './users_admin.endpoints';
import './audit_admin.endpoints';

import './availability_admin.endpoints';
import './resources_admin.endpoints';
import './bookings_admin.endpoints';
