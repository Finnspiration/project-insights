import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { localized, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_project",
  title: "Get project details",
  description:
    "Get one PRISM project in full: morphological assessment (12 dimensions), DNA code, detected patterns and Theory-U analysis.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project id."),
    language: z.string().optional().describe("Language for names/descriptions: 'en' or 'da'. Defaults to 'en'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, language }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return { content: [{ type: "text", text: "Project not found." }], isError: true };
    }

    const project = {
      id: data.id,
      name: localized(data.name, language),
      description: localized(data.description, language),
      status: data.status,
      dna_code: data.dna_code,
      team_size: data.team_size,
      timeline_start: data.timeline_start,
      timeline_end: data.timeline_end,
      morphology: data.morphology,
      patterns: data.patterns,
      theory_u_analysis: data.theory_u_analysis,
      is_demo: data.is_demo,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
      structuredContent: { project },
    };
  },
});
