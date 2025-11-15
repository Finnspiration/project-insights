import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { getDocument } from "https://esm.sh/pdfjs-serverless@0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Character limit for extracted text
const MAX_CHARS = 50000;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Sanitize extracted text
function sanitizeText(text: string): string {
  return text
    .replace(/\u0000/g, '') // Remove null characters
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except newlines/tabs
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Extract text from PDF
async function extractPDF(fileData: Blob): Promise<{ text: string; metadata: any }> {
  const arrayBuffer = await fileData.arrayBuffer();
  const pdfDoc = await getDocument(new Uint8Array(arrayBuffer)).promise;
  
  console.log(`PDF has ${pdfDoc.numPages} pages`);
  
  let pdfText = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    pdfText += pageText + '\n';
  }
  
  const sanitized = sanitizeText(pdfText);
  const wordCount = sanitized.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    text: sanitized.slice(0, MAX_CHARS),
    metadata: {
      extraction_method: 'pdfjs-serverless',
      page_count: pdfDoc.numPages,
      word_count: wordCount,
      character_count: sanitized.length,
      truncated: sanitized.length > MAX_CHARS,
      warnings: sanitized.length === 0 ? ['No text extracted - might be scanned/image-based PDF'] : []
    }
  };
}

// Extract text from Word (.docx)
async function extractDOCX(fileData: Blob): Promise<{ text: string; metadata: any }> {
  // Import mammoth dynamically
  const mammoth = await import('https://esm.sh/mammoth@1.8.0');
  
  const arrayBuffer = await fileData.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  const sanitized = sanitizeText(result.value);
  const wordCount = sanitized.split(/\s+/).filter(w => w.length > 0).length;
  
  const warnings = [];
  if (result.messages && result.messages.length > 0) {
    warnings.push(...result.messages.map((m: any) => m.message));
  }
  
  return {
    text: sanitized.slice(0, MAX_CHARS),
    metadata: {
      extraction_method: 'mammoth',
      word_count: wordCount,
      character_count: sanitized.length,
      truncated: sanitized.length > MAX_CHARS,
      warnings
    }
  };
}

// Extract text from Excel (.xlsx)
async function extractXLSX(fileData: Blob): Promise<{ text: string; metadata: any }> {
  // Import xlsx dynamically
  const XLSX = await import('https://esm.sh/xlsx@0.18.5');
  
  const arrayBuffer = await fileData.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  
  let extractedText = '';
  let totalRows = 0;
  
  // Extract text from all sheets
  workbook.SheetNames.forEach((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    extractedText += `\n=== Sheet ${index + 1}: ${sheetName} ===\n${csv}\n`;
    
    const rows = csv.split('\n').filter(r => r.trim().length > 0);
    totalRows += rows.length;
  });
  
  const sanitized = sanitizeText(extractedText);
  const wordCount = sanitized.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    text: sanitized.slice(0, MAX_CHARS),
    metadata: {
      extraction_method: 'xlsx',
      sheet_count: workbook.SheetNames.length,
      total_rows: totalRows,
      word_count: wordCount,
      character_count: sanitized.length,
      truncated: sanitized.length > MAX_CHARS,
      warnings: []
    }
  };
}

// Extract plain text
async function extractPlainText(fileData: Blob, fileType: string): Promise<{ text: string; metadata: any }> {
  let text: string;
  
  try {
    text = await fileData.text();
  } catch {
    // Fallback: try decoding as UTF-8
    const arrayBuffer = await fileData.arrayBuffer();
    text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
  }
  
  const sanitized = sanitizeText(text);
  const wordCount = sanitized.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    text: sanitized.slice(0, MAX_CHARS),
    metadata: {
      extraction_method: 'plain_text',
      word_count: wordCount,
      character_count: sanitized.length,
      truncated: sanitized.length > MAX_CHARS,
      warnings: []
    }
  };
}

// Main extraction function with retry logic
async function extractTextWithRetry(
  fileData: Blob,
  fileType: string,
  fileName: string
): Promise<{ text: string; metadata: any }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Extraction attempt ${attempt}/${MAX_RETRIES} for ${fileName}`);
      
      // Route to appropriate extractor based on file type
      if (fileType === 'application/pdf') {
        return await extractPDF(fileData);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword' ||
        fileName.endsWith('.docx')
      ) {
        return await extractDOCX(fileData);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel' ||
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls')
      ) {
        return await extractXLSX(fileData);
      } else if (
        fileType === 'text/plain' ||
        fileType === 'text/markdown' ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.md')
      ) {
        return await extractPlainText(fileData, fileType);
      } else {
        // Unknown type - try plain text extraction
        console.warn(`Unknown file type: ${fileType}, attempting plain text extraction`);
        return await extractPlainText(fileData, fileType);
      }
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw new Error(
    `Failed to extract text after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const processingStartTime = Date.now();

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

    // Update status to processing
    await supabase
      .from('documents')
      .update({
        metadata: {
          ...doc.metadata,
          processing_started_at: new Date().toISOString(),
          processing: true
        }
      })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-documents')
      .download(doc.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document');
    }

    console.log('Downloaded document, size:', fileData.size, 'type:', doc.file_type);

    // Extract text with retry logic
    const { text: extractedText, metadata: extractionMetadata } = await extractTextWithRetry(
      fileData,
      doc.file_type,
      doc.filename
    );

    console.log('Extracted text length:', extractedText.length);

    // Detect language using Lovable AI if we have content
    let detectedLanguage = 'en';
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

    const processingEndTime = Date.now();
    const processingDuration = processingEndTime - processingStartTime;

    // Update document with extracted content and metadata
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        content: extractedText,
        processed: true,
        language: detectedLanguage,
        metadata: {
          processing_started_at: new Date(processingStartTime).toISOString(),
          processing_completed_at: new Date(processingEndTime).toISOString(),
          processing_duration_ms: processingDuration,
          processing: false,
          ...extractionMetadata,
          detected_language: detectedLanguage
        }
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Document processing complete in ${processingDuration}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        textLength: extractedText.length,
        language: detectedLanguage,
        processingDuration,
        metadata: extractionMetadata
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Try to update document with error status
    try {
      const { documentId } = await req.json();
      if (documentId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('documents')
          .update({
            metadata: {
              processing: false,
              failed: true,
              error: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', documentId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
