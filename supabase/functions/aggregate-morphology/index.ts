import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Aggregating morphology for project:', projectId);

    // Fetch all processed documents with individual analysis
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('processed', true);

    if (docError) {
      throw docError;
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ 
          aggregatedMorphology: null,
          message: 'No processed documents found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${documents.length} processed documents`);

    // Extract all morphology suggestions with their metadata
    const documentSuggestions = documents
      .filter(doc => doc.metadata?.morphologySuggestions && doc.metadata?.sourceDocument?.analyzedIndividually)
      .map(doc => ({
        filename: doc.filename,
        suggestions: doc.metadata.morphologySuggestions,
        confidence: doc.metadata.overallConfidence || 0
      }));

    if (documentSuggestions.length === 0) {
      return new Response(
        JSON.stringify({ 
          aggregatedMorphology: null,
          message: 'No individually analyzed documents found. Please re-analyze documents first.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Aggregating ${documentSuggestions.length} individual document analyses`);

    // All possible dimensions
    const dimensions = [
      'complexity', 'stakeholder', 'knowledge', 'cultural', 'temporal',
      'organizational', 'challenge', 'development', 'resources', 
      'change', 'information', 'risk'
    ];

    // Aggregate each dimension
    const aggregatedMorphology: any = {};
    const aggregationDetails: any = {};

    for (const dimension of dimensions) {
      // Collect all suggestions for this dimension across documents
      const dimensionData: Array<{
        value: string;
        confidence: number;
        filename: string;
        evidence: string;
      }> = [];

      for (const docData of documentSuggestions) {
        const suggestion = docData.suggestions[dimension];
        if (suggestion?.value && suggestion?.confidence) {
          dimensionData.push({
            value: suggestion.value,
            confidence: suggestion.confidence,
            filename: docData.filename,
            evidence: suggestion.evidence || ''
          });
        }
      }

      if (dimensionData.length === 0) continue;

      // Group by value and calculate weighted scores
      const valueScores: Record<string, {
        totalWeight: number;
        count: number;
        sources: Array<{ filename: string; confidence: number; evidence: string }>;
      }> = {};

      for (const data of dimensionData) {
        if (!valueScores[data.value]) {
          valueScores[data.value] = {
            totalWeight: 0,
            count: 0,
            sources: []
          };
        }
        
        valueScores[data.value].totalWeight += data.confidence;
        valueScores[data.value].count += 1;
        valueScores[data.value].sources.push({
          filename: data.filename,
          confidence: data.confidence,
          evidence: data.evidence
        });
      }

      // Calculate weighted average for each value
      const rankedValues = Object.entries(valueScores)
        .map(([value, stats]) => ({
          value,
          avgConfidence: stats.totalWeight / stats.count,
          documentCount: stats.count,
          totalWeight: stats.totalWeight,
          sources: stats.sources
        }))
        .sort((a, b) => b.totalWeight - a.totalWeight);

      // Select the top-ranked value
      const winner = rankedValues[0];
      
      aggregatedMorphology[dimension] = winner.value;
      
      aggregationDetails[dimension] = {
        selectedValue: winner.value,
        confidence: winner.avgConfidence,
        supportingDocuments: winner.documentCount,
        totalDocuments: documentSuggestions.length,
        agreement: winner.documentCount / documentSuggestions.length,
        alternatives: rankedValues.slice(1, 3).map(r => ({
          value: r.value,
          confidence: r.avgConfidence,
          documentCount: r.documentCount
        })),
        sources: winner.sources
      };
    }

    // Calculate overall aggregation confidence
    const allConfidences = Object.values(aggregationDetails)
      .map((d: any) => d.confidence);
    const overallConfidence = allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0;

    // Calculate agreement score (how many documents agree on each dimension)
    const agreementScores = Object.values(aggregationDetails)
      .map((d: any) => d.agreement);
    const overallAgreement = agreementScores.length > 0
      ? agreementScores.reduce((a, b) => a + b, 0) / agreementScores.length
      : 0;

    // Generate DNA code
    const dimensionOrder = [
      'complexity', 'stakeholder', 'knowledge', 'cultural', 'temporal',
      'organizational', 'challenge', 'development', 'resources', 
      'change', 'information', 'risk'
    ];
    
    const dnaCode = dimensionOrder
      .map(dim => aggregatedMorphology[dim])
      .filter(Boolean)
      .join('-');

    console.log(`Aggregation complete. Overall confidence: ${(overallConfidence * 100).toFixed(1)}%`);
    console.log(`Overall agreement: ${(overallAgreement * 100).toFixed(1)}%`);

    // Update project with aggregated morphology
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        morphology: aggregatedMorphology,
        dna_code: dnaCode,
        patterns: {
          aggregationMetadata: {
            method: 'weighted_confidence',
            analyzedDocuments: documentSuggestions.length,
            totalDocuments: documents.length,
            overallConfidence: overallConfidence,
            overallAgreement: overallAgreement,
            aggregatedAt: new Date().toISOString(),
            details: aggregationDetails
          }
        }
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Failed to update project:', updateError);
      throw updateError;
    }

    console.log('Project updated with aggregated morphology');

    return new Response(
      JSON.stringify({
        aggregatedMorphology,
        dnaCode,
        metadata: {
          analyzedDocuments: documentSuggestions.length,
          totalDocuments: documents.length,
          overallConfidence,
          overallAgreement,
          dimensionDetails: aggregationDetails
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error aggregating morphology:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
