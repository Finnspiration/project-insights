interface SpinePartProps {
  data: {
    structure: 'rigid' | 'hierarchical' | 'network' | 'distributed';
    strength: number;
    segments: number;
  };
}

export function SpinePart({ data }: SpinePartProps) {
  const { structure, strength, segments } = data;
  
  const spineColor = `hsl(var(--muted-foreground))`;
  const opacity = 0.4 + (strength * 0.4);
  
  if (structure === 'rigid') {
    return (
      <g>
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="140"
          stroke={spineColor}
          strokeWidth="4"
          opacity={opacity}
          className="transition-all duration-500"
        />
      </g>
    );
  }
  
  if (structure === 'hierarchical') {
    return (
      <g>
        {Array.from({ length: segments }).map((_, i) => (
          <circle
            key={i}
            cx="0"
            cy={i * (140 / (segments - 1))}
            r="4"
            fill={spineColor}
            opacity={opacity}
            className="transition-all duration-500"
          />
        ))}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="140"
          stroke={spineColor}
          strokeWidth="2"
          opacity={opacity * 0.6}
        />
      </g>
    );
  }
  
  if (structure === 'network') {
    return (
      <g>
        {Array.from({ length: segments }).map((_, i) => {
          const y = i * (140 / (segments - 1));
          return (
            <g key={i}>
              <circle cx="0" cy={y} r="3" fill={spineColor} opacity={opacity} />
              {i > 0 && (
                <>
                  <line
                    x1="0"
                    y1={(i - 1) * (140 / (segments - 1))}
                    x2="0"
                    y2={y}
                    stroke={spineColor}
                    strokeWidth="2"
                    opacity={opacity * 0.5}
                  />
                  <line
                    x1="-8"
                    y1={(i - 1) * (140 / (segments - 1))}
                    x2="8"
                    y2={y}
                    stroke={spineColor}
                    strokeWidth="1"
                    opacity={opacity * 0.3}
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
    <g>
      {Array.from({ length: segments }).map((_, i) => {
        const y = i * (140 / (segments - 1));
        const offset = Math.sin(i) * 5;
        return (
          <g key={i}>
            <circle cx={offset} cy={y} r="2.5" fill={spineColor} opacity={opacity} />
            {i > 0 && (
              <>
                <line
                  x1={Math.sin(i - 1) * 5}
                  y1={(i - 1) * (140 / (segments - 1))}
                  x2={offset}
                  y2={y}
                  stroke={spineColor}
                  strokeWidth="1.5"
                  opacity={opacity * 0.4}
                  strokeDasharray="2,2"
                />
                {i % 2 === 0 && (
                  <line
                    x1={offset - 10}
                    y1={y}
                    x2={offset + 10}
                    y2={y}
                    stroke={spineColor}
                    strokeWidth="1"
                    opacity={opacity * 0.2}
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
