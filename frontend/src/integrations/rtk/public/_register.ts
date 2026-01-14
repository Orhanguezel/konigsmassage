// =============================================================
// FILE: src/integrations/rtk/endpoints/_register.ts
// konigsmassage RTK Query endpoint registry (single import point)
//  - IMPORTANT: Import this file EXACTLY ONCE in app bootstrap
// =============================================================

/**
 * Bu dosya RTK Query injectEndpoints çağrılarını tek yerde toplar.
 * Komponentler endpoints/*.ts dosyalarını import ETMEMELİ.
 * Hook importları için ayrı "hooks" (barrel) dosyası kullanın.
 */

// Auth
import './auth.endpoints';

// Public
import './reviews.public.endpoints';
import './services.public.endpoints';
import './storage_public.endpoints';

// Content / Public-Admin shared
import './custom_pages.endpoints';
import './sliders.endpoints';
import './contacts.endpoints';

// Admin/Settings/Infra
import './site_settings.endpoints';
import './email_templates.endpoints';
import './faqs.endpoints';
import './menu_items.endpoints';
import './footer_sections.endpoints';
import './notifications.endpoints';
import './mail.endpoints';
import './profiles.endpoints';
import './user_roles.endpoints';
import './health.endpoints';

import './availability.endpoints';
import './resources.endpoints';
import './bookings_public.endpoints';
