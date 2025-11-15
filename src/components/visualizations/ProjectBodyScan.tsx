import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BodyVisualization } from './body-scan/BodyVisualization';
import { BodyPartExplanation } from './body-scan/BodyPartExplanation';
import { calculateBodyData } from './body-scan/bodyDataCalculator';

interface ProjectBodyScanProps {
  morphology: any;
}

export function ProjectBodyScan({ morphology }: ProjectBodyScanProps) {
  const { t } = useTranslation('common');
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  
  const bodyData = calculateBodyData(morphology);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('visualizations.bodyScan.title')}</CardTitle>
        <CardDescription>
          {t('visualizations.bodyScan.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: SVG Body */}
          <div className="flex items-center justify-center bg-muted/20 rounded-lg p-8">
            <BodyVisualization 
              data={bodyData}
              hoveredPart={hoveredPart}
              onHoverPart={setHoveredPart}
            />
          </div>
          
          {/* Right: Explanations */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t('visualizations.bodyScan.vitalSigns')}
              </h3>
              <div className="space-y-4">
                <BodyPartExplanation 
                  part="head" 
                  data={bodyData.head}
                  morphology={morphology}
                  isHovered={hoveredPart === 'head'}
                  onHover={() => setHoveredPart('head')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="face" 
                  data={bodyData.face}
                  morphology={morphology}
                  isHovered={hoveredPart === 'face'}
                  onHover={() => setHoveredPart('face')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="shoulders" 
                  data={bodyData.shoulders}
                  morphology={morphology}
                  isHovered={hoveredPart === 'shoulders'}
                  onHover={() => setHoveredPart('shoulders')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="torso" 
                  data={bodyData.torso}
                  morphology={morphology}
                  isHovered={hoveredPart === 'torso'}
                  onHover={() => setHoveredPart('torso')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="belly" 
                  data={bodyData.belly}
                  morphology={morphology}
                  isHovered={hoveredPart === 'belly'}
                  onHover={() => setHoveredPart('belly')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="spine" 
                  data={bodyData.spine}
                  morphology={morphology}
                  isHovered={hoveredPart === 'spine'}
                  onHover={() => setHoveredPart('spine')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="legs" 
                  data={bodyData.legs}
                  morphology={morphology}
                  isHovered={hoveredPart === 'legs'}
                  onHover={() => setHoveredPart('legs')}
                  onLeave={() => setHoveredPart(null)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
