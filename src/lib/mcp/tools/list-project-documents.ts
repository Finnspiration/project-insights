import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

const MAX_CONTENT_CHARS = 8000;

export default defineTool({
  name: "list_project_documents",
  title: "List project documents",
  description:
    "List the documents uploaded to a project. Optionally include the extracted text content (truncated per document).",
  inputSchema: {
    project_id: z.string().uuid().describe("The project id."),
    include_content: z
      .boolean()
      .optional()
      .describe("Include extracted text content for each processed document. Defaults to false."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, include_content }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("documents")
      .select("id, filename, file_type, file_size, processed, language, metadata, uploaded_at, content")
      .eq("project_id", project_id)
      .order("uploaded_at", { ascending: false });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const documents = (data ?? []).map((d) => {
      const base = {
        id: d.id,
        filename: d.filename,
        file_type: d.file_type,
        file_size: d.file_size,
        processed: d.processed,
        language: d.language,
        metadata: d.metadata,
        uploaded_at: d.uploaded_at,
      };
      if (!include_content) return base;
      const content = d.content ?? "";
      return {
        ...base,
        content:
          content.length > MAX_CONTENT_CHARS
            ? `${content.slice(0, MAX_CONTENT_CHARS)}... [truncated]`
            : content,
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(documents, null, 2) }],
      structuredContent: { documents, count: documents.length },
    };
  },
});
