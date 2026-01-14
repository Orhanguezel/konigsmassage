// =============================================================
// FILE: src/modules/slider/router.ts  (PUBLIC ROUTES ONLY)
// =============================================================
import type { FastifyInstance } from "fastify";
import { listPublicSlides, getPublicSlide } from "./controller";

export async function registerSlider(app: FastifyInstance) {
  // LIST
  app.get(
    "/sliders",
    {
      config: {
        public: true,
        rateLimit: { max: 120, timeWindow: "1 minute" },
      },
    },
    listPublicSlides,
  );

  // DETAIL (slug + locale)
  app.get(
    "/sliders/:idOrSlug",
    {
      config: {
        public: true,
        rateLimit: { max: 120, timeWindow: "1 minute" },
      },
    },
    getPublicSlide,
  );
}
