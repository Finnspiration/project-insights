import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BodyVisualization } from './body-scan/BodyVisualization';
import { BodyPartExplanation } from './body-scan/BodyPartExplanation';
import { RecommendationCard } from './body-scan/RecommendationCard';
import { InterventionCard } from './body-scan/InterventionCard';
import { calculateBodyData } from './body-scan/bodyDataCalculator';

interface ProjectBodyScanProps {
  morphology: any;
  documents?: any[];
  projectPatterns?: any;
}

export function ProjectBodyScan({ morphology, documents, projectPatterns }: ProjectBodyScanProps) {
  const { t } = useTranslation('common');
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  
  const bodyData = calculateBodyData(morphology, documents, projectPatterns);
  
  // Get top 3 recommendations
  const topRecommendations = projectPatterns?.recommendations
    ?.sort((a: any, b: any) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 3) || [];
  
  // Map recommendations to affected body parts
  const getAffectedParts = (rec: any): string[] => {
    const parts: string[] = [];
    if (rec.title?.toLowerCase().includes('relation') || rec.title?.toLowerCase().includes('forbund')) {
      parts.push('torso', 'face');
    }
    if (rec.title?.toLowerCase().includes('ledelse') || rec.title?.toLowerCase().includes('leadership')) {
      parts.push('head', 'shoulders');
    }
    if (rec.title?.toLowerCase().includes('proces') || rec.title?.toLowerCase().includes('process')) {
      parts.push('belly', 'spine');
    }
    if (rec.title?.toLowerCase().includes('handling') || rec.title?.toLowerCase().includes('action')) {
      parts.push('legs');
    }
    return parts.length > 0 ? parts : ['torso']; // Default to torso
  };
  
  const hasDocuments = documents && documents.length > 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{t('visualizations.bodyScan.title')}</CardTitle>
            <CardDescription>
              {t('visualizations.bodyScan.description')}
            </CardDescription>
          </div>
          {hasDocuments ? (
            <Badge variant="secondary" className="bg-chart-1/10 text-chart-1">
              {t('visualizations.bodyScan.basedOnDocuments', { count: documents.length })}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted">
              {t('visualizations.bodyScan.basedOnMorphologyOnly')}
            </Badge>
          )}
        </div>
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
                  documents={documents}
                  isHovered={hoveredPart === 'head'}
                  onHover={() => setHoveredPart('head')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="face" 
                  data={bodyData.face}
                  morphology={morphology}
                  documents={documents}
                  isHovered={hoveredPart === 'face'}
                  onHover={() => setHoveredPart('face')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="shoulders" 
                  data={bodyData.shoulders}
                  morphology={morphology}
                  documents={documents}
                  isHovered={hoveredPart === 'shoulders'}
                  onHover={() => setHoveredPart('shoulders')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="torso" 
                  data={bodyData.torso}
                  morphology={morphology}
                  documents={documents}
                  isHovered={hoveredPart === 'torso'}
                  onHover={() => setHoveredPart('torso')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="belly" 
                  data={bodyData.belly}
                  morphology={morphology}
                  documents={documents}
                  isHovered={hoveredPart === 'belly'}
                  onHover={() => setHoveredPart('belly')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="spine" 
                  data={bodyData.spine}
                  morphology={morphology}
                  documents={documents}
                  isHovered={hoveredPart === 'spine'}
                  onHover={() => setHoveredPart('spine')}
                  onLeave={() => setHoveredPart(null)}
                />
                
                <BodyPartExplanation 
                  part="legs" 
                  data={bodyData.legs}
                  morphology={morphology}
                  documents={documents}
                  isHovered={hoveredPart === 'legs'}
                  onHover={() => setHoveredPart('legs')}
                  onLeave={() => setHoveredPart(null)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* AI-Driven Recommendations */}
        {topRecommendations.length > 0 && (
          <div className="mt-8 p-6 bg-muted/30 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🎯 {t('visualizations.bodyScan.aiRecommendations')}
            </h3>
            <div className="space-y-3">
              {topRecommendations.map((rec: any, idx: number) => (
                <RecommendationCard
                  key={idx}
                  recommendation={rec}
                  affectedParts={getAffectedParts(rec)}
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Suggested Interventions */}
        {projectPatterns?.interventions && projectPatterns.interventions.length > 0 && (
          <div className="mt-6 p-6 bg-muted/30 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🛠️ {t('visualizations.bodyScan.suggestedInterventions')}
            </h3>
            <div className="space-y-3">
              {projectPatterns.interventions.slice(0, 5).map((intervention: any, idx: number) => (
                <InterventionCard
                  key={idx}
                  intervention={intervention}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
