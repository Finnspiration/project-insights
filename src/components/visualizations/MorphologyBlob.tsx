import { ReactP5Wrapper } from 'react-p5-wrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapMorphologyToBlob } from './blob/blobMapping';
import { detectArchetype } from './blob/blobArchetypes';
import { blobSketch } from './blob/BlobGenerator';

interface MorphologyBlobProps {
  morphology: any;
}

export function MorphologyBlob({ morphology }: MorphologyBlobProps) {
  const { t } = useTranslation();
  
  if (!morphology) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.blob.title')}</CardTitle>
          <CardDescription>{t('visualizations.blob.noData')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const blobData = mapMorphologyToBlob(morphology);
  const archetype = detectArchetype(blobData);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('visualizations.blob.title')}</CardTitle>
        <CardDescription>
          {t('visualizations.blob.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Blob Canvas */}
          <div className="relative flex flex-col items-center">
            <div className="w-full max-w-[500px] aspect-square bg-muted/30 rounded-lg overflow-hidden">
              <ReactP5Wrapper sketch={blobSketch} blobData={blobData} />
            </div>
            
            {/* Archetype Label */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-4xl">{archetype.icon}</span>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: archetype.color }}>
                  {t(archetype.nameKey)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(archetype.descriptionKey)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right: Visual Variable Indicators */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg mb-4">{t('visualizations.blob.properties')}</h3>
            
            <div className="space-y-2">
              <StatusRow
                label={t('visualizations.blob.vars.complexity')}
                value={morphology.complexity}
                detail={`${t('visualizations.blob.vars.roughness')}: ${(blobData.roughness * 100).toFixed(0)}%`}
              />
              
              <StatusRow
                label={t('visualizations.blob.vars.stakeholder')}
                value={morphology.stakeholder}
                detail={`${blobData.arms} ${t('visualizations.blob.vars.arms')}`}
              />
              
              <StatusRow
                label={t('visualizations.blob.vars.knowledge')}
                value={morphology.knowledge}
                detail={`${t('visualizations.blob.vars.pattern')}: ${t(`visualizations.blob.patterns.${blobData.innerPattern}`)}`}
              />
              
              <StatusRow
                label={t('visualizations.blob.vars.organizational')}
                value={morphology.organizational}
                detail={`${t('visualizations.blob.vars.baseColor')}: ${blobData.baseHue}°`}
              />
              
              <StatusRow
                label={t('visualizations.blob.vars.temporal')}
                value={morphology.temporal}
                detail={`${t('visualizations.blob.vars.pulse')}: ${blobData.pulseSpeed}s`}
              />
              
              <StatusRow
                label={t('visualizations.blob.vars.change')}
                value={morphology.change}
                detail={`${t('visualizations.blob.vars.rotation')}: ${blobData.rotationSpeed}°/s`}
              />
              
              <StatusRow
                label={t('visualizations.blob.vars.risk')}
                value={morphology.risk}
                detail={`${t('visualizations.blob.vars.glow')}: ${(blobData.outerGlowIntensity * 100).toFixed(0)}%`}
                glowColor={blobData.outerGlowColor}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ 
  label, 
  value, 
  detail,
  glowColor 
}: { 
  label: string; 
  value: string; 
  detail: string;
  glowColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <div className="flex items-center gap-2">
        {glowColor && (
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: glowColor }}
          />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
    </div>
  );
}
