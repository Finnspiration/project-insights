interface LegsPartProps {
  data: {
    stability: number;
    momentum: number;
    stance: 'forward' | 'neutral' | 'backward';
  };
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export function LegsPart({ data, isHovered, onHover, onLeave }: LegsPartProps) {
  const { stability, momentum, stance } = data;
  
  const legColor = stability > 0.6 
    ? 'hsl(var(--chart-1))' 
    : stability > 0.4 
    ? 'hsl(var(--chart-3))' 
    : 'hsl(var(--chart-5))';
  
  const getStanceOffset = (): { left: number; right: number } => {
    if (stance === 'forward') return { left: -5, right: 5 };
    if (stance === 'backward') return { left: 5, right: -5 };
    return { left: 0, right: 0 };
  };
  
  const offset = getStanceOffset();
  
  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      {/* Left leg - longer and more prominent */}
      <rect
        x="-20"
        y="0"
        width="15"
        height="120"
        rx="8"
        fill={legColor}
        opacity={isHovered ? 0.95 : 0.85}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        transform={`translate(${offset.left}, 0)`}
        className="transition-all duration-300"
      />
      
      {/* Right leg - longer and more prominent */}
      <rect
        x="5"
        y="0"
        width="15"
        height="120"
        rx="8"
        fill={legColor}
        opacity={isHovered ? 0.95 : 0.85}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        transform={`translate(${offset.right}, 0)`}
        className="transition-all duration-300"
      />
      
      {/* Left foot */}
      <ellipse
        cx={-12 + offset.left}
        cy="128"
        rx="12"
        ry="7"
        fill={legColor}
        opacity={isHovered ? 1 : 0.9}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        className="transition-all duration-300"
      />
      
      {/* Right foot */}
      <ellipse
        cx={12 + offset.right}
        cy="128"
        rx="12"
        ry="7"
        fill={legColor}
        opacity={isHovered ? 1 : 0.9}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        className="transition-all duration-300"
      />
      
      {/* Momentum indicator */}
      {momentum > 0.6 && stance === 'forward' && (
        <g className="animate-pulse">
          <path
            d="M 20,30 L 25,28 L 20,26"
            stroke={legColor}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M 20,45 L 25,43 L 20,41"
            stroke={legColor}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </g>
      )}
    </g>
  );
}
