import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjects from "./tools/list-projects";
import getProject from "./tools/get-project";
import listBlindSpots from "./tools/list-blind-spots";
import updateBlindSpotStatus from "./tools/update-blind-spot-status";
import listProjectDocuments from "./tools/list-project-documents";

// Must be the direct Supabase host, built from the project ref (Vite inlines
// this literal at build time, keeping the module import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "project-insights",
  title: "Project Insights",
  version: "0.1.0",
  instructions:
    "Tools for PRISM (Project Insights), a project intelligence platform. Use `list_projects` to find the signed-in user's projects, `get_project` for the 12-dimension morphological assessment, DNA code, patterns and Theory-U analysis, `list_blind_spots` for AI-detected blind spots with recommendations, `update_blind_spot_status` to mark one acknowledged or addressed, and `list_project_documents` to inspect uploaded source documents.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProjects, getProject, listBlindSpots, updateBlindSpotStatus, listProjectDocuments],
});
