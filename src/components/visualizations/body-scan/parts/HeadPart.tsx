interface HeadPartProps {
  data: {
    complexity: string;
    knowledge: string;
    color: string;
    clarity: number;
  };
}

export function HeadPart({ data }: HeadPartProps) {
  const { complexity, knowledge, color, clarity } = data;
  
  const getKnowledgeSymbol = (knowledge: string): string => {
    const map: Record<string, string> = {
      routine: '⚙️',
      adaptive: '🔄',
      innovative: '💡',
      breakthrough: '🚀'
    };
    return map[knowledge] || '⚙️';
  };
  
  const isComplex = complexity === 'complex' || complexity === 'chaotic';
  
  return (
    <g>
      {/* Halo (clarity indicator) */}
      {clarity > 0.6 && (
        <circle
          r="38"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={0.3}
          className="animate-pulse"
        />
      )}
      
      {/* Main head circle */}
      <circle
        r="30"
        fill={color}
        opacity={clarity}
        className="transition-all duration-500"
      />
      
      {/* Brain pattern for complex/chaotic */}
      {isComplex && (
        <>
          <path
            d="M -15,-10 Q -10,-15 -5,-10 T 5,-10 T 15,-10"
            stroke="white"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M -15,0 Q -10,-5 -5,0 T 5,0 T 15,0"
            stroke="white"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M -15,10 Q -10,5 -5,10 T 5,10 T 15,10"
            stroke="white"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </>
      )}
      
      {/* Knowledge symbol */}
      <text 
        y="8" 
        textAnchor="middle" 
        fontSize="18"
        className="fill-white"
      >
        {getKnowledgeSymbol(knowledge)}
      </text>
    </g>
  );
}
