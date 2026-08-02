import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_blind_spot_status",
  title: "Update blind spot status",
  description:
    "Set a blind spot's status to unaddressed, acknowledged or addressed for the signed-in user's project.",
  inputSchema: {
    blind_spot_id: z.string().uuid().describe("The blind spot id."),
    status: z
      .enum(["unaddressed", "acknowledged", "addressed"])
      .describe("The new status."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ blind_spot_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("blind_spots")
      .update({
        status,
        addressed_at: status === "addressed" ? new Date().toISOString() : null,
      })
      .eq("id", blind_spot_id)
      .select("id, status, addressed_at")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return { content: [{ type: "text", text: "Blind spot not found." }], isError: true };
    }

    return {
      content: [{ type: "text", text: `Blind spot ${data.id} is now ${data.status}.` }],
      structuredContent: { blind_spot: data },
    };
  },
});
