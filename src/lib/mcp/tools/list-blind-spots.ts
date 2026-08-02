import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { localized, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_blind_spots",
  title: "List blind spots",
  description:
    "List AI-detected blind spots for one project, with priority, confidence, consequences and recommended actions.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project id."),
    status: z.string().optional().describe("Optional status filter: 'unaddressed', 'acknowledged' or 'addressed'."),
    priority: z.string().optional().describe("Optional priority filter: 'high', 'medium' or 'low'."),
    language: z.string().optional().describe("Language for text fields: 'en' or 'da'. Defaults to 'en'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, status, priority, language }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("blind_spots")
      .select("id, project_id, title, description, priority, confidence, consequences, recommendations, status, detected_at")
      .eq("project_id", project_id)
      .order("detected_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const blindSpots = (data ?? []).map((b) => ({
      id: b.id,
      project_id: b.project_id,
      title: localized(b.title, language),
      description: localized(b.description, language),
      priority: b.priority,
      confidence: b.confidence,
      consequences: b.consequences,
      recommendations: b.recommendations,
      status: b.status,
      detected_at: b.detected_at,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(blindSpots, null, 2) }],
      structuredContent: { blind_spots: blindSpots, count: blindSpots.length },
    };
  },
});
