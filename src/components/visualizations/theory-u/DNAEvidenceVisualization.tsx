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
      x: xPosition,
      y: yPosition,
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

  const selectedDimensionData = selectedDimension ? (() => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === selectedDimension);
    if (!dimension) return null;
    
    const value = normalizedMorphology[selectedDimension];
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
            <defs>
              {/* Glow effect for highlighted nucleotides */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Gradient for helix strands */}
              <linearGradient id="strand-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(220, 80%, 50%)" />
                <stop offset="50%" stopColor="hsl(280, 70%, 60%)" />
                <stop offset="100%" stopColor="hsl(0, 80%, 60%)" />
              </linearGradient>
            </defs>

            {/* Draw helix backbone curves */}
            {[1, 2].map(strand => {
              const strandPoints = helixPoints.filter(p => p.strand === strand);
              const pathData = strandPoints.reduce((acc, point, idx) => {
                if (idx === 0) return `M ${point.x} ${point.y}`;
                const prevPoint = strandPoints[idx - 1];
                const cpX = (prevPoint.x + point.x) / 2;
                return `${acc} Q ${cpX} ${prevPoint.y}, ${point.x} ${point.y}`;
              }, '');

              return (
                <path
                  key={`strand-${strand}`}
                  d={pathData}
                  fill="none"
                  stroke="url(#strand-gradient)"
                  strokeWidth="2"
                  opacity="0.3"
                />
              );
            })}

            {/* Draw base pair connections */}
            {connections.map((conn, idx) => {
              const from = helixPoints[conn.from];
              const to = helixPoints[conn.to];
              
              return (
                <line
                  key={`connection-${idx}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                  opacity="0.2"
                />
              );
            })}

            {/* Draw nucleotides */}
            {helixPoints.map((point) => {
              // FIX: Use fullDimensionKey to get correct value from normalizedMorphology
              const value = normalizedMorphology[point.fullDimensionKey];
              const option = point.dimension.options.find(
                opt => normalizeValue(opt.value) === value
              );
              
              const translatedLabel = option
                ? t(`morphology.dimensions.${point.dimension.key}.options.${option.value}`)
                : (value || '').charAt(0).toUpperCase() + (value || '').slice(1);
              const shortLabel = translatedLabel.split(' - ')[0] || translatedLabel;
              
              const categoryColor = CATEGORY_COLORS[point.dimension.category] || '220, 80%, 50%';
              const estimatedWidth = Math.max(80, shortLabel.length * 9 + 20);
              const badgeHeight = 28;
              
              // Use category color for non-highlighted, amber for highlighted
              const badgeColor = point.isHighlighted 
                ? "hsl(45, 100%, 60%)" 
                : `hsl(${categoryColor})`;
              
              return (
                <g 
                  key={`badge-${point.index}`} 
                  onClick={() => handleNucleotideClick(point.dimension.key)}
                  className="cursor-pointer"
                >
                  {/* Glow effect for highlighted dimensions */}
                  {point.isHighlighted && (
                    <rect
                      x={point.x - estimatedWidth/2 - 4}
                      y={point.y - badgeHeight/2 - 4}
                      width={estimatedWidth + 8}
                      height={badgeHeight + 8}
                      rx="10"
                      fill="hsl(45, 100%, 50%)"
                      opacity="0.3"
                      filter="url(#glow)"
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Badge background */}
                  <rect
                    x={point.x - estimatedWidth/2}
                    y={point.y - badgeHeight/2}
                    width={estimatedWidth}
                    height={badgeHeight}
                    rx="8"
                    fill={badgeColor}
                    stroke="white"
                    strokeWidth="1"
                    className="transition-all hover:opacity-90"
                  />
                  
                  {/* Native SVG text - cross-browser compatible */}
                  <text
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="Inter, system-ui, sans-serif"
                    pointerEvents="none"
                    style={{ userSelect: 'none' }}
                  >
                    {shortLabel}
                  </text>
                  
                  {/* Native SVG tooltip */}
                  <title>
                    {t(`morphology.dimensions.${point.dimension.key}.title`)}
                    {'\n'}{translatedLabel}
                    {point.evidenceItem && `\n\n${point.evidenceItem.reasoning}`}
                  </title>
                </g>
              );
            })}
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
