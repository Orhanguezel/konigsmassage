// =============================================================
// FILE: src/modules/popups/controller.ts  — Public
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import { repoListPublic } from "./repository";
import { publicListQuerySchema } from "./validation";
import type { PopupRow } from "./schema";

type PopupRowPublic = Omit<PopupRow, "target_paths"> & { target_paths?: string[] };
import { resolveRequestLocales } from "@/modules/_shared";

type PopupData = {
  id:        number;
  type:      string;
  title:     string;
  content:   string | null;
  target_paths: string[];
  image:     string | null;
  alt:       string | null;
  background_color:   string | null;
  text_color:         string | null;
  button_text:        string | null;
  button_color:       string | null;
  button_hover_color: string | null;
  button_text_color:  string | null;
  link_url:           string | null;
  link_target:        string;
  text_behavior:      string;
  scroll_speed:       number;
  closeable:          boolean;
  delay_seconds:      number;
  display_frequency:  string;
  order:              number;
};

function rowToPublic(row: PopupRowPublic, imageUrl: string | null): PopupData {
  return {
    id:                 row.id,
    type:               row.type,
    title:              row.title,
    content:            row.content ?? null,
    target_paths:       Array.isArray(row.target_paths) ? row.target_paths : [],
    image:              imageUrl,
    alt:                row.alt ?? null,
    background_color:   row.background_color ?? null,
    text_color:         row.text_color ?? null,
    button_text:        row.button_text ?? null,
    button_color:       row.button_color ?? null,
    button_hover_color: row.button_hover_color ?? null,
    button_text_color:  row.button_text_color ?? null,
    link_url:           row.link_url ?? null,
    link_target:        row.link_target,
    text_behavior:      row.text_behavior,
    scroll_speed:       row.scroll_speed,
    closeable:          row.closeable === 1,
    delay_seconds:      row.delay_seconds,
    display_frequency:  row.display_frequency,
    order:              row.display_order,
  };
}

export async function listPopups(req: FastifyRequest, reply: FastifyReply) {
  const q = publicListQuerySchema.parse(req.query);
  const { locale, def } = await resolveRequestLocales(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  const rows = await repoListPublic({
    ...q,
    locale,
    default_locale: def,
  });

  return reply.send(
    rows.map((r) =>
      rowToPublic(
        {
          ...r.row,
          title: r.i18n.title,
          content: r.i18n.content,
          button_text: r.i18n.button_text,
          alt: r.i18n.alt,
        },
        r.image_url,
      ),
    ),
  );
}
