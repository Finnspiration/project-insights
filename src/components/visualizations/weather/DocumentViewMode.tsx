import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Document {
  id: string;
  filename: string;
  uploaded_at: string;
  processed: boolean | null;
  metadata: any;
}

interface DocumentViewModeProps {
  projectId: string;
  onApplySuggestion?: (dimension: string, value: string) => void;
}

export function DocumentViewMode({ projectId, onApplySuggestion }: DocumentViewModeProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, uploaded_at, processed, metadata')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error(language === 'da' ? 'Kunne ikke hente dokumenter' : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('analyze-documents', {
        body: { projectId },
      });

      if (error) throw error;
      
      toast.success(language === 'da' ? 'Dokumenter genanalyseret' : 'Documents re-analyzed');
      await fetchDocuments();
    } catch (error) {
      console.error('Error re-analyzing:', error);
      toast.error(language === 'da' ? 'Genanalyse fejlede' : 'Re-analysis failed');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">
          {language === 'da' ? 'Indlæser dokumenter...' : 'Loading documents...'}
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">
          {language === 'da' 
            ? 'Ingen dokumenter uploadet endnu. Upload dokumenter for at få AI-forslag.' 
            : 'No documents uploaded yet. Upload documents to get AI suggestions.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {language === 'da' 
            ? `${documents.length} dokument${documents.length !== 1 ? 'er' : ''} uploadet`
            : `${documents.length} document${documents.length !== 1 ? 's' : ''} uploaded`}
        </p>
        <Button 
          onClick={handleReanalyze} 
          disabled={reanalyzing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${reanalyzing ? 'animate-spin' : ''}`} />
          {language === 'da' ? 'Genanalyser alle' : 'Re-analyze all'}
        </Button>
      </div>

      <Accordion type="multiple" className="w-full">
        {documents.map((doc) => {
          const suggestions = doc.metadata?.morphologySuggestions || {};
          const confidence = doc.metadata?.overallConfidence || 0;
          const hassuggestions = Object.keys(suggestions).length > 0;

          return (
            <AccordionItem key={doc.id} value={doc.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.processed && (
                      <Badge variant={confidence > 0.7 ? 'default' : 'secondary'}>
                        {Math.round(confidence * 100)}% {language === 'da' ? 'tillid' : 'confidence'}
                      </Badge>
                    )}
                    {!doc.processed && (
                      <Badge variant="outline">
                        {language === 'da' ? 'Behandler...' : 'Processing...'}
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent>
                <div className="pt-2 space-y-3">
                  {!hassuggestions && doc.processed && (
                    <p className="text-sm text-muted-foreground italic">
                      {language === 'da' 
                        ? 'Ingen morfologiske forslag fra dette dokument.'
                        : 'No morphological suggestions from this document.'}
                    </p>
                  )}

                  {hassuggestions && (
                    <div className="space-y-2">
                      {Object.entries(suggestions).map(([dimension, data]: [string, any]) => (
                        <Card key={dimension} className="border-border/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium capitalize">
                                {dimension.replace(/_/g, ' ')}
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(data.confidence * 100)}%
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {language === 'da' ? 'Foreslået værdi:' : 'Suggested value:'} 
                              <span className="font-medium ml-1">{data.value}</span>
                            </CardDescription>
                          </CardHeader>
                          {data.evidence && (
                            <CardContent className="pt-0">
                              <div className="p-2 bg-muted/30 rounded text-xs italic border-l-2 border-primary/20">
                                "{data.evidence.substring(0, 150)}..."
                              </div>
                              {onApplySuggestion && (
                                <Button
                                  onClick={() => onApplySuggestion(dimension, data.value)}
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 w-full"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {language === 'da' ? 'Anvend forslag' : 'Apply suggestion'}
                                </Button>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
