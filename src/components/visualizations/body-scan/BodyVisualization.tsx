import { BodyData } from './bodyDataCalculator';
import { HeadPart } from './parts/HeadPart';
import { FacePart } from './parts/FacePart';
import { ShouldersPart } from './parts/ShouldersPart';
import { TorsoPart } from './parts/TorsoPart';
import { BellyPart } from './parts/BellyPart';
import { SpinePart } from './parts/SpinePart';
import { LegsPart } from './parts/LegsPart';

interface BodyVisualizationProps {
  data: BodyData;
  hoveredPart: string | null;
  onHoverPart: (part: string | null) => void;
}

export function BodyVisualization({ data, hoveredPart, onHoverPart }: BodyVisualizationProps) {
  return (
    <svg 
      viewBox="0 0 200 480" 
      className="w-full max-w-md mx-auto"
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
    >
      {/* Spine (drawn first, in background) */}
      <g transform="translate(100, 150)">
        <SpinePart 
          data={data.spine}
          isHovered={hoveredPart === 'spine'}
          onHover={() => onHoverPart('spine')}
          onLeave={() => onHoverPart(null)}
        />
      </g>
      
      {/* Head */}
      <g transform="translate(100, 40)">
        <HeadPart 
          data={data.head}
          isHovered={hoveredPart === 'head'}
          onHover={() => onHoverPart('head')}
          onLeave={() => onHoverPart(null)}
        />
        {/* Label */}
        <text x="45" y="5" className="fill-foreground text-xs font-bold opacity-60">1</text>
      </g>
      
      {/* Face */}
      <g transform="translate(100, 60)">
        <FacePart 
          data={data.face}
          isHovered={hoveredPart === 'face'}
          onHover={() => onHoverPart('face')}
          onLeave={() => onHoverPart(null)}
        />
        {/* Label */}
        <text x="35" y="5" className="fill-foreground text-xs font-bold opacity-60">2</text>
      </g>
      
      {/* Shoulders */}
      <g transform="translate(100, 110)">
        <ShouldersPart 
          data={data.shoulders}
          isHovered={hoveredPart === 'shoulders'}
          onHover={() => onHoverPart('shoulders')}
          onLeave={() => onHoverPart(null)}
        />
        {/* Label */}
        <text x="-70" y="25" className="fill-foreground text-xs font-bold opacity-60">3</text>
      </g>
      
      {/* Torso */}
      <g transform="translate(100, 180)">
        <TorsoPart 
          data={data.torso}
          isHovered={hoveredPart === 'torso'}
          onHover={() => onHoverPart('torso')}
          onLeave={() => onHoverPart(null)}
        />
        {/* Label */}
        <text x="45" y="5" className="fill-foreground text-xs font-bold opacity-60">4</text>
      </g>
      
      {/* Belly */}
      <g transform="translate(100, 250)">
        <BellyPart 
          data={data.belly}
          isHovered={hoveredPart === 'belly'}
          onHover={() => onHoverPart('belly')}
          onLeave={() => onHoverPart(null)}
        />
        {/* Label */}
        <text x="35" y="5" className="fill-foreground text-xs font-bold opacity-60">5</text>
      </g>
      
      {/* Legs */}
      <g transform="translate(100, 300)">
        <LegsPart 
          data={data.legs}
          isHovered={hoveredPart === 'legs'}
          onHover={() => onHoverPart('legs')}
          onLeave={() => onHoverPart(null)}
        />
        {/* Label */}
        <text x="-40" y="60" className="fill-foreground text-xs font-bold opacity-60">7</text>
      </g>
      
      {/* Dynamic warning icons */}
      {data.warnings.map((warning, i) => (
        <g key={i} className="animate-pulse">
          <text
            x={warning.x}
            y={warning.y}
            fontSize="16"
            textAnchor="middle"
            opacity={warning.severity === 'high' ? 1 : 0.7}
          >
            {warning.icon}
          </text>
        </g>
      ))}
    </svg>
  );
}
