import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';

interface DNAHelixVisualizationProps {
  morphology: Record<string, string>;
  dnaCode: string;
  language?: 'en' | 'da';
}

export function DNAHelixVisualization({ morphology, dnaCode, language = 'en' }: DNAHelixVisualizationProps) {
  const { t, i18n } = useTranslation('common');

  // Calculate triple helix points - 3 strands with 4 dimensions each
  const helixPoints = [
    // Strand 1 (Top) - indices 0, 3, 6, 9
    { x: 100, y: 80, index: 0, strand: 1 },
    { x: 340, y: 60, index: 3, strand: 1 },
    { x: 580, y: 80, index: 6, strand: 1 },
    { x: 820, y: 60, index: 9, strand: 1 },
    
    // Strand 2 (Middle) - indices 1, 4, 7, 10
    { x: 180, y: 160, index: 1, strand: 2 },
    { x: 420, y: 180, index: 4, strand: 2 },
    { x: 660, y: 160, index: 7, strand: 2 },
    { x: 820, y: 180, index: 10, strand: 2 },
    
    // Strand 3 (Bottom) - indices 2, 5, 8, 11
    { x: 260, y: 240, index: 2, strand: 3 },
    { x: 500, y: 260, index: 5, strand: 3 },
    { x: 740, y: 240, index: 8, strand: 3 },
    { x: 820, y: 220, index: 11, strand: 3 },
  ].sort((a, b) => a.index - b.index);

  // Create triangular connections between the 3 strands
  const tripleConnections = [
    // Group 1: indices 0, 1, 2
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
    // Group 2: indices 3, 4, 5
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 5, to: 3 },
    // Group 3: indices 6, 7, 8
    { from: 6, to: 7 },
    { from: 7, to: 8 },
    { from: 8, to: 6 },
    // Group 4: indices 9, 10, 11
    { from: 9, to: 10 },
    { from: 10, to: 11 },
    { from: 11, to: 9 },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg 
        viewBox="0 0 900 320" 
        className="w-full h-auto min-h-[320px]"
        style={{ minWidth: '900px' }}
      >
        {/* Gradients for the three strands */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(220, 70%, 50%)" />
            <stop offset="100%" stopColor="hsl(240, 70%, 50%)" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(280, 65%, 60%)" />
            <stop offset="100%" stopColor="hsl(300, 65%, 60%)" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(340, 75%, 55%)" />
            <stop offset="100%" stopColor="hsl(0, 75%, 55%)" />
          </linearGradient>
        </defs>
        
        {/* Strand 1 - Top strand (blue gradient) */}
        <path
          d="M 100,80 Q 220,70 340,60 Q 460,70 580,80 Q 700,70 820,60"
          stroke="url(#gradient1)"
          fill="none"
          strokeWidth="4"
          opacity="0.7"
        />
        
        {/* Strand 2 - Middle strand (purple gradient) */}
        <path
          d="M 100,160 Q 260,150 420,180 Q 580,150 740,160 Q 780,170 820,180"
          stroke="url(#gradient2)"
          fill="none"
          strokeWidth="4"
          opacity="0.7"
        />
        
        {/* Strand 3 - Bottom strand (pink gradient) */}
        <path
          d="M 100,240 Q 220,230 340,250 Q 540,230 740,240 Q 780,225 820,220"
          stroke="url(#gradient3)"
          fill="none"
          strokeWidth="4"
          opacity="0.7"
        />
        
        {/* Triangular connections between the 3 strands */}
        {tripleConnections.map((pair, idx) => {
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
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          );
        })}
        
        {/* Nucleotide badges */}
        {helixPoints.map((point) => {
          const segment = dnaCode.split('-')[point.index];
          const dimension = MORPHOLOGY_DIMENSIONS[point.index];
          if (!dimension || !segment) return null;
          
          const option = dimension.options.find(opt => opt.value === segment);
          const translatedLabel = option ? t(option.translationKey, { lng: language }) : segment;
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
              <title>{t(dimension.translationKey, { lng: language })}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
