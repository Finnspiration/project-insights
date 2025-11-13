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
    const { documentId } = await req.json();
    
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing document:', documentId);

    // Fetch document metadata
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found');
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-documents')
      .download(doc.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document');
    }

    console.log('Downloaded document, size:', fileData.size);

    let extractedText = '';
    let detectedLanguage = 'en';

    // Extract text based on file type
    if (doc.file_type === 'application/pdf') {
      // For PDFs, use a simple text extraction approach
      // In production, you'd use a proper PDF parsing library
      const arrayBuffer = await fileData.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      
      // Simple extraction - looks for readable text between PDF markers
      const textMatches = text.match(/\/T\s*\((.*?)\)/g) || [];
      extractedText = textMatches
        .map(match => match.replace(/\/T\s*\(|\)/g, ''))
        .join(' ')
        .slice(0, 50000); // Limit to 50k chars
      
    } else if (doc.file_type === 'text/plain' || doc.file_type === 'text/markdown') {
      extractedText = await fileData.text();
      
    } else if (doc.file_type?.includes('word') || doc.file_type?.includes('document')) {
      // For Word docs, extract what we can
      const arrayBuffer = await fileData.arrayBuffer();
      const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
      extractedText = text.replace(/[^\x20-\x7E\n\r]/g, ' ').slice(0, 50000);
      
    } else {
      // Generic text extraction attempt
      try {
        extractedText = await fileData.text();
      } catch {
        const arrayBuffer = await fileData.arrayBuffer();
        extractedText = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
      }
    }

    console.log('Extracted text length:', extractedText.length);

    // Detect language using Claude if we have content
    if (extractedText.length > 100) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (LOVABLE_API_KEY) {
        try {
          const langResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'user',
                  content: `Detect the language of this text. Reply with ONLY the two-letter language code (en, da, de, fr, etc.):\n\n${extractedText.slice(0, 1000)}`
                }
              ],
              max_tokens: 10,
            }),
          });

          if (langResponse.ok) {
            const langData = await langResponse.json();
            const langCode = langData.choices?.[0]?.message?.content?.trim().toLowerCase();
            if (langCode && langCode.length === 2) {
              detectedLanguage = langCode;
            }
          }
        } catch (err) {
          console.error('Language detection failed:', err);
        }
      }
    }

    console.log('Detected language:', detectedLanguage);

    // Update document with extracted content
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        content: extractedText,
        processed: true,
        language: detectedLanguage,
        metadata: {
          processed_at: new Date().toISOString(),
          text_length: extractedText.length,
        }
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    console.log('Document processing complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        textLength: extractedText.length,
        language: detectedLanguage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});