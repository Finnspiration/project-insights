import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { DimensionDetailDialog } from '@/components/morphology/DimensionDetailDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  // Map evidence to dimension keys
  const evidenceDimensionKeys = evidence.map(e => {
    const dim = MORPHOLOGY_DIMENSIONS.find(d => 
      t(`morphology.dimensions.${d.key}.title`) === e.dimension ||
      d.key === e.dimension
    );
    return dim?.key;
  }).filter(Boolean);

  // Calculate compact DNA helix points
  const totalWidth = 800;
  const startX = 100;
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
      x: xPosition,
      y: yPosition,
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

  const selectedDimensionData = selectedDimension ? (() => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === selectedDimension);
    if (!dimension) return null;
    
    const value = morphology[selectedDimension];
    const option = dimension.options.find(opt => opt.value === value);
    
    return { dimension, option };
  })() : null;

  return (
    <>
      <TooltipProvider>
        <div className="w-full overflow-x-auto">
          <svg 
            viewBox="0 0 1000 200" 
            className="w-full h-auto"
            style={{ minWidth: '800px' }}
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
              const categoryColor = CATEGORY_COLORS[point.dimension.category];
              const value = morphology[point.dimension.key];
              
              return (
                <Tooltip key={`nucleotide-${point.index}`}>
                  <TooltipTrigger asChild>
                    <g 
                      onClick={() => handleNucleotideClick(point.dimension.key)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      {point.isHighlighted && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="14"
                          fill="hsl(45, 100%, 50%)"
                          opacity="0.3"
                          filter="url(#glow)"
                          className="animate-pulse"
                        />
                      )}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={point.isHighlighted ? "10" : "7"}
                        fill={point.isHighlighted ? "hsl(45, 100%, 60%)" : categoryColor}
                        opacity={point.isHighlighted ? "1" : "0.6"}
                        stroke={point.isHighlighted ? "hsl(45, 100%, 70%)" : "hsl(var(--border))"}
                        strokeWidth={point.isHighlighted ? "2" : "1"}
                      />
                    </g>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {t(`morphology.dimensions.${point.dimension.key}.title`)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {value}
                      </p>
                      {point.evidenceItem && (
                        <p className="text-xs text-amber-500 mt-2 italic">
                          {point.evidenceItem.reasoning}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </div>
      </TooltipProvider>

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
