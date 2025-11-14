import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS, CategoryType } from '@/lib/morphologyConfig';
import { DimensionRow } from './DimensionRow';
import { MorphologyDescription } from './MorphologyDescription';
import { Copy, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface MorphologicalBoxProps {
  morphology: Record<string, string>;
  dnaCode: string;
  onReassess?: () => void;
  onMorphologyChange?: (morphology: Record<string, string>) => void;
  projectId?: string;
  language?: 'en' | 'da';
}

export function MorphologicalBox({ 
  morphology, 
  dnaCode, 
  onReassess, 
  onMorphologyChange,
  projectId,
  language = 'en'
}: MorphologicalBoxProps) {
  const { t } = useTranslation('common');
  const [isCodeOpen, setIsCodeOpen] = useState(false);

  const handleSelect = (dimensionKey: string, value: string) => {
    const updatedMorphology = { ...morphology, [dimensionKey]: value };
    onMorphologyChange?.(updatedMorphology);
  };

  const handleCopyDNA = () => {
    navigator.clipboard.writeText(dnaCode);
    toast.success(t('morphology.dnaCopied') || 'DNA code copied to clipboard');
  };

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
    challenge_and_resources: { en: 'Challenge, Resources & Risk', da: 'Udfordring, Ressourcer & Risiko' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('morphology.visualBox.title') || 'Morphological Box'}
            </CardTitle>
            <CardDescription>
              {t('morphology.visualBox.description') || '12-dimensional project assessment matrix'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReassess}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('morphology.reassess') || 'Re-assess'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
                    selectedValue={morphology[dimension.key]}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI-Generated Description */}
        {projectId && (
          <MorphologyDescription 
            morphology={morphology}
            language={language}
            projectId={projectId}
          />
        )}

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
                  {dnaCode.split('-').map((segment, index) => {
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
