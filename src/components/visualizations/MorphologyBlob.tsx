import { ReactP5Wrapper } from 'react-p5-wrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
                <p className="text-xs text-muted-foreground mt-2">
                  {t('visualizations.blob.archetypeExplainer')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right: Visual Variable Indicators */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg mb-4">{t('visualizations.blob.properties')}</h3>
            
            {/* Color/Risk Legend */}
            <Card className="bg-muted/20 border-muted mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('visualizations.blob.riskGuide.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>{t('visualizations.blob.riskGuide.low')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span>{t('visualizations.blob.riskGuide.moderate')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-600" />
                  <span className="flex items-center gap-1">
                    {t('visualizations.blob.riskGuide.high')}
                    <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">{t('visualizations.blob.riskGuide.yourProject')}</Badge>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <span>{t('visualizations.blob.riskGuide.extreme')}</span>
                </div>
              </CardContent>
            </Card>
            
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
                glowTooltip={t('visualizations.blob.glowTooltip')}
              />
            </div>
          </div>
        </div>
        
        {/* How to Read Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('visualizations.blob.howToRead')}</CardTitle>
            <CardDescription>{t('visualizations.blob.layersExplainer')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Layer Order Diagram */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold mb-3">{t('visualizations.blob.layerOrder.title')}</p>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-orange-600">5.</span>
                  <span>{t('visualizations.blob.layerOrder.outerGlow')}</span>
                  <div className="flex-1 border-b border-orange-600/30"></div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-primary">4.</span>
                  <span>{t('visualizations.blob.layerOrder.mainShape')}</span>
                  <div className="flex-1 border-b border-primary/30"></div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-secondary">3.</span>
                  <span>{t('visualizations.blob.layerOrder.culturalOverlay')}</span>
                  <div className="flex-1 border-b border-secondary/30"></div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-accent">2.</span>
                  <span>{t('visualizations.blob.layerOrder.innerPattern')}</span>
                  <div className="flex-1 border-b border-accent/30"></div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-yellow-500">1.</span>
                  <span>{t('visualizations.blob.layerOrder.coreGlow')}</span>
                  <div className="flex-1 border-b border-yellow-500/30"></div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic mt-3">{t('visualizations.blob.layerOrder.note')}</p>
            </div>
            
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="text-xl">🎨</span>
                <div>
                  <strong>{t('visualizations.blob.guide.color')}</strong>: {t('visualizations.blob.guide.colorDesc')}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🌊</span>
                <div>
                  <strong>{t('visualizations.blob.guide.shape')}</strong>: {t('visualizations.blob.guide.shapeDesc')}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">💓</span>
                <div>
                  <strong>{t('visualizations.blob.guide.pulse')}</strong>: {t('visualizations.blob.guide.pulseDesc')}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <strong>{t('visualizations.blob.guide.rotation')}</strong>: {t('visualizations.blob.guide.rotationDesc')}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <strong>{t('visualizations.blob.guide.glow')}</strong>: {t('visualizations.blob.guide.glowDesc')}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🎨</span>
                <div>
                  <strong>{t('visualizations.blob.guide.layers')}</strong>: {t('visualizations.blob.guide.layersDesc')}
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function StatusRow({ 
  label, 
  value, 
  detail,
  glowColor,
  glowTooltip
}: { 
  label: string; 
  value: string; 
  detail: string;
  glowColor?: string;
  glowTooltip?: string;
}) {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <div className="flex items-center gap-2">
        {glowColor && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-3 h-3 rounded-full cursor-help" 
                  style={{ 
                    backgroundColor: glowColor,
                    boxShadow: `0 0 6px ${glowColor}60`
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{glowTooltip || t('visualizations.blob.glowTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
