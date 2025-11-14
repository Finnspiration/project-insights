import { BodyData } from './bodyDataCalculator';
import vitruvianBody from '@/assets/vitruvian-body.png';

interface BodyVisualizationProps {
  data: BodyData;
  hoveredPart: string | null;
  onHoverPart: (part: string | null) => void;
}

const getStatusColor = (partData: any): string => {
  if (!partData) return '#10B981'; // Green default
  
  const color = partData.color;
  
  // Critical/Danger - Red
  if (color === '#EF4444' || color === '#DC2626') return '#EF4444';
  
  // Warning/Attention - Yellow/Orange
  if (color === '#F59E0B' || color === '#F97316' || color === '#FBBF24') return '#F59E0B';
  
  // Healthy - Green
  return '#10B981';
};

interface BadgeProps {
  cx: number;
  cy: number;
  number: number;
  color: string;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const NumberBadge = ({ cx, cy, number, color, isHovered, onHover, onLeave }: BadgeProps) => (
  <g 
    className="cursor-pointer"
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
  >
    <circle 
      cx={cx} 
      cy={cy} 
      r="5" 
      fill={color}
      stroke="white"
      strokeWidth={isHovered ? "1.5" : "1"}
      className="transition-all duration-300"
      style={{
        filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.9))' : 'none'
      }}
    />
    <text 
      x={cx} 
      y={cy + 1.8} 
      className="fill-white text-[5px] font-bold pointer-events-none" 
      textAnchor="middle"
    >
      {number}
    </text>
  </g>
);

export function BodyVisualization({ data, hoveredPart, onHoverPart }: BodyVisualizationProps) {
  const bodyParts = [
    { name: 'head', data: data.head, cx: 50, cy: 8, number: 1 },
    { name: 'face', data: data.face, cx: 50, cy: 14, number: 2 },
    { name: 'shoulders', data: data.shoulders, cx: 23, cy: 24, number: 3 },
    { name: 'torso', data: data.torso, cx: 68, cy: 36, number: 4 },
    { name: 'belly', data: data.belly, cx: 50, cy: 50, number: 5 },
    { name: 'spine', data: data.spine, cx: 32, cy: 42, number: 6 },
    { name: 'legs', data: data.legs, cx: 36, cy: 78, number: 7 },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
      {/* Vitruvian Man Background Image */}
      <img 
        src={vitruvianBody} 
        alt="Vitruvian Man"
        className="absolute inset-0 w-full h-full object-contain"
      />
      
      {/* Number Badges Overlay */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {bodyParts.map((part) => (
          <NumberBadge
            key={part.name}
            cx={part.cx}
            cy={part.cy}
            number={part.number}
            color={getStatusColor(part.data)}
            isHovered={hoveredPart === part.name}
            onHover={() => onHoverPart(part.name)}
            onLeave={() => onHoverPart(null)}
          />
        ))}
      </svg>
    </div>
  );
}
