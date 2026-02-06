export interface Project {
  id: string;
  name: { en: string; da: string };
  description?: { en: string; da: string };
  timeline_start?: string;
  timeline_end?: string;
  team_size?: number;
  status: string;
  dna_code?: string;
  morphology?: any;
  patterns?: any;
  theory_u_analysis?: any;
  created_at?: string;
  updated_at?: string;
}
