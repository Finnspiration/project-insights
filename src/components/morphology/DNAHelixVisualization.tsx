import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { DimensionDetailDialog } from './DimensionDetailDialog';

interface DNAHelixVisualizationProps {
  morphology: Record<string, string>;
  dnaCode: string;
  language?: 'en' | 'da';
}

export function DNAHelixVisualization({ morphology, dnaCode, language = 'en' }: DNAHelixVisualizationProps) {
  const { t, i18n } = useTranslation('common');
  const [selectedDimension, setSelectedDimension] = useState<number | null>(null);
  
  // Use i18n.language as source of truth with fallback
  const currentLanguage = (i18n.language || language) as 'en' | 'da';

  // Calculate double helix points - 2 strands with 6 dimensions each
  // Using sinusoidal model for classic DNA helix shape
  const helixPoints = Array.from({ length: 12 }, (_, i) => {
    const isTopStrand = i % 2 === 0;
    const pairIndex = Math.floor(i / 2);
    const xPosition = 80 + (pairIndex * 170); // Increased spacing to prevent overlap
    
    // Sinusoidal Y calculation for helix shape
    const centerY = 150;
    const amplitude = 70;
    const wavelength = 420;
    const phase = isTopStrand ? 0 : Math.PI; // 180° offset between strands
    
    const yPosition = centerY + amplitude * Math.sin((xPosition / wavelength) * Math.PI * 2 + phase);
    
    return {
      x: xPosition,
      y: yPosition,
      index: i,
      strand: isTopStrand ? 1 : 2
    };
  });

  // Base pair connections (connecting paired nucleotides)
  const connections = [
    { from: 0, to: 1 },   // Pair 1
    { from: 2, to: 3 },   // Pair 2
    { from: 4, to: 5 },   // Pair 3
    { from: 6, to: 7 },   // Pair 4
    { from: 8, to: 9 },   // Pair 5
    { from: 10, to: 11 }, // Pair 6
  ];


  const handleBadgeClick = (dimensionIndex: number) => {
    setSelectedDimension(dimensionIndex);
  };

  const selectedDimensionData = selectedDimension !== null ? {
    dimension: MORPHOLOGY_DIMENSIONS[selectedDimension],
    option: MORPHOLOGY_DIMENSIONS[selectedDimension].options.find(
      opt => opt.value === dnaCode.split('-')[selectedDimension]
    ),
  } : null;

  return (
    <>
      <div className="w-full overflow-x-auto">
      <svg 
        viewBox="0 0 1100 300" 
        className="w-full h-auto min-h-[300px]"
        style={{ minWidth: '1100px' }}
      >
        {/* Gradients for the double helix strands */}
        <defs>
          {/* Strand 1: Blue to Purple to Red */}
          <linearGradient id="gradient-strand1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(220, 80%, 50%)" />
            <stop offset="50%" stopColor="hsl(280, 70%, 60%)" />
            <stop offset="100%" stopColor="hsl(0, 80%, 60%)" />
          </linearGradient>
          
          {/* Strand 2: Blue to Purple to Red (slightly different hues) */}
          <linearGradient id="gradient-strand2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(200, 80%, 55%)" />
            <stop offset="50%" stopColor="hsl(300, 70%, 65%)" />
            <stop offset="100%" stopColor="hsl(20, 80%, 65%)" />
          </linearGradient>
        </defs>
        
        {/* Strand 1 - Top/Right strand */}
        <path
          d="M 80,150 Q 165,80 250,150 Q 335,220 420,150 Q 505,80 590,150 Q 675,220 760,150 Q 845,80 930,150 Q 1015,220 1100,150"
          stroke="url(#gradient-strand1)"
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.8"
        />
        
        {/* Strand 2 - Bottom/Left strand */}
        <path
          d="M 80,150 Q 165,220 250,150 Q 335,80 420,150 Q 505,220 590,150 Q 675,80 760,150 Q 845,220 930,150 Q 1015,80 1100,150"
          stroke="url(#gradient-strand2)"
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.8"
        />
        
        {/* Base pair connections */}
        {connections.map((pair, idx) => {
          const point1 = helixPoints[pair.from];
          const point2 = helixPoints[pair.to];
          const dimension = MORPHOLOGY_DIMENSIONS[pair.from];
          const categoryColor = CATEGORY_COLORS[dimension.category];
          
          return (
            <line
              key={`connection-${idx}`}
              x1={point1.x}
              y1={point1.y}
              x2={point2.x}
              y2={point2.y}
              stroke={`hsl(${categoryColor})`}
              strokeWidth="3"
              opacity="0.6"
            />
          );
        })}
        
        {/* Nucleotide badges */}
        {helixPoints.map((point) => {
          const segment = dnaCode.split('-')[point.index];
          const dimension = MORPHOLOGY_DIMENSIONS[point.index];
          if (!dimension || !segment) return null;
          
          const option = dimension.options.find(opt => opt.value === segment);
          
          // Debug translation
          const translatedLabel = option ? t(option.translationKey, { lng: currentLanguage }) : segment;
          
          console.log('DNA Badge Translation:', {
            index: point.index,
            segment,
            translationKey: option?.translationKey,
            currentLanguage,
            i18nLanguage: i18n.language,
            translatedLabel,
            optionExists: !!option
          });
          
          const categoryColor = CATEGORY_COLORS[dimension.category];
          
          return (
            <g 
              key={`badge-${point.index}`}
              onClick={() => handleBadgeClick(point.index)}
              style={{ cursor: 'pointer' }}
            >
              {/* Badge background */}
              <rect
                x={point.x - 60}
                y={point.y - 14}
                width="120"
                height="28"
                rx="14"
                fill={`hsl(${categoryColor})`}
                className="transition-all hover:opacity-90"
                style={{ pointerEvents: 'all' }}
              />
              
              {/* Badge text */}
              <text
                x={point.x}
                y={point.y + 5}
                textAnchor="middle"
                className="fill-white text-sm font-mono font-bold select-none"
                style={{ fontSize: '12px', pointerEvents: 'none' }}
              >
                {translatedLabel}
              </text>
              
              {/* Hover title (dimension name) */}
              <title>{t(dimension.translationKey, { lng: currentLanguage })}</title>
            </g>
          );
        })}
      </svg>
    </div>

    {selectedDimensionData && (
      <DimensionDetailDialog
        open={selectedDimension !== null}
        onOpenChange={(open) => !open && setSelectedDimension(null)}
        dimension={selectedDimensionData.dimension}
        selectedOption={selectedDimensionData.option || {
          value: dnaCode.split('-')[selectedDimension!],
          translationKey: `morphology.${MORPHOLOGY_DIMENSIONS[selectedDimension!].key}.${dnaCode.split('-')[selectedDimension!]}`
        }}
        allOptions={selectedDimensionData.dimension.options}
      />
    )}
    </>
  );
}
