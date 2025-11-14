interface TorsoPartProps {
  data: {
    color: string;
    openness: number;
    heartStrength: number;
  };
}

export function TorsoPart({ data }: TorsoPartProps) {
  const { color, openness, heartStrength } = data;
  
  const torsoWidth = 35 + (openness * 10);
  
  return (
    <g>
      {/* Main torso */}
      <ellipse
        cx="0"
        cy="0"
        rx={torsoWidth}
        ry="35"
        fill={color}
        opacity="0.85"
        className="transition-all duration-500"
      />
      
      {/* Heart symbol */}
      <g transform="scale(0.8)">
        <path
          d="M 0,5 C -3,0 -8,-2 -10,2 C -12,6 -10,10 0,15 C 10,10 12,6 10,2 C 8,-2 3,0 0,5 Z"
          fill="white"
          opacity={heartStrength * 0.8}
          className="transition-all duration-500"
        />
        
        {/* Heart pulse effect */}
        {heartStrength > 0.7 && (
          <circle
            cx="0"
            cy="7"
            r="12"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.3"
            className="animate-pulse"
          />
        )}
      </g>
      
      {/* Openness lines (culture) */}
      {openness > 0.6 && (
        <>
          <line x1="-20" y1="-15" x2="-25" y2="-20" stroke="white" strokeWidth="2" opacity="0.4" />
          <line x1="20" y1="-15" x2="25" y2="-20" stroke="white" strokeWidth="2" opacity="0.4" />
          <line x1="-20" y1="15" x2="-25" y2="20" stroke="white" strokeWidth="2" opacity="0.4" />
          <line x1="20" y1="15" x2="25" y2="20" stroke="white" strokeWidth="2" opacity="0.4" />
        </>
      )}
    </g>
  );
}
