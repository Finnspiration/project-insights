import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { localized, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_projects",
  title: "List projects",
  description:
    "List the signed-in user's PRISM projects with their status, DNA code and whether a morphological assessment exists.",
  inputSchema: {
    status: z.string().optional().describe("Optional status filter, e.g. 'active'."),
    language: z.string().optional().describe("Language for names/descriptions: 'en' or 'da'. Defaults to 'en'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, language }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("projects")
      .select("id, name, description, status, dna_code, team_size, timeline_start, timeline_end, morphology, is_demo, updated_at")
      .order("updated_at", { ascending: false });
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const projects = (data ?? []).map((p) => ({
      id: p.id,
      name: localized(p.name, language),
      description: localized(p.description, language),
      status: p.status,
      dna_code: p.dna_code,
      team_size: p.team_size,
      timeline_start: p.timeline_start,
      timeline_end: p.timeline_end,
      assessed: !!p.morphology && Object.keys(p.morphology as object).length > 0,
      is_demo: p.is_demo,
      updated_at: p.updated_at,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      structuredContent: { projects, count: projects.length },
    };
  },
});
