import { buildDashboardKnowledgeContext } from "@/modules/dashboard/service";

export async function buildKnowledgeContext(userText: string, locale?: string) {
  return buildDashboardKnowledgeContext(userText, locale);
}
