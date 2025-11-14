import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface MorphologyDescriptionProps {
  morphology: Record<string, string>;
  language: 'en' | 'da';
  projectId?: string;
}

export function MorphologyDescription({ morphology, language, projectId }: MorphologyDescriptionProps) {
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const generateDescription = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-morphology-description', {
        body: { morphology, language }
      });

      if (functionError) throw functionError;

      if (data?.description) {
        setDescription(data.description);
        
        // Cache in localStorage
        if (projectId) {
          const cacheKey = `morphology-desc-${projectId}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            description: data.description,
            morphology,
            timestamp: Date.now()
          }));
        }
      }
    } catch (err: any) {
      console.error('Error generating description:', err);
      setError(err.message || 'Failed to generate description');
      
      toast({
        title: t('morphology.aiAnalysis.error'),
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check cache first
    if (projectId) {
      const cacheKey = `morphology-desc-${projectId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { description: cachedDesc, morphology: cachedMorph, timestamp } = JSON.parse(cached);
          
          // Check if cache is still valid (less than 1 hour old and morphology matches)
          const isValid = 
            Date.now() - timestamp < 3600000 && 
            JSON.stringify(cachedMorph) === JSON.stringify(morphology);
          
          if (isValid) {
            setDescription(cachedDesc);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing cache:', e);
        }
      }
    }
    
    // Generate new description
    generateDescription();
  }, [morphology, language, projectId]);

  // Parse simple markdown
  const parseMarkdown = (md: string) => {
    // Remove any bold formatting that might slip through
    const cleanMd = md.replace(/\*\*/g, '');
    
    return cleanMd
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-semibold mb-2 mt-4 first:mt-0 text-foreground">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-sm text-muted-foreground ml-4 leading-relaxed">{line.replace('- ', '')}</li>;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return <p key={i} className="text-sm leading-relaxed text-foreground">{line}</p>;
      });
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('morphology.aiAnalysis.title')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateDescription}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : error ? (
          <div className="text-sm text-muted-foreground">
            <p>{t('morphology.aiAnalysis.error')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateDescription}
              className="mt-2"
            >
              {t('morphology.aiAnalysis.retry')}
            </Button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none animate-in fade-in duration-500">
            {parseMarkdown(description)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
