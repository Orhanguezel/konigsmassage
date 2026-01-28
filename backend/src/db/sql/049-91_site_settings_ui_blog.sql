-- =============================================================
-- 049-91_site_settings_ui_blog.sql
-- konigsmassage – UI Blog (site_settings.ui_blog)
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Extendable: clone from tr as bootstrap (collation-safe)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_blog',
  'tr',
  CAST(JSON_OBJECT(
    'ui_blog_page_title',               'Blog',
    'ui_blog_detail_page_title',        'Blog Detayı',

    'ui_blog_loading',                  'Yükleniyor...',
    'ui_blog_not_found',                'Blog içeriği bulunamadı.',
    'ui_blog_content_soon',             'İçerik yakında eklenecek.',
    'ui_blog_author_fallback',          'konigsmassage',
    'ui_blog_author_role_fallback',     'Blog Admin',

    'ui_blog_highlights_title',         'Öne Çıkanlar',

    'ui_blog_tags_title',               'Etiketler:',

    'ui_blog_prev_post',                'Önceki Yazı',
    'ui_blog_next_post',                'Sonraki Yazı',

    'ui_blog_leave_comment',            'Yorum Bırak',
    'ui_blog_comment_placeholder',      'Yazmaya başlayın...',
    'ui_blog_comment_name_placeholder', 'adınız',
    'ui_blog_comment_email_placeholder','e-posta adresiniz',
    'ui_blog_comment_submit',           'Yorum Gönder',
    'ui_blog_filter_all',               'Tümü'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_blog',
  'en',
  CAST(JSON_OBJECT(
    'ui_blog_page_title',               'Blog',
    'ui_blog_detail_page_title',        'Blog Detail',

    'ui_blog_loading',                  'Loading...',
    'ui_blog_not_found',                'Blog post not found.',
    'ui_blog_content_soon',             'Content will be added soon.',
    'ui_blog_author_fallback',          'konigsmassage',
    'ui_blog_author_role_fallback',     'Blog Admin',

    'ui_blog_highlights_title',         'Highlights',

    'ui_blog_tags_title',               'Tags:',

    'ui_blog_prev_post',                'Previous Post',
    'ui_blog_next_post',                'Next Post',

    'ui_blog_leave_comment',            'Leave A Comment',
    'ui_blog_comment_placeholder',      'Start type...',
    'ui_blog_comment_name_placeholder', 'your name',
    'ui_blog_comment_email_placeholder','your email',
    'ui_blog_comment_submit',           'Post Comment',
    'ui_blog_filter_all',               'All'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_blog',
  'de',
  CAST(JSON_OBJECT(
    'ui_blog_page_title',               'Blog',
    'ui_blog_detail_page_title',        'Blogdetails',

    'ui_blog_loading',                  'Wird geladen...',
    'ui_blog_not_found',                'Blogbeitrag nicht gefunden.',
    'ui_blog_content_soon',             'Inhalt wird in Kürze hinzugefügt.',
    'ui_blog_author_fallback',          'konigsmassage',
    'ui_blog_author_role_fallback',     'Blog-Admin',

    'ui_blog_highlights_title',         'Highlights',

    'ui_blog_tags_title',               'Tags:',

    'ui_blog_prev_post',                'Vorheriger Beitrag',
    'ui_blog_next_post',                'Nächster Beitrag',

    'ui_blog_leave_comment',            'Kommentar hinterlassen',
    'ui_blog_comment_placeholder',      'Beginnen Sie zu schreiben...',
    'ui_blog_comment_name_placeholder', 'Ihr Name',
    'ui_blog_comment_email_placeholder','Ihre E-Mail',
    'ui_blog_comment_submit',           'Kommentar senden',
    'ui_blog_filter_all',               'Alle'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);