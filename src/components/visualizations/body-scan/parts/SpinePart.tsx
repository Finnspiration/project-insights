interface SpinePartProps {
  data: {
    structure: 'rigid' | 'hierarchical' | 'network' | 'distributed';
    strength: number;
    segments: number;
  };
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export function SpinePart({ data, isHovered, onHover, onLeave }: SpinePartProps) {
  const { structure, strength, segments } = data;
  
  const spineColor = `hsl(var(--muted-foreground))`;
  const opacity = 0.4 + (strength * 0.4);
  
  if (structure === 'rigid') {
    return (
      <g
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="cursor-pointer"
      >
        {/* Hover highlight area */}
        {isHovered && (
          <rect
            x="-15"
            y="-10"
            width="30"
            height="160"
            fill="white"
            opacity="0.1"
            rx="5"
          />
        )}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="140"
          stroke={spineColor}
          strokeWidth={isHovered ? 5 : 4}
          opacity={isHovered ? opacity + 0.2 : opacity}
          className="transition-all duration-300"
        />
      </g>
    );
  }
  
  if (structure === 'hierarchical') {
    return (
      <g
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="cursor-pointer"
      >
        {isHovered && (
          <rect
            x="-15"
            y="-10"
            width="30"
            height="160"
            fill="white"
            opacity="0.1"
            rx="5"
          />
        )}
        {Array.from({ length: segments }).map((_, i) => (
          <circle
            key={i}
            cx="0"
            cy={i * (140 / (segments - 1))}
            r={isHovered ? 5 : 4}
            fill={spineColor}
            opacity={isHovered ? opacity + 0.2 : opacity}
            className="transition-all duration-300"
          />
        ))}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="140"
          stroke={spineColor}
          strokeWidth={isHovered ? 3 : 2}
          opacity={(isHovered ? opacity + 0.2 : opacity) * 0.6}
          className="transition-all duration-300"
        />
      </g>
    );
  }
  
  if (structure === 'network') {
    return (
      <g
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="cursor-pointer"
      >
        {isHovered && (
          <rect
            x="-15"
            y="-10"
            width="30"
            height="160"
            fill="white"
            opacity="0.1"
            rx="5"
          />
        )}
        {Array.from({ length: segments }).map((_, i) => {
          const y = i * (140 / (segments - 1));
          return (
            <g key={i}>
              <circle 
                cx="0" 
                cy={y} 
                r={isHovered ? 4 : 3} 
                fill={spineColor} 
                opacity={isHovered ? opacity + 0.2 : opacity}
                className="transition-all duration-300"
              />
              {i > 0 && (
                <>
                  <line
                    x1="0"
                    y1={(i - 1) * (140 / (segments - 1))}
                    x2="0"
                    y2={y}
                    stroke={spineColor}
                    strokeWidth={isHovered ? 3 : 2}
                    opacity={(isHovered ? opacity + 0.2 : opacity) * 0.5}
                    className="transition-all duration-300"
                  />
                  <line
                    x1="-8"
                    y1={(i - 1) * (140 / (segments - 1))}
                    x2="8"
                    y2={y}
                    stroke={spineColor}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={(isHovered ? opacity + 0.2 : opacity) * 0.3}
                    className="transition-all duration-300"
                  />
                </>
              )}
            </g>
          );
        })}
      </g>
    );
  }
  
  // Distributed
  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      {isHovered && (
        <rect
          x="-20"
          y="-10"
          width="40"
          height="160"
          fill="white"
          opacity="0.1"
          rx="5"
        />
      )}
      {Array.from({ length: segments }).map((_, i) => {
        const y = i * (140 / (segments - 1));
        const offset = Math.sin(i) * 5;
        return (
          <g key={i}>
            <circle 
              cx={offset} 
              cy={y} 
              r={isHovered ? 3.5 : 2.5} 
              fill={spineColor} 
              opacity={isHovered ? opacity + 0.2 : opacity}
              className="transition-all duration-300"
            />
            {i > 0 && (
              <>
                <line
                  x1={Math.sin(i - 1) * 5}
                  y1={(i - 1) * (140 / (segments - 1))}
                  x2={offset}
                  y2={y}
                  stroke={spineColor}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  opacity={(isHovered ? opacity + 0.2 : opacity) * 0.4}
                  strokeDasharray="2,2"
                  className="transition-all duration-300"
                />
                {i % 2 === 0 && (
                  <line
                    x1={offset - 10}
                    y1={y}
                    x2={offset + 10}
                    y2={y}
                    stroke={spineColor}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={(isHovered ? opacity + 0.2 : opacity) * 0.2}
                    className="transition-all duration-300"
                  />
                )}
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
