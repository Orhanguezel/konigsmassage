# Telegram Template Keys

`site_settings` keys used by `src/modules/telegram`:

## Required base keys
- `telegram_notifications_enabled` (`true|false`)
- `telegram_webhook_enabled` (`true|false`)
- `telegram_bot_token`
- `telegram_default_chat_id`

## Event enable flags
- `telegram_event_new_order_enabled`
- `telegram_event_new_ticket_enabled`
- `telegram_event_ticket_replied_enabled`
- `telegram_event_new_payment_request_enabled`
- `telegram_event_new_deposit_request_enabled`
- `telegram_event_deposit_approved_enabled`

## Event templates
- `telegram_template_new_order`
- `telegram_template_new_ticket`
- `telegram_template_ticket_replied`
- `telegram_template_new_payment_request`
- `telegram_template_new_deposit_request`
- `telegram_template_deposit_approved`

## Placeholders by event
- `new_order`: `order_number`, `customer_name`, `customer_email`, `final_amount`, `order_items`, `created_at`
- `new_ticket`: `user_name`, `subject`, `priority`, `message`, `created_at`
- `ticket_replied`: `user_name`, `subject`, `priority`, `message`, `created_at`
- `new_payment_request`: `order_number`, `customer_name`, `customer_email`, `amount`, `payment_method`, `order_items`, `created_at`
- `new_deposit_request`: `user_name`, `amount`, `payment_method`, `created_at`
- `deposit_approved`: `user_name`, `amount`, `created_at`

## Notes
- Generic notifications (`title + message`) do not require template keys.
- Values can be set with locale `*` for global defaults.
- Markdown parse mode is enabled in Telegram send.
