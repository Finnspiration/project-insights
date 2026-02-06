import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { DimensionDetailDialog } from '@/components/morphology/DimensionDetailDialog';

// Normalize value format - handles both string and object input
const normalizeValue = (value: string | { selectedValue: string; selectedIndex: number }): string => {
  // Extract string value if object
  const stringValue = typeof value === 'object' && value !== null && 'selectedValue' in value 
    ? value.selectedValue 
    : value as string;
    
  if (!stringValue) return '';
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'crossfunctional': 'CrossFunctional',
    'crossorg': 'CrossOrg',
    'crosscultural': 'CrossCultural',
  };
  
  const lowerValue = stringValue.toLowerCase().replace(/[-_\s]/g, '');
  if (specialCases[lowerValue]) {
    return specialCases[lowerValue];
  }
  
  // Default: capitalize first letter
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
};

interface MorphologyEvidence {
  dimension: string;
  value: string;
  reasoning: string;
}

interface DNAEvidenceVisualizationProps {
  morphology: Record<string, string | { selectedValue: string; selectedIndex: number }>;
  evidence: MorphologyEvidence[];
  language?: 'en' | 'da';
}

export function DNAEvidenceVisualization({ 
  morphology, 
  evidence, 
  language = 'en' 
}: DNAEvidenceVisualizationProps) {
  const { t, i18n } = useTranslation('common');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  
  const currentLanguage = (i18n.language || language) as 'en' | 'da';
  
  // Early return if no morphology data
  if (!morphology || Object.keys(morphology).length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        {currentLanguage === 'da' ? 'Ingen morfologi data tilgængelig' : 'No morphology data available'}
      </div>
    );
  }
  
  // Normalize morphology data to string format
  const normalizedMorphology = Object.entries(morphology).reduce((acc, [key, value]) => {
    const normalizedValue = normalizeValue(value);
    acc[key] = normalizedValue;
    return acc;
  }, {} as Record<string, string>);

  // Map evidence to dimension keys
  const evidenceDimensionKeys = evidence.map(e => {
    const dim = MORPHOLOGY_DIMENSIONS.find(d => 
      t(`morphology.dimensions.${d.key}.title`) === e.dimension ||
      d.key === e.dimension
    );
    return dim?.key;
  }).filter(Boolean);

  // Calculate DNA helix points (same as DNAHelixVisualization)
  const totalWidth = 1200;
  const startX = 200;
  const spacing = totalWidth / 11;
  
  const helixPoints = Array.from({ length: 12 }, (_, i) => {
    const xPosition = startX + (i * spacing);
    const centerY = 100;
    const amplitude = 40;
    const wavelength = 300;
    const phase = (i % 2 === 0) ? 0 : Math.PI;
    
    const yPosition = centerY + amplitude * Math.sin((xPosition / wavelength) * Math.PI * 2 + phase);
    
    const dimension = MORPHOLOGY_DIMENSIONS[i];
    
    const isHighlighted = evidenceDimensionKeys.includes(dimension.key);
    const evidenceItem = evidence.find(e => {
      const dim = MORPHOLOGY_DIMENSIONS.find(d => 
        t(`morphology.dimensions.${d.key}.title`) === e.dimension ||
        d.key === e.dimension
      );
      return dim?.key === dimension.key;
    });
    
    return {
      x: Number(xPosition.toFixed(2)),
      y: Number(yPosition.toFixed(2)),
      index: i,
      strand: (i % 2 === 0) ? 1 : 2,
      dimension,
      isHighlighted,
      evidenceItem
    };
  });

  // Base pair connections
  const connections = Array.from({ length: 6 }, (_, i) => ({
    from: i * 2,
    to: i * 2 + 1
  }));

  const handleNucleotideClick = (dimensionKey: string) => {
    setSelectedDimension(dimensionKey);
  };

  const getMorphologyValue = (key: string): string | undefined => {
    const value = normalizedMorphology[key];
    if (value !== null && value !== undefined) {
      if (typeof value === 'object') {
        const objValue = value as { selectedValue?: string };
        if ('selectedValue' in objValue) {
          return objValue.selectedValue;
        }
      } else if (typeof value === 'string') {
        return value;
      }
    }
    return undefined;
  };

  const selectedDimensionData = selectedDimension ? (() => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === selectedDimension);
    if (!dimension) return null;
    
    const value = getMorphologyValue(selectedDimension);
    const option = dimension.options.find(opt => 
      opt.value.toLowerCase() === value?.toLowerCase()
    );
    
    return { dimension, option };
  })() : null;

  return (
    <>
      <div className="w-full max-h-[200px]">
        <svg 
          viewBox="0 0 1600 200" 
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
...
        </svg>
      </div>

      {/* Dimension Detail Dialog */}
      {selectedDimensionData && (
        <DimensionDetailDialog
          open={selectedDimension !== null}
          onOpenChange={(open) => !open && setSelectedDimension(null)}
          dimension={{
            key: selectedDimensionData.dimension.key,
            translationKey: selectedDimensionData.dimension.translationKey,
            category: selectedDimensionData.dimension.category
          }}
          selectedOption={selectedDimensionData.option}
          allOptions={selectedDimensionData.dimension.options}
          onOptionSelect={() => {}} // Read-only for now
        />
      )}
    </>
  );
}
