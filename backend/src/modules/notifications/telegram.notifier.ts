// ===================================================================
// FILE: src/modules/notifications/telegram.notifier.ts
// FINAL — Telegram Notifier (sendMessage) — fetch tabanli, deps yok
// Node 18+ global fetch
// ===================================================================

export type TelegramNotifyInput = {
  title: string;
  message: string;
  type: string;
  createdAt?: Date;
};

type EnvCfg = {
  enabled: boolean;
  botToken: string;
  chatId: string;
  allowedTypes: string[]; // boş ise hepsi
};

function getEnvCfg(): EnvCfg {
  const enabled = String(process.env.TELEGRAM_NOTIFICATIONS_ENABLED ?? '0') === '1';

  const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID ?? '').trim();

  const allowedTypesRaw = String(process.env.TELEGRAM_NOTIFY_TYPES ?? '').trim();
  const allowedTypes = allowedTypesRaw
    ? allowedTypesRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return { enabled, botToken, chatId, allowedTypes };
}

const lastSentAtByKey = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30_000;

function shouldSend(cfg: EnvCfg, input: TelegramNotifyInput): boolean {
  if (!cfg.enabled) return false;
  if (!cfg.botToken || !cfg.chatId) return false;

  if (cfg.allowedTypes.length > 0 && !cfg.allowedTypes.includes(input.type)) {
    return false;
  }

  const key = `${input.type}::${input.title}::${input.message}`.slice(0, 500);
  const now = Date.now();
  const last = lastSentAtByKey.get(key);

  if (last && now - last < DEDUPE_WINDOW_MS) return false;
  lastSentAtByKey.set(key, now);
  return true;
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function buildText(input: TelegramNotifyInput): string {
  const dt = input.createdAt ? input.createdAt.toISOString() : new Date().toISOString();

  const title = escapeHtml(input.title);
  const msg = escapeHtml(input.message);

  return [
    `<b>[${escapeHtml(input.type)}]</b> ${title}`,
    '',
    msg,
    '',
    `<i>${escapeHtml(dt)}</i>`,
  ].join('\n');
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function telegramNotify(
  input: TelegramNotifyInput,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getEnvCfg();
  if (!shouldSend(cfg, input)) return { ok: false, error: 'disabled_or_filtered' };

  const url = `https://api.telegram.org/bot${cfg.botToken}/sendMessage`;

  const payload = {
    chat_id: cfg.chatId,
    text: buildText(input),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      },
      10_000,
    );

    if (!res.ok) {
      // Telegram genelde JSON döner: { ok:false, description:"..." }
      let desc = `http_${res.status}`;
      try {
        const j = (await res.json()) as { description?: string };
        if (j?.description) desc = j.description;
      } catch {
        // ignore
      }
      return { ok: false, error: desc };
    }

    return { ok: true };
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'timeout' : e?.message || 'telegram_send_failed';
    return { ok: false, error: String(msg) };
  }
}
