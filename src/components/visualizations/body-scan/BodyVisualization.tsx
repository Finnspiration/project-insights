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
}

export function BodyVisualization({ data }: BodyVisualizationProps) {
  return (
    <svg 
      viewBox="0 0 200 400" 
      className="w-full max-w-md mx-auto"
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
    >
      {/* Spine (drawn first, in background) */}
      <g transform="translate(100, 120)">
        <SpinePart data={data.spine} />
      </g>
      
      {/* Head */}
      <g transform="translate(100, 40)">
        <HeadPart data={data.head} />
      </g>
      
      {/* Face */}
      <g transform="translate(100, 50)">
        <FacePart data={data.face} />
      </g>
      
      {/* Shoulders */}
      <g transform="translate(100, 90)">
        <ShouldersPart data={data.shoulders} />
      </g>
      
      {/* Torso */}
      <g transform="translate(100, 150)">
        <TorsoPart data={data.torso} />
      </g>
      
      {/* Belly */}
      <g transform="translate(100, 210)">
        <BellyPart data={data.belly} />
      </g>
      
      {/* Legs */}
      <g transform="translate(100, 260)">
        <LegsPart data={data.legs} />
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
