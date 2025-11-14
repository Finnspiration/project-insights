interface FacePartProps {
  data: {
    expression: 'smile' | 'neutral' | 'tense' | 'frown';
    eyes: 'calm' | 'focused' | 'sharp' | 'stressed';
    tension: number;
  };
}

export function FacePart({ data }: FacePartProps) {
  const { expression, eyes, tension } = data;
  
  const getMouthPath = (expr: string): string => {
    const paths: Record<string, string> = {
      smile: 'M -8,5 Q 0,10 8,5',
      neutral: 'M -8,5 L 8,5',
      tense: 'M -8,5 Q 0,3 8,5',
      frown: 'M -8,8 Q 0,3 8,8'
    };
    return paths[expr] || paths.neutral;
  };
  
  const getEyeShape = (eyeType: string): { left: string; right: string } => {
    const shapes: Record<string, { left: string; right: string }> = {
      calm: { left: 'M -15,-5 Q -12,-8 -9,-5', right: 'M 9,-5 Q 12,-8 15,-5' },
      focused: { left: 'M -16,-5 L -8,-5', right: 'M 8,-5 L 16,-5' },
      sharp: { left: 'M -16,-3 L -12,-7 L -8,-3', right: 'M 8,-3 L 12,-7 L 16,-3' },
      stressed: { left: 'M -16,-8 Q -12,-4 -8,-8', right: 'M 8,-8 Q 12,-4 16,-8' }
    };
    return shapes[eyeType] || shapes.calm;
  };
  
  const eyeShape = getEyeShape(eyes);
  
  return (
    <g>
      {/* Left eye */}
      <path
        d={eyeShape.left}
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      
      {/* Right eye */}
      <path
        d={eyeShape.right}
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      
      {/* Pupils (for focused/sharp eyes) */}
      {(eyes === 'focused' || eyes === 'sharp') && (
        <>
          <circle cx="-12" cy="-5" r="2" fill="white" />
          <circle cx="12" cy="-5" r="2" fill="white" />
        </>
      )}
      
      {/* Mouth */}
      <path
        d={getMouthPath(expression)}
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      
      {/* Tension lines */}
      {tension > 0.5 && (
        <>
          <path d="M -20,-2 L -18,-4" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <path d="M 20,-2 L 18,-4" stroke="white" strokeWidth="1.5" opacity="0.5" />
        </>
      )}
    </g>
  );
}
