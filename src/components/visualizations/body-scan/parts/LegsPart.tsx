interface LegsPartProps {
  data: {
    stability: number;
    momentum: number;
    stance: 'forward' | 'neutral' | 'backward';
  };
}

export function LegsPart({ data }: LegsPartProps) {
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
    <g>
      {/* Left leg */}
      <rect
        x="-18"
        y="0"
        width="12"
        height="60"
        rx="6"
        fill={legColor}
        opacity="0.85"
        transform={`translate(${offset.left}, 0)`}
        className="transition-all duration-500"
      />
      
      {/* Right leg */}
      <rect
        x="6"
        y="0"
        width="12"
        height="60"
        rx="6"
        fill={legColor}
        opacity="0.85"
        transform={`translate(${offset.right}, 0)`}
        className="transition-all duration-500"
      />
      
      {/* Left foot */}
      <ellipse
        cx={-12 + offset.left}
        cy="68"
        rx="10"
        ry="6"
        fill={legColor}
        opacity="0.9"
        className="transition-all duration-500"
      />
      
      {/* Right foot */}
      <ellipse
        cx={12 + offset.right}
        cy="68"
        rx="10"
        ry="6"
        fill={legColor}
        opacity="0.9"
        className="transition-all duration-500"
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
