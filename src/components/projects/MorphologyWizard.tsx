import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface MorphologyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

type DimensionKey = 
  | 'complexity' 
  | 'stakeholder' 
  | 'knowledge' 
  | 'cultural' 
  | 'temporal' 
  | 'organizational' 
  | 'challenge' 
  | 'development' 
  | 'resources' 
  | 'change' 
  | 'information' 
  | 'risk';

interface MorphologyData {
  complexity?: string;
  stakeholder?: string;
  knowledge?: string;
  cultural?: string;
  temporal?: string;
  organizational?: string;
  challenge?: string;
  development?: string;
  resources?: string;
  change?: string;
  information?: string;
  risk?: string;
}

const DIMENSIONS: DimensionKey[] = [
  'complexity',
  'stakeholder',
  'knowledge',
  'cultural',
  'temporal',
  'organizational',
  'challenge',
  'development',
  'resources',
  'change',
  'information',
  'risk',
];

export function MorphologyWizard({ open, onOpenChange, projectId, onSuccess }: MorphologyWizardProps) {
  const { t, i18n } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(0);
  const [morphology, setMorphology] = useState<MorphologyData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch AI suggestions when wizard opens
  useState(() => {
    if (open && projectId && !aiSuggestions && !loadingSuggestions) {
      fetchAiSuggestions();
    }
  });

  const fetchAiSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-documents', {
        body: { 
          projectId,
          language: i18n.language 
        }
      });

      if (error) {
        console.error('Error fetching AI suggestions:', error);
      } else if (data?.morphologySuggestions) {
        setAiSuggestions(data);
        toast.success(t('morphology.aiSuggestionsLoaded') || 'AI suggestions loaded from your documents');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const currentDimension = DIMENSIONS[currentStep];
  const totalSteps = DIMENSIONS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelection = (value: string) => {
    setMorphology({ ...morphology, [currentDimension]: value });
  };

  const generateDNACode = (data: MorphologyData): string => {
    const values = DIMENSIONS.map(dim => {
      const value = data[dim] || 'unknown';
      return value.charAt(0).toUpperCase() + value.slice(1);
    });
    return values.join('-');
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const dnaCode = generateDNACode(morphology);

      const { error } = await supabase
        .from('projects')
        .update({
          morphology,
          dna_code: dnaCode,
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success(t('morphology.success'));
      onOpenChange(false);
      onSuccess?.();
      
      // Reset wizard
      setCurrentStep(0);
      setMorphology({});
    } catch (error) {
      console.error('Error saving morphology:', error);
      toast.error(t('morphology.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptions = (dimension: DimensionKey) => {
    const optionsPath = `morphology.dimensions.${dimension}.options`;
    const optionsKeys = ['simple', 'complicated', 'complex', 'chaotic'];
    
    // Define option keys for each dimension
    const dimensionOptions: Record<DimensionKey, string[]> = {
      complexity: ['simple', 'complicated', 'complex', 'chaotic'],
      stakeholder: ['unified', 'cooperative', 'competitive', 'adversarial'],
      knowledge: ['routine', 'adaptive', 'innovative', 'breakthrough'],
      cultural: ['mono', 'crossfunctional', 'crossorg', 'crosscultural'],
      temporal: ['sprint', 'project', 'program', 'transformation'],
      organizational: ['red', 'amber', 'orange', 'green', 'teal'],
      challenge: ['technical', 'social', 'political', 'cognitive', 'adaptive'],
      development: ['being', 'thinking', 'relating', 'collaborating', 'acting'],
      resources: ['rich', 'balanced', 'constrained', 'scarce'],
      change: ['incremental', 'transitional', 'transformational', 'disruptive'],
      information: ['centralized', 'hierarchical', 'network', 'distributed'],
      risk: ['low', 'moderate', 'high', 'extreme'],
    };

    return dimensionOptions[dimension].map(key => ({
      value: key,
      label: t(`${optionsPath}.${key}`),
    }));
  };

  const isStepComplete = morphology[currentDimension] !== undefined;
  const canFinish = DIMENSIONS.every(dim => morphology[dim] !== undefined);
  
  // Get AI suggestion for current dimension
  const currentSuggestion = aiSuggestions?.morphologySuggestions?.[currentDimension];
  const options = getOptions(currentDimension);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('morphology.title')}
          </DialogTitle>
          <DialogDescription>
            {t('morphology.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {t('morphology.step')} {currentStep + 1} {t('morphology.of')} {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Dimension */}
        <div className="space-y-6 py-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {t(`morphology.dimensions.${currentDimension}.title`)}
            </h3>
            <p className="text-muted-foreground">
              {t(`morphology.dimensions.${currentDimension}.description`)}
            </p>
          </div>

          {loadingSuggestions && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
              {t('morphology.analyzingDocuments') || 'Analyzing your documents...'}
            </div>
          )}

          {currentSuggestion && !loadingSuggestions && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-primary">✨</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-primary">
                    {t('morphology.aiSuggests') || 'AI suggests'}: {options.find(o => o.value === currentSuggestion.value)?.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('morphology.confidence') || 'Confidence'}: {Math.round(currentSuggestion.confidence * 100)}%
                  </p>
                  {currentSuggestion.evidence && (
                    <p className="text-xs italic text-muted-foreground mt-2">
                      "{currentSuggestion.evidence.slice(0, 150)}..."
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelection(currentSuggestion.value)}
                >
                  {t('morphology.accept') || 'Accept'}
                </Button>
              </div>
            </div>
          )}

          <RadioGroup
            value={morphology[currentDimension] || ''}
            onValueChange={handleSelection}
            className="space-y-3"
          >
            {getOptions(currentDimension).map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer font-normal leading-relaxed"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('morphology.previous')}
          </Button>

          {currentStep === totalSteps - 1 ? (
            <Button
              onClick={handleFinish}
              disabled={!canFinish || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? t('morphology.finishing') : t('morphology.finish')}
              <Sparkles className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepComplete}
              className="gap-2"
            >
              {t('morphology.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
