interface ShouldersPartProps {
  data: {
    width: number;
    color: string;
    tension: number;
    icons: string[];
  };
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export function ShouldersPart({ data, isHovered, onHover, onLeave }: ShouldersPartProps) {
  const { width, color, tension, icons } = data;
  
  const shoulderWidth = 45 * width;
  const shoulderHeight = 15 + (tension * 5);
  
  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      {/* Left shoulder */}
      <ellipse
        cx={-shoulderWidth / 2}
        cy="0"
        rx={shoulderWidth / 3}
        ry={shoulderHeight}
        fill={color}
        opacity={isHovered ? 1 : 0.9}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        className="transition-all duration-300"
      />
      
      {/* Right shoulder */}
      <ellipse
        cx={shoulderWidth / 2}
        cy="0"
        rx={shoulderWidth / 3}
        ry={shoulderHeight}
        fill={color}
        opacity={isHovered ? 1 : 0.9}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        className="transition-all duration-300"
      />
      
      {/* Left arm - longer and more visible */}
      <rect
        x={-shoulderWidth / 2 - 10}
        y="10"
        width="12"
        height="90"
        rx="6"
        fill={color}
        opacity={isHovered ? 0.95 : 0.85}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        className="transition-all duration-300"
      />
      
      {/* Right arm - longer and more visible */}
      <rect
        x={shoulderWidth / 2 - 2}
        y="10"
        width="12"
        height="90"
        rx="6"
        fill={color}
        opacity={isHovered ? 0.95 : 0.85}
        stroke={isHovered ? 'white' : 'none'}
        strokeWidth={isHovered ? 2 : 0}
        className="transition-all duration-300"
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
