import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { DimensionDetailDialog } from '@/components/morphology/DimensionDetailDialog';

// Map database keys to MORPHOLOGY_DIMENSIONS keys
const KEY_MAPPING: Record<string, string> = {
  'complexity': 'complexity_level',
  'stakeholder': 'stakeholder_dynamics',
  'knowledge': 'knowledge_intensity',
  'cultural': 'cultural_context',
  'temporal': 'temporal_dynamics',
  'organizational': 'organizational_stage',
  'challenge': 'primary_challenge',
  'development': 'development_needs',
  'resources': 'resource_characteristics',
  'change': 'change_intensity',
  'information': 'information_flow',
  'risk': 'risk_profile'
};

// Normalize value format (lowercase db → PascalCase/camelCase)
const normalizeValue = (value: string): string => {
  if (!value) return '';
  // Handle special cases
  const specialCases: Record<string, string> = {
    'crossfunctional': 'CrossFunctional',
    'crossorg': 'CrossOrg',
    'crosscultural': 'CrossCultural',
  };
  
  const lowerValue = value.toLowerCase().replace(/[-_\s]/g, '');
  if (specialCases[lowerValue]) {
    return specialCases[lowerValue];
  }
  
  // Default: capitalize first letter
  return value.charAt(0).toUpperCase() + value.slice(1);
};

interface MorphologyEvidence {
  dimension: string;
  value: string;
  reasoning: string;
}

interface DNAEvidenceVisualizationProps {
  morphology: Record<string, string>;
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
  
  // Normalize morphology data to match MORPHOLOGY_DIMENSIONS structure
  const normalizedMorphology = Object.entries(morphology).reduce((acc, [key, value]) => {
    const fullKey = KEY_MAPPING[key] || key;
    const normalizedValue = normalizeValue(value as string);
    acc[fullKey] = normalizedValue;
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
    // FIX: Map short key to full key for normalizedMorphology lookup
    const fullDimensionKey = KEY_MAPPING[dimension.key] || dimension.key;
    
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
      fullDimensionKey, // Store full key for correct value lookup
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
      <div className="w-full overflow-x-auto">
        <svg 
          viewBox="0 0 1600 300" 
          className="w-full h-auto min-h-[300px]"
          style={{ minWidth: '1400px' }}
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
