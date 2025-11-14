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
            <BodyVisualization data={bodyData} />
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
                />
                <Separator />
                
                <BodyPartExplanation 
                  part="face" 
                  data={bodyData.face}
                  morphology={morphology}
                />
                <Separator />
                
                <BodyPartExplanation 
                  part="shoulders" 
                  data={bodyData.shoulders}
                  morphology={morphology}
                />
                <Separator />
                
                <BodyPartExplanation 
                  part="torso" 
                  data={bodyData.torso}
                  morphology={morphology}
                />
                <Separator />
                
                <BodyPartExplanation 
                  part="belly" 
                  data={bodyData.belly}
                  morphology={morphology}
                />
                <Separator />
                
                <BodyPartExplanation 
                  part="spine" 
                  data={bodyData.spine}
                  morphology={morphology}
                />
                <Separator />
                
                <BodyPartExplanation 
                  part="legs" 
                  data={bodyData.legs}
                  morphology={morphology}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
