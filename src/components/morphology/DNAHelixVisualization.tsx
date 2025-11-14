import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';

interface DNAHelixVisualizationProps {
  morphology: Record<string, string>;
  dnaCode: string;
  language?: 'en' | 'da';
}

export function DNAHelixVisualization({ morphology, dnaCode, language = 'en' }: DNAHelixVisualizationProps) {
  const { t } = useTranslation('common');

  // Calculate helix points - alternating between top and bottom strands
  const helixPoints = [
    // Top strand (even indices: 0, 2, 4, 6, 8, 10)
    { x: 80, y: 80, index: 0 },
    { x: 220, y: 40, index: 2 },
    { x: 360, y: 80, index: 4 },
    { x: 500, y: 40, index: 6 },
    { x: 640, y: 80, index: 8 },
    { x: 780, y: 40, index: 10 },
    
    // Bottom strand (odd indices: 1, 3, 5, 7, 9, 11)
    { x: 150, y: 220, index: 1 },
    { x: 290, y: 260, index: 3 },
    { x: 430, y: 220, index: 5 },
    { x: 570, y: 260, index: 7 },
    { x: 710, y: 220, index: 9 },
    { x: 820, y: 260, index: 11 },
  ].sort((a, b) => a.index - b.index);

  // Create base pair connections (connecting top and bottom strands)
  const basePairs = [
    { from: 0, to: 1 },
    { from: 2, to: 3 },
    { from: 4, to: 5 },
    { from: 6, to: 7 },
    { from: 8, to: 9 },
    { from: 10, to: 11 },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg 
        viewBox="0 0 900 320" 
        className="w-full h-auto min-h-[320px]"
        style={{ minWidth: '900px' }}
      >
        {/* Top helix curve */}
        <path
          d="M 80,80 Q 220,20 360,80 T 640,80 Q 780,20 780,40"
          stroke="hsl(var(--border))"
          fill="none"
          strokeWidth="2"
          opacity="0.3"
        />
        
        {/* Bottom helix curve */}
        <path
          d="M 150,220 Q 290,280 430,220 T 710,220 Q 820,280 820,260"
          stroke="hsl(var(--border))"
          fill="none"
          strokeWidth="2"
          opacity="0.3"
        />
        
        {/* Base pair connections */}
        {basePairs.map((pair, idx) => {
          const point1 = helixPoints[pair.from];
          const point2 = helixPoints[pair.to];
          return (
            <line
              key={`connection-${idx}`}
              x1={point1.x}
              y1={point1.y}
              x2={point2.x}
              y2={point2.y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.2"
            />
          );
        })}
        
        {/* Nucleotide badges */}
        {helixPoints.map((point) => {
          const segment = dnaCode.split('-')[point.index];
          const dimension = MORPHOLOGY_DIMENSIONS[point.index];
          if (!dimension || !segment) return null;
          
          const option = dimension.options.find(opt => opt.value === segment);
          const translatedLabel = option ? t(option.translationKey) : segment;
          const categoryColor = CATEGORY_COLORS[dimension.category];
          
          return (
            <g key={`badge-${point.index}`}>
              {/* Badge background */}
              <rect
                x={point.x - 50}
                y={point.y - 12}
                width="100"
                height="24"
                rx="12"
                fill={`hsl(${categoryColor})`}
                className="transition-opacity hover:opacity-90"
              />
              
              {/* Badge text */}
              <text
                x={point.x}
                y={point.y + 4}
                textAnchor="middle"
                className="fill-white text-xs font-mono font-semibold pointer-events-none select-none"
                style={{ fontSize: '11px' }}
              >
                {translatedLabel}
              </text>
              
              {/* Hover title (dimension name) */}
              <title>{t(dimension.translationKey)}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
