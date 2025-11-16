import { useTranslation } from 'react-i18next';
import { MORPHOLOGY_DIMENSIONS, DimensionKey } from '@/lib/morphologyConfig';
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
    dimensions: ['complexity', 'stakeholder', 'organizational', 'cultural'] as DimensionKey[],
    translationKey: { en: 'Temperature Zones', da: 'Temperatur Zoner' }
  },
  wind: {
    icon: Wind,
    color: 'hsl(var(--chart-2))',
    dimensions: ['temporal', 'change', 'risk'] as DimensionKey[],
    translationKey: { en: 'Wind Patterns', da: 'Vind Mønstre' }
  },
  precipitation: {
    icon: CloudRain,
    color: 'hsl(var(--chart-3))',
    dimensions: ['knowledge', 'challenge'] as DimensionKey[],
    translationKey: { en: 'Precipitation & Clouds', da: 'Nedbør & Skyer' }
  },
  pressure: {
    icon: Gauge,
    color: 'hsl(var(--chart-4))',
    dimensions: ['resources', 'information', 'development'] as DimensionKey[],
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

    const newValue = dimension.options[newValueIndex]?.value;
    if (!newValue) return;

    onMorphologyChange({
      ...morphology,
      [dimensionKey]: newValue,
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
    <Accordion 
      type="multiple" 
      defaultValue={[...Object.keys(WEATHER_GROUPS), 'idg']} 
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
              <div className="flex items-center gap-2">
                <Icon 
                  className="h-4 w-4 flex-shrink-0" 
                  style={{ color: group.color }}
                />
                <span className="text-sm font-semibold">
                  {group.translationKey[language]}
                </span>
                <span className="text-xs text-muted-foreground ml-auto mr-2">
                  ({group.dimensions.length})
                </span>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-3 pb-3 pt-2">
              <div className="space-y-3">
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
        
        <AccordionContent className="px-3 pb-3 pt-2">
          <div className="space-y-3">
            {IDG_DIMENSIONS.map((idgDim) => (
              <div key={idgDim.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground truncate">
                    {idgDim.translationKey[language]}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {idgScores[idgDim.key as keyof typeof idgScores]}/10
                  </span>
                </div>
                
                <Slider
                  value={[idgScores[idgDim.key as keyof typeof idgScores]]}
                  onValueChange={([value]) => {
                    if (onIdgScoresChange) {
                      onIdgScoresChange({
                        ...idgScores,
                        [idgDim.key]: value
                      });
                    }
                  }}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
