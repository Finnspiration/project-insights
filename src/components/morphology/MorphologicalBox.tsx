import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS, CATEGORY_ICONS, CategoryType } from '@/lib/morphologyConfig';
import { DimensionRow } from './DimensionRow';
import { MorphologyDescription } from './MorphologyDescription';
import { DNAHelixVisualization } from './DNAHelixVisualization';
import { MorphologyScoringTable } from './MorphologyScoringTable';
import { RegenerateDNAButton } from '../projects/RegenerateDNAButton';
import { Copy, ChevronDown, RefreshCw, Globe, Brain, Zap, Shield, Dna, List, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const { t, i18n } = useTranslation('common');
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [theoryUAnalysis, setTheoryUAnalysis] = useState<any>(null);

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

  const iconMap: Record<string, React.ElementType> = {
    Globe,
    Brain,
    Zap,
    Shield,
  };

  // Fetch Theory U analysis to get morphology scoring
  useEffect(() => {
    if (!projectId) return;

    const fetchTheoryUAnalysis = async () => {
      const { data } = await supabase
        .from('projects')
        .select('theory_u_analysis')
        .eq('id', projectId)
        .single();

      if (data?.theory_u_analysis) {
        setTheoryUAnalysis(data.theory_u_analysis);
      }
    };

    fetchTheoryUAnalysis();
  }, [projectId]);

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
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${CATEGORY_COLORS[category]})` }}
                >
                  {(() => {
                    const IconComponent = iconMap[CATEGORY_ICONS[category]];
                    return <IconComponent className="h-4 w-4 text-white" />;
                  })()}
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide"
                    style={{ color: `hsl(${CATEGORY_COLORS[category]})` }}>
                  {t(`morphology.categories.${category}`)}
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
                  {t('morphology.showDnaCode') || 'Show DNA Code'}
                </Button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDNA}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {t('morphology.copyDna') || 'Copy'}
                </Button>
                {projectId && (
                  <RegenerateDNAButton 
                    projectId={projectId} 
                    onSuccess={() => window.location.reload()}
                  />
                )}
              </div>
            </div>

            <CollapsibleContent>
              <div className="bg-muted/50 p-4 rounded-lg mt-2">
                <Tabs defaultValue="helix" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="helix" className="flex items-center gap-2">
                      <Dna className="h-4 w-4" />
                      {t('morphology.dnaHelix') || 'DNA Helix'}
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      {t('morphology.listView') || 'List'}
                    </TabsTrigger>
                    <TabsTrigger value="scoring" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t('morphology.scoringView') || 'Theory U Scoring'}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="helix">
                    <DNAHelixVisualization 
                      morphology={morphology}
                      dnaCode={dnaCode}
                      language={i18n.language as 'en' | 'da'}
                      onMorphologyChange={onMorphologyChange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="list" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {MORPHOLOGY_DIMENSIONS.map((dimension) => {
                        const selectedValue = morphology[dimension.key];
                        if (!selectedValue) return null;
                        
                        const option = dimension.options.find(opt => opt.value === selectedValue);
                        const translatedLabel = option ? t(option.translationKey) : selectedValue;
                        const categoryColor = CATEGORY_COLORS[dimension.category];
                        
                        return (
                          <Badge 
                            key={dimension.key}
                            className="font-mono text-xs text-white border-none"
                            style={{ backgroundColor: `hsl(${categoryColor})` }}
                          >
                            <span className="opacity-70">{t(dimension.translationKey)}:</span> {translatedLabel}
                          </Badge>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="scoring">
                    {theoryUAnalysis?.whyHere?.morphologyScoring ? (
                      <MorphologyScoringTable 
                        morphologyScoring={theoryUAnalysis.whyHere.morphologyScoring}
                        aiNuance={theoryUAnalysis.whyHere.aiNuance}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-2">{t('morphology.scoring.notGenerated')}</p>
                        <p className="text-sm">{t('morphology.scoring.visitTheoryU')}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
