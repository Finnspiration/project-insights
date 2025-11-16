import { useTranslation } from 'react-i18next';
import { MORPHOLOGY_DIMENSIONS, DimensionKey, DimensionConfig } from '@/lib/morphologyConfig';
import { MiniSlider } from './MiniSlider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Thermometer, Wind, CloudRain, Gauge, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface GroupedControlsProps {
  morphology: any;
  onMorphologyChange: (newMorphology: any) => void;
  idgScores?: {
    being: number;
    thinking: number;
    relating: number;
    collaborating: number;
    acting: number;
  };
  onIdgScoresChange?: (newScores: any) => void;
}

// Weather impact grouping
const WEATHER_GROUPS = {
  temperature: {
    icon: Thermometer,
    color: 'hsl(var(--chart-1))',
    dimensions: ['complexity', 'organizational', 'cultural'] as DimensionKey[],
    translationKey: { en: 'Temperature Zones', da: 'Temperatur Zoner' }
  },
  wind: {
    icon: Wind,
    color: 'hsl(var(--chart-2))',
    dimensions: ['information', 'temporal'] as DimensionKey[],
    translationKey: { en: 'Wind Patterns', da: 'Vind Mønstre' }
  },
  precipitation: {
    icon: CloudRain,
    color: 'hsl(var(--chart-3))',
    dimensions: ['knowledge', 'challenge', 'change'] as DimensionKey[],
    translationKey: { en: 'Precipitation & Clouds', da: 'Nedbør & Skyer' }
  },
  pressure: {
    icon: Gauge,
    color: 'hsl(var(--chart-4))',
    dimensions: ['risk', 'stakeholder', 'resources', 'development'] as DimensionKey[],
    translationKey: { en: 'Pressure & Fronts', da: 'Tryk & Fronter' }
  }
};

const IDG_DIMENSIONS = [
  { key: 'being', translationKey: { en: 'Being', da: 'Væren' } },
  { key: 'thinking', translationKey: { en: 'Thinking', da: 'Tænkning' } },
  { key: 'relating', translationKey: { en: 'Relating', da: 'Relationsdannelse' } },
  { key: 'collaborating', translationKey: { en: 'Collaborating', da: 'Samarbejde' } },
  { key: 'acting', translationKey: { en: 'Acting', da: 'Handling' } }
];

export function GroupedControls({ 
  morphology, 
  onMorphologyChange,
  idgScores = { being: 5, thinking: 5, relating: 5, collaborating: 5, acting: 5 },
  onIdgScoresChange
}: GroupedControlsProps) {
  const { i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';

  const handleDimensionChange = (dimensionKey: string, newValueIndex: number) => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === dimensionKey);
    if (!dimension) return;

    const newOption = dimension.options[newValueIndex];
    if (!newOption) return;

    onMorphologyChange({
      ...morphology,
      [dimensionKey]: {
        selectedValue: newOption.value,
        selectedIndex: newValueIndex
      }
    });
  };

  const getCurrentIndex = (dimensionKey: string) => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === dimensionKey);
    if (!dimension) return 0;
    
    const currentData = morphology?.[dimensionKey];
    // Support both new format (object) and old format (string)
    if (typeof currentData === 'object' && currentData?.selectedIndex !== undefined) {
      return currentData.selectedIndex;
    }
    
    // Fallback to searching by value
    const currentValue = typeof currentData === 'object' ? currentData?.selectedValue : currentData;
    const index = dimension.options.findIndex(opt => opt.value === currentValue);
    return index >= 0 ? index : 0;
  };

  return (
    <Accordion 
      type="multiple" 
      defaultValue={['temperature', 'idg']} 
      className="w-full space-y-2"
    >
      {Object.entries(WEATHER_GROUPS).map(([groupKey, group]) => {
        const Icon = group.icon;
        
        return (
          <AccordionItem 
            key={groupKey} 
            value={groupKey}
            className="border border-border/50 rounded-lg overflow-hidden"
          >
            <AccordionTrigger 
              className="px-3 py-2 hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/30"
            >
              <div className="flex items-center justify-between w-full mr-2">
                <div className="flex items-center gap-2">
                  <Icon 
                    className="h-4 w-4 flex-shrink-0" 
                    style={{ color: group.color }}
                  />
                  <span className="text-sm font-semibold">
                    {group.translationKey[language]}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({group.dimensions.length})
                </span>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-2 pb-2 pt-1 @md:px-3 @md:pb-3 @md:pt-2">
              <div className="space-y-2 @md:space-y-3">
                {group.dimensions.map((dimensionKey) => {
                  const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === dimensionKey);
                  if (!dimension) return null;

                  return (
                    <MiniSlider
                      key={dimensionKey}
                      dimension={dimension}
                      currentIndex={getCurrentIndex(dimensionKey)}
                      onChange={(index) => handleDimensionChange(dimensionKey, index)}
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}

      {/* IDG Section */}
      <AccordionItem 
        value="idg"
        className="border border-border/50 rounded-lg overflow-hidden"
      >
        <AccordionTrigger 
          className="px-3 py-2 hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <Heart 
              className="h-4 w-4 flex-shrink-0" 
              style={{ color: 'hsl(var(--chart-5))' }}
            />
            <span className="text-sm font-semibold">
              {language === 'en' ? 'Inner Development Goals' : 'Indre Udviklings Mål'}
            </span>
            <span className="text-xs text-muted-foreground ml-auto mr-2">
              (5)
            </span>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="px-2 pb-2 pt-1 @md:px-3 @md:pb-3 @md:pt-2">
          <div className="space-y-2 @md:space-y-3">
            {IDG_DIMENSIONS.map((idgDim) => {
              // Create a dimension-like config for IDG to use MiniSlider
              const idgDimensionConfig: DimensionConfig = {
                key: 'development' as DimensionKey,
                translationKey: idgDim.translationKey[language],
                category: 'challenge_and_resources',
                options: Array.from({ length: 11 }, (_, i) => ({
                  value: i.toString(),
                  translationKey: `${i}/10`
                }))
              };

              return (
                <MiniSlider
                  key={idgDim.key}
                  dimension={idgDimensionConfig}
                  currentIndex={idgScores[idgDim.key as keyof typeof idgScores]}
                  onChange={(value) => {
                    if (onIdgScoresChange) {
                      onIdgScoresChange({
                        ...idgScores,
                        [idgDim.key]: value
                      });
                    }
                  }}
                />
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
