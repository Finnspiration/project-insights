import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion } from '@/components/ui/accordion';
import { Sparkles, RefreshCw, ChevronDown, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { DimensionAccordionItem } from './DimensionAccordionItem';
import { toast } from '@/hooks/use-toast';

interface MorphologicalBoxProps {
  morphology: Record<string, string>;
  dnaCode: string;
  projectId: string;
  onReassess?: () => void;
  onUpdate?: (updatedMorphology: Record<string, string>, updatedDnaCode: string) => void;
  editable?: boolean;
}

export function MorphologicalBox({ 
  morphology, 
  dnaCode, 
  projectId,
  onReassess,
  onUpdate,
  editable = false
}: MorphologicalBoxProps) {
  const { t, i18n } = useTranslation('common');
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localMorphology, setLocalMorphology] = useState(morphology);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [loadingDescription, setLoadingDescription] = useState(false);

  const currentDnaCode = Object.entries(localMorphology)
    .map(([key, value]) => value)
    .join('-');

  useEffect(() => {
    setLocalMorphology(morphology);
  }, [morphology]);

  useEffect(() => {
    if (Object.keys(localMorphology).length > 0) {
      generateAiDescription();
    }
  }, [localMorphology, i18n.language]);

  const handleCopyDNA = () => {
    navigator.clipboard.writeText(currentDnaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t('morphology.dnaCopied'),
      description: t('morphology.dnaCopiedDesc'),
    });
  };

  const handleDimensionChange = async (dimensionKey: string, value: string) => {
    const updatedMorphology = { ...localMorphology, [dimensionKey]: value };
    setLocalMorphology(updatedMorphology);

    const updatedDnaCode = Object.entries(updatedMorphology)
      .map(([key, val]) => val)
      .join('-');

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          morphology: updatedMorphology,
          dna_code: updatedDnaCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      if (onUpdate) {
        onUpdate(updatedMorphology, updatedDnaCode);
      }

      toast({
        title: t('morphology.updated'),
        description: t('morphology.dimensionUpdated'),
      });

      await generateAiDescription();
    } catch (error) {
      console.error('Error updating morphology:', error);
      toast({
        title: t('morphology.updateError'),
        description: t('morphology.updateErrorDesc'),
        variant: 'destructive',
      });
      setLocalMorphology(morphology);
    }
  };

  const generateAiDescription = async () => {
    setLoadingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-morphology', {
        body: {
          morphology: localMorphology,
          language: i18n.language
        }
      });

      if (error) throw error;
      
      if (data?.description) {
        setAiDescription(data.description);
      }
    } catch (error) {
      console.error('Error generating AI description:', error);
      setAiDescription(i18n.language === 'da' 
        ? 'Kunne ikke generere AI-beskrivelse. Prøv igen senere.'
        : 'Failed to generate AI description. Please try again later.'
      );
    } finally {
      setLoadingDescription(false);
    }
  };

  const groupedDimensions = MORPHOLOGY_DIMENSIONS.reduce((acc, dimension) => {
    if (!acc[dimension.category]) {
      acc[dimension.category] = [];
    }
    acc[dimension.category].push(dimension);
    return acc;
  }, {} as Record<string, typeof MORPHOLOGY_DIMENSIONS>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{t('morphology.title')}</CardTitle>
            {editable && (
              <Badge variant="secondary" className="ml-2">
                {t('morphology.editable')}
              </Badge>
            )}
          </div>
          {onReassess && (
            <Button variant="outline" size="sm" onClick={onReassess}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('morphology.reassess')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
          <AlertDescription className="ml-2">
            {loadingDescription ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">
                  {t('morphology.generatingDescription')}
                </span>
              </div>
            ) : (
              <div className="text-foreground whitespace-pre-wrap">
                {aiDescription || t('morphology.noDescription')}
              </div>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {Object.entries(groupedDimensions).map(([category, dimensions]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {t(`morphology.categories.${category}`, { defaultValue: category })}
              </h3>
              <Accordion type="single" collapsible className="space-y-2">
                {dimensions.map((dimension) => (
                  <DimensionAccordionItem
                    key={dimension.key}
                    dimension={dimension}
                    selectedValue={localMorphology[dimension.key]}
                    categoryColor={CATEGORY_COLORS[dimension.category]}
                    onSelect={editable ? (value) => handleDimensionChange(dimension.key, value) : undefined}
                    disabled={!editable}
                  />
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <Collapsible open={isCodeOpen} onOpenChange={setIsCodeOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('morphology.dnaCode')}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isCodeOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('morphology.dnaCodeDesc')}
                </p>
                <Button variant="ghost" size="sm" onClick={handleCopyDNA}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(localMorphology).map(([key, value]) => {
                  const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === key);
                  const categoryColor = dimension ? CATEGORY_COLORS[dimension.category] : '#888';
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      style={{ borderColor: categoryColor, color: categoryColor }}
                    >
                      {value}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
