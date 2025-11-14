import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS, CategoryType } from '@/lib/morphologyConfig';
import { DimensionRow } from './DimensionRow';
import { Copy, ChevronDown, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MorphologicalBoxProps {
  morphology: Record<string, string>;
  dnaCode: string;
  projectId: string;
  onReassess?: () => void;
  onUpdate?: (morphology: Record<string, string>, dnaCode: string) => void;
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
  const [localMorphology, setLocalMorphology] = useState(morphology);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [loadingDescription, setLoadingDescription] = useState(false);

  useEffect(() => {
    setLocalMorphology(morphology);
  }, [morphology]);

  const handleCopyDNA = () => {
    navigator.clipboard.writeText(dnaCode);
    toast.success(t('morphology.dnaCopied') || 'DNA code copied to clipboard');
  };

  const handleDimensionChange = async (dimensionKey: string, value: string) => {
    const newMorphology = { ...localMorphology, [dimensionKey]: value };
    setLocalMorphology(newMorphology);
    
    // Generate new DNA code
    const newDnaCode = MORPHOLOGY_DIMENSIONS.map(dim => newMorphology[dim.key] || '').join('-');
    
    // Update database
    const { error } = await supabase
      .from('projects')
      .update({ 
        morphology: newMorphology,
        dna_code: newDnaCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) {
      toast.error(t('morphology.updateError') || 'Failed to update morphology');
      console.error('Error updating morphology:', error);
      return;
    }

    toast.success(t('morphology.updated') || 'Morphology updated');
    
    if (onUpdate) {
      onUpdate(newMorphology, newDnaCode);
    }

    // Generate new AI description
    generateAiDescription(newMorphology);
  };

  const generateAiDescription = async (morphologyData: Record<string, string>) => {
    setLoadingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-morphology', {
        body: { 
          morphology: morphologyData,
          language: i18n.language 
        }
      });

      if (error) throw error;
      
      setAiDescription(data.description);
    } catch (error) {
      console.error('Error generating AI description:', error);
      toast.error(t('morphology.descriptionError') || 'Failed to generate description');
    } finally {
      setLoadingDescription(false);
    }
  };

  useEffect(() => {
    if (Object.keys(localMorphology).length > 0) {
      generateAiDescription(localMorphology);
    }
  }, []);

  const currentDnaCode = MORPHOLOGY_DIMENSIONS.map(dim => localMorphology[dim.key] || '').join('-');

  // Group dimensions by category
  const dimensionsByCategory = MORPHOLOGY_DIMENSIONS.reduce((acc, dimension) => {
    if (!acc[dimension.category]) {
      acc[dimension.category] = [];
    }
    acc[dimension.category].push(dimension);
    return acc;
  }, {} as Record<CategoryType, typeof MORPHOLOGY_DIMENSIONS>);

  const categoryLabels: Record<CategoryType, { en: string; da: string }> = {
    context: { en: 'Project Context', da: 'Projekt Kontekst' },
    capacity: { en: 'Knowledge & Capacity', da: 'Viden & Kapacitet' },
    dynamics: { en: 'Dynamics & Change', da: 'Dynamik & Forandring' },
    resources: { en: 'Resources & Risk', da: 'Ressourcer & Risiko' },
    challenge: { en: 'Primary Challenge', da: 'Primær Udfordring' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('morphology.visualBox.title') || 'Morphological Box'}
              {editable && (
                <Badge variant="secondary" className="text-xs">
                  {t('morphology.editable') || 'Editable'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {t('morphology.visualBox.description') || '12-dimensional project assessment matrix'}
            </CardDescription>
          </div>
          {onReassess && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReassess}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t('morphology.reassess') || 'Re-assess'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Description */}
        {aiDescription && (
          <Alert className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm leading-relaxed">
              {loadingDescription ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('morphology.generatingDescription') || 'Generating AI description...'}
                </div>
              ) : (
                aiDescription
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Morphological Matrix */}
        <div className="space-y-6">
          {(Object.keys(dimensionsByCategory) as CategoryType[]).map((category) => (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category] }}
                />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[category].en}
                </h3>
              </div>

              {/* Dimensions in this category */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {dimensionsByCategory[category].map((dimension) => (
                  <DimensionRow
                    key={dimension.key}
                    dimension={dimension}
                    selectedValue={localMorphology[dimension.key]}
                    onSelect={editable ? (value) => handleDimensionChange(dimension.key, value) : undefined}
                    disabled={loadingDescription}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* DNA Code Section (Collapsible) */}
        <Collapsible open={isCodeOpen} onOpenChange={setIsCodeOpen}>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCodeOpen ? 'rotate-180' : ''}`} />
                  {t('morphology.showDnaCode') || 'Show Raw DNA Code'}
                </Button>
              </CollapsibleTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDNA}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {t('morphology.copyDna') || 'Copy'}
              </Button>
            </div>

            <CollapsibleContent>
              <div className="bg-muted/50 p-4 rounded-lg mt-2">
                <div className="flex flex-wrap gap-2">
                  {currentDnaCode.split('-').map((segment, index) => {
                    const dimension = MORPHOLOGY_DIMENSIONS[index];
                    const categoryColor = dimension ? CATEGORY_COLORS[dimension.category] : 'hsl(var(--muted))';
                    
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="font-mono text-xs"
                        style={{
                          borderLeft: `3px solid ${categoryColor}`,
                        }}
                      >
                        {segment}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
