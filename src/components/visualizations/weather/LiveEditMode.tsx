import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { MORPHOLOGY_DIMENSIONS } from '@/lib/morphologyConfig';
import { getWeatherImpacts, getIDGImpacts } from './impactMapping';
import { ImpactIndicator } from './ImpactIndicator';
import { useMemo } from 'react';

interface LiveEditModeProps {
  morphology: any;
  idgProfile?: any;
  onMorphologyChange: (newMorphology: any) => void;
  onIDGChange?: (newIDG: any) => void;
}

export function LiveEditMode({ 
  morphology, 
  idgProfile, 
  onMorphologyChange,
  onIDGChange 
}: LiveEditModeProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';

  // Extract IDG scores or use defaults
  const idgScores = useMemo(() => {
    if (!idgProfile) {
      return { being: 5, thinking: 5, relating: 5, collaborating: 5, acting: 5 };
    }
    return {
      being: idgProfile.being || 5,
      thinking: idgProfile.thinking || 5,
      relating: idgProfile.relating || 5,
      collaborating: idgProfile.collaborating || 5,
      acting: idgProfile.acting || 5,
    };
  }, [idgProfile]);

  const handleDimensionChange = (dimensionKey: string, newValueIndex: number) => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === dimensionKey);
    if (!dimension) return;

    const newValue = dimension.options[newValueIndex]?.value;
    if (!newValue) return;

    onMorphologyChange({
      ...morphology,
      [dimensionKey]: newValue,
    });
  };

  const handleIDGChange = (dimension: string, value: number) => {
    if (!onIDGChange) return;
    
    onIDGChange({
      ...idgScores,
      [dimension]: value,
    });
  };

  const getCurrentIndex = (dimensionKey: string) => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === dimensionKey);
    if (!dimension) return 0;
    
    const currentValue = morphology?.[dimensionKey];
    const index = dimension.options.findIndex(opt => opt.value === currentValue);
    return index >= 0 ? index : 0;
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['morphology', 'idg']} className="w-full">
        {/* Morphology Dimensions */}
        <AccordionItem value="morphology">
          <AccordionTrigger className="text-base font-semibold">
            {language === 'da' ? 'Morfologiske Dimensioner (12)' : 'Morphological Dimensions (12)'}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              {MORPHOLOGY_DIMENSIONS.map((dimension) => {
                const currentIndex = getCurrentIndex(dimension.key);
                const currentValue = dimension.options[currentIndex]?.value || '';
                const impacts = getWeatherImpacts(dimension.key, currentValue);

                return (
                  <div key={dimension.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {t(dimension.translationKey)}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t(dimension.options[currentIndex]?.translationKey || '')}
                      </span>
                    </div>
                    
                    <Slider
                      value={[currentIndex]}
                      onValueChange={([value]) => handleDimensionChange(dimension.key, value)}
                      min={0}
                      max={dimension.options.length - 1}
                      step={1}
                      className="w-full"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      {dimension.options.map((opt, idx) => (
                        <span 
                          key={opt.value}
                          className={currentIndex === idx ? 'font-medium text-foreground' : ''}
                        >
                          {t(opt.translationKey).split(' ')[0]}
                        </span>
                      ))}
                    </div>

                    <ImpactIndicator 
                      dimension={dimension.key} 
                      value={currentValue} 
                      impacts={impacts}
                    />
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* IDG Scores */}
        <AccordionItem value="idg">
          <AccordionTrigger className="text-base font-semibold">
            {language === 'da' ? 'IDG Profil (5 dimensioner)' : 'IDG Profile (5 dimensions)'}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              {['being', 'thinking', 'relating', 'collaborating', 'acting'].map((dimension) => {
                const score = idgScores[dimension as keyof typeof idgScores];
                const impacts = getIDGImpacts(dimension, score, language);

                return (
                  <div key={dimension} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium capitalize">
                        {language === 'da' 
                          ? dimension === 'being' ? 'Væren'
                          : dimension === 'thinking' ? 'Tænkning'
                          : dimension === 'relating' ? 'Relationsdannelse'
                          : dimension === 'collaborating' ? 'Samarbejde'
                          : 'Handling'
                          : dimension.charAt(0).toUpperCase() + dimension.slice(1)
                        }
                      </Label>
                      <span className="text-xs text-muted-foreground font-mono">
                        {score}/10
                      </span>
                    </div>
                    
                    <Slider
                      value={[score]}
                      onValueChange={([value]) => handleIDGChange(dimension, value)}
                      min={0}
                      max={10}
                      step={1}
                      className="w-full"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>{language === 'da' ? 'Lav' : 'Low'}</span>
                      <span>{language === 'da' ? 'Høj' : 'High'}</span>
                    </div>

                    <ImpactIndicator 
                      dimension={dimension} 
                      value={score.toString()} 
                      impacts={impacts}
                    />
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
