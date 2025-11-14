import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { DimensionDetailDialog } from './DimensionDetailDialog';

interface DNAHelixVisualizationProps {
  morphology: Record<string, string>;
  dnaCode: string;
  language?: 'en' | 'da';
  onMorphologyChange?: (morphology: Record<string, string>) => void;
}

export function DNAHelixVisualization({ morphology, dnaCode, language = 'en', onMorphologyChange }: DNAHelixVisualizationProps) {
  const { t, i18n } = useTranslation('common');
  const [selectedDimension, setSelectedDimension] = useState<number | null>(null);
  
  // Use i18n.language as source of truth with fallback
  const currentLanguage = (i18n.language || language) as 'en' | 'da';

  // Calculate double helix points - 12 dimensions evenly distributed
  // Using sinusoidal model for classic DNA helix shape
  const totalWidth = 1000; // Total SVG width for distribution
  const startX = 80;
  const spacing = totalWidth / 11; // Divide space equally for 12 points (11 gaps)
  
  const helixPoints = Array.from({ length: 12 }, (_, i) => {
    const xPosition = startX + (i * spacing);
    
    // Sinusoidal Y calculation for helix shape
    const centerY = 150;
    const amplitude = 70;
    const wavelength = 350;
    const phase = (i % 2 === 0) ? 0 : Math.PI; // Alternate between top and bottom
    
    const yPosition = centerY + amplitude * Math.sin((xPosition / wavelength) * Math.PI * 2 + phase);
    
    return {
      x: xPosition,
      y: yPosition,
      index: i,
      strand: (i % 2 === 0) ? 1 : 2
    };
  });

  // Base pair connections - connect adjacent points
  const connections = Array.from({ length: 6 }, (_, i) => ({
    from: i * 2,
    to: i * 2 + 1
  }));


  const handleBadgeClick = (dimensionIndex: number) => {
    setSelectedDimension(dimensionIndex);
  };

  const handleOptionSelect = (optionValue: string) => {
    if (selectedDimension === null || !onMorphologyChange) return;
    
    const segment = dnaCode.split('-')[selectedDimension];
    const dimensionWithOption = MORPHOLOGY_DIMENSIONS.find(dim => 
      dim.options.some(opt => opt.value === segment)
    );
    
    if (!dimensionWithOption) return;
    
    // Update morphology with new value
    const updatedMorphology = { 
      ...morphology, 
      [dimensionWithOption.key]: optionValue 
    };
    
    onMorphologyChange(updatedMorphology);
    setSelectedDimension(null);
  };

  const selectedDimensionData = selectedDimension !== null ? (() => {
    const segment = dnaCode.split('-')[selectedDimension];
    
    // Find dimension by option value, not by index
    const dimensionWithOption = MORPHOLOGY_DIMENSIONS.find(dim => 
      dim.options.some(opt => opt.value === segment)
    );
    
    if (!dimensionWithOption) {
      console.error('No dimension found for segment:', segment);
      return null;
    }
    
    const dimension = dimensionWithOption;
    const option = dimension.options.find(opt => opt.value === segment);
    
    return { dimension, option };
  })() : null;

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
        
        {/* Base pair connections between strands */}
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
          if (!segment) return null;
          
          // CRITICAL FIX: Find dimension by option value, NOT by index
          const dimensionWithOption = MORPHOLOGY_DIMENSIONS.find(dim => 
            dim.options.some(opt => opt.value === segment)
          );
          
          if (!dimensionWithOption) {
            console.warn('❌ No dimension found for segment:', segment, 'at index', point.index);
            return null;
          }
          
          const dimension = dimensionWithOption;
          const option = dimension.options.find(opt => opt.value === segment);
          const translatedLabel = option ? t(option.translationKey, { lng: currentLanguage }) : segment;
          const shortLabel = translatedLabel.split(' - ')[0] || translatedLabel;
          const fullLabel = translatedLabel;
          
          const categoryColor = CATEGORY_COLORS[dimension.category];
          
          // Dynamic badge width based on text length
          const estimatedWidth = Math.max(70, Math.min(140, shortLabel.length * 9 + 24));
          const badgeHeight = 28;
          
          return (
            <g 
              key={`badge-${point.index}-${segment}`}
              onClick={() => handleBadgeClick(point.index)}
              style={{ cursor: 'pointer' }}
            >
              {/* Badge background */}
              <rect
                x={point.x - estimatedWidth/2}
                y={point.y - badgeHeight/2}
                width={estimatedWidth}
                height={badgeHeight}
                rx="8"
                fill={`hsl(${categoryColor})`}
                className="transition-all hover:opacity-90"
                style={{ pointerEvents: 'all' }}
              />
              
              {/* Keyword text */}
            <foreignObject
              x={point.x - estimatedWidth/2 + 8}
              y={point.y - badgeHeight/2 + 4}
              width={estimatedWidth - 16}
              height={badgeHeight - 8}
                style={{ pointerEvents: 'none' }}
              >
                <div 
                  className="flex items-center justify-center h-full text-white text-xs font-mono font-bold text-center leading-tight px-1"
                  style={{ fontSize: '12px' }}
                >
                  {shortLabel}
                </div>
              </foreignObject>
              
              {/* Tooltip shows full label */}
              <title>{fullLabel}</title>
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
          translationKey: `morphology.dimensions.${selectedDimensionData.dimension.key}.options.${dnaCode.split('-')[selectedDimension!]}`
        }}
        allOptions={selectedDimensionData.dimension.options}
        onOptionSelect={handleOptionSelect}
      />
    )}
    </>
  );
}
