interface BellyPartProps {
  data: {
    stability: number;
    color: string;
    pattern: 'solid' | 'dots' | 'stripes' | 'waves';
    turbulence: number;
  };
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export function BellyPart({ data, isHovered, onHover, onLeave }: BellyPartProps) {
  const { stability, color, pattern, turbulence } = data;
  
  const bellySize = 30 - (stability * 5);
  
  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      <defs>
        {/* Dot pattern */}
        <pattern id="dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.5" fill="white" opacity="0.4" />
        </pattern>
        
        {/* Stripe pattern */}
        <pattern id="stripes" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2" opacity="0.3" />
        </pattern>
        
        {/* Wave pattern */}
        <pattern id="waves" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
          <path d="M 0,5 Q 5,0 10,5 T 20,5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
        </pattern>
      </defs>
      
      {/* Main belly */}
      <ellipse
        cx="0"
        cy="0"
        rx={bellySize}
        ry={bellySize * 0.9}
        fill={color}
        opacity={isHovered ? 0.95 : 0.85}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        className="transition-all duration-300"
      />
      
      {/* Pattern overlay */}
      {pattern !== 'solid' && (
        <ellipse
          cx="0"
          cy="0"
          rx={bellySize}
          ry={bellySize * 0.9}
          fill={`url(#${pattern})`}
        />
      )}
      
      {/* Turbulence indicator */}
      {turbulence > 0.5 && (
        <g className="animate-pulse">
          <path
            d="M -15,0 Q -10,-5 -5,0 T 5,0 T 15,0"
            stroke="white"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        </g>
      )}
    </g>
  );
}
