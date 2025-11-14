import { BodyData } from './bodyDataCalculator';
import vitruvianBody from '@/assets/vitruvian-body.png';
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
    <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
      {/* Vitruvian Man Background Image */}
      <img 
        src={vitruvianBody} 
        alt="Vitruvian Man"
        className="absolute inset-0 w-full h-full object-contain"
      />
      
      {/* SVG Overlay Layer */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Head */}
        <g>
          <HeadPart 
            data={data.head}
            isHovered={hoveredPart === 'head'}
            onHover={() => onHoverPart('head')}
            onLeave={() => onHoverPart(null)}
          />
          {/* Number Badge */}
          <circle cx="63" cy="10" r="3" fill="white" opacity="0.9" />
          <text x="63" y="11.5" className="fill-foreground text-[4px] font-bold" textAnchor="middle">1</text>
        </g>
        
        {/* Face */}
        <g>
          <FacePart 
            data={data.face}
            isHovered={hoveredPart === 'face'}
            onHover={() => onHoverPart('face')}
            onLeave={() => onHoverPart(null)}
          />
          {/* Number Badge */}
          <circle cx="63" cy="15" r="3" fill="white" opacity="0.9" />
          <text x="63" y="16.5" className="fill-foreground text-[4px] font-bold" textAnchor="middle">2</text>
        </g>
        
        {/* Shoulders */}
        <g>
          <ShouldersPart 
            data={data.shoulders}
            isHovered={hoveredPart === 'shoulders'}
            onHover={() => onHoverPart('shoulders')}
            onLeave={() => onHoverPart(null)}
          />
          {/* Number Badge */}
          <circle cx="25" cy="26" r="3" fill="white" opacity="0.9" />
          <text x="25" y="27.5" className="fill-foreground text-[4px] font-bold" textAnchor="middle">3</text>
        </g>
        
        {/* Torso */}
        <g>
          <TorsoPart 
            data={data.torso}
            isHovered={hoveredPart === 'torso'}
            onHover={() => onHoverPart('torso')}
            onLeave={() => onHoverPart(null)}
          />
          {/* Number Badge */}
          <circle cx="65" cy="38" r="3" fill="white" opacity="0.9" />
          <text x="65" y="39.5" className="fill-foreground text-[4px] font-bold" textAnchor="middle">4</text>
        </g>
        
        {/* Belly */}
        <g>
          <BellyPart 
            data={data.belly}
            isHovered={hoveredPart === 'belly'}
            onHover={() => onHoverPart('belly')}
            onLeave={() => onHoverPart(null)}
          />
          {/* Number Badge */}
          <circle cx="63" cy="52" r="3" fill="white" opacity="0.9" />
          <text x="63" y="53.5" className="fill-foreground text-[4px] font-bold" textAnchor="middle">5</text>
        </g>
        
        {/* Spine */}
        <g>
          <SpinePart 
            data={data.spine}
            isHovered={hoveredPart === 'spine'}
            onHover={() => onHoverPart('spine')}
            onLeave={() => onHoverPart(null)}
          />
          {/* Number Badge */}
          <circle cx="35" cy="45" r="3" fill="white" opacity="0.9" />
          <text x="35" y="46.5" className="fill-foreground text-[4px] font-bold" textAnchor="middle">6</text>
        </g>
        
        {/* Legs */}
        <g>
          <LegsPart 
            data={data.legs}
            isHovered={hoveredPart === 'legs'}
            onHover={() => onHoverPart('legs')}
            onLeave={() => onHoverPart(null)}
          />
          {/* Number Badge */}
          <circle cx="38" cy="80" r="3" fill="white" opacity="0.9" />
          <text x="38" y="81.5" className="fill-foreground text-[4px] font-bold" textAnchor="middle">7</text>
        </g>
      </svg>
    </div>
  );
}
