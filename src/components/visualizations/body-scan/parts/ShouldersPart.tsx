interface ShouldersPartProps {
  data: {
    width: number;
    color: string;
    tension: number;
    icons: string[];
  };
}

export function ShouldersPart({ data }: ShouldersPartProps) {
  const { width, color, tension, icons } = data;
  
  const shoulderWidth = 40 * width;
  const shoulderHeight = 15 + (tension * 5);
  
  return (
    <g>
      {/* Left shoulder */}
      <ellipse
        cx={-shoulderWidth / 2}
        cy="0"
        rx={shoulderWidth / 3}
        ry={shoulderHeight}
        fill={color}
        opacity="0.9"
        className="transition-all duration-500"
      />
      
      {/* Right shoulder */}
      <ellipse
        cx={shoulderWidth / 2}
        cy="0"
        rx={shoulderWidth / 3}
        ry={shoulderHeight}
        fill={color}
        opacity="0.9"
        className="transition-all duration-500"
      />
      
      {/* Left arm */}
      <rect
        x={-shoulderWidth / 2 - 8}
        y="10"
        width="10"
        height="40"
        rx="5"
        fill={color}
        opacity="0.8"
        className="transition-all duration-500"
      />
      
      {/* Right arm */}
      <rect
        x={shoulderWidth / 2 - 2}
        y="10"
        width="10"
        height="40"
        rx="5"
        fill={color}
        opacity="0.8"
        className="transition-all duration-500"
      />
      
      {/* Warning icons */}
      {icons.map((icon, index) => (
        <text
          key={index}
          x={index === 0 ? -shoulderWidth / 2 : shoulderWidth / 2}
          y="-5"
          fontSize="14"
          textAnchor="middle"
          className="animate-pulse"
        >
          {icon}
        </text>
      ))}
    </g>
  );
}
