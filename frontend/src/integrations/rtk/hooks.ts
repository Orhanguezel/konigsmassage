// =============================================================
// FILE: src/integrations/rtk/hooks.ts
// Barrel exports for RTK Query hooks
// =============================================================

// Auth
export * from './public/auth.endpoints';

// Public
export * from './public/reviews.public.endpoints';
export * from './public/services.public.endpoints';
export * from './public/storage_public.endpoints';


// Content / shared
export * from './public/custom_pages.endpoints';
export * from './public/sliders.endpoints';
export * from './public/contacts.endpoints';

// Admin/Settings/Infra
export * from './public/site_settings.endpoints';
export * from './public/email_templates.endpoints';
export * from './public/faqs.endpoints';
export * from './public/menu_items.endpoints';
export * from './public/footer_sections.endpoints';
export * from './public/notifications.endpoints';
export * from './public/mail.endpoints';
export * from './public/profiles.endpoints';
export * from './public/user_roles.endpoints';
export * from './public/health.endpoints';
export * from './public/availability.endpoints';
export * from './public/bookings_public.endpoints';
export * from './public/resources.endpoints';

// =============================================================
// Admin – konigsmassage
// Buradan sonrası sadece admin RTK endpoint hook’ları
// =============================================================

// Core / Auth / Dashboard
export * from './admin/auth.admin.endpoints';
export * from './admin/dashboard_admin.endpoints';
export * from './admin/db_admin.endpoints';



// Content / CMS
export * from './admin/services_admin.endpoints';
export * from './admin/reviews_admin.endpoints';
export * from './admin/sliders_admin.endpoints';
export * from './admin/faqs_admin.endpoints';
export * from './admin/custom_pages_admin.endpoints';
export * from './admin/menu_items_admin.endpoints';
export * from './admin/footer_sections_admin.endpoints';

// Communication / Contacts / Newsletter / Support
export * from './admin/contacts_admin.endpoints';
export * from './admin/email_templates_admin.endpoints';

// System / Storage / Users / Settings
export * from './admin/site_settings_admin.endpoints';
export * from './admin/storage_admin.endpoints';
export * from './admin/users_admin.endpoints';
export * from './admin/audit_admin.endpoints';

// Availability / Resources / Bookings
export * from './admin/availability_admin.endpoints';
export * from './admin/resources_admin.endpoints';
export * from './admin/bookings_admin.endpoints';
