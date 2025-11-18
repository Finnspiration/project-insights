// IDG Score Aggregation Utilities
// Calculates average IDG scores from processed documents

export interface IDGScores {
  being: number;
  thinking: number;
  relating: number;
  collaborating: number;
  acting: number;
}

export interface Document {
  id: string;
  metadata?: any;
  processed?: boolean;
}

/**
 * Aggregates IDG scores from all processed documents
 * Returns average scores or defaults if no documents with IDG analysis exist
 */
export function aggregateIDGScoresFromDocuments(documents: Document[]): IDGScores {
  const processedDocs = documents?.filter(
    doc => doc.processed && doc.metadata?.idgAnalysis
  ) || [];

  if (processedDocs.length === 0) {
    // Return defaults if no processed documents with IDG analysis
    return {
      being: 5,
      thinking: 5,
      relating: 5,
      collaborating: 5,
      acting: 5
    };
  }

  // Sum all scores
  const totals = {
    being: 0,
    thinking: 0,
    relating: 0,
    collaborating: 0,
    acting: 0
  };

  processedDocs.forEach(doc => {
    const idg = doc.metadata?.idgAnalysis;
    if (idg) {
      totals.being += idg.being || 5;
      totals.thinking += idg.thinking || 5;
      totals.relating += idg.relating || 5;
      totals.collaborating += idg.collaborating || 5;
      totals.acting += idg.acting || 5;
    }
  });

  // Calculate averages
  const count = processedDocs.length;
  return {
    being: Math.round(totals.being / count),
    thinking: Math.round(totals.thinking / count),
    relating: Math.round(totals.relating / count),
    collaborating: Math.round(totals.collaborating / count),
    acting: Math.round(totals.acting / count)
  };
}

/**
 * Checks if there are any processed documents with IDG analysis
 */
export function hasIDGAnalysis(documents: Document[]): boolean {
  return documents?.some(
    doc => doc.processed && doc.metadata?.idgAnalysis
  ) || false;
}
