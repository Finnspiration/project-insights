import { ReactP5Wrapper } from 'react-p5-wrapper';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { mapMorphologyToBlob } from './blob/blobMapping';
import { detectArchetype, BlobArchetype } from './blob/blobArchetypes';
import { blobSketch } from './blob/BlobGenerator';
import { getZoneStyles, getDimensionVisuals, getPatternPreview } from './blob/colorMapping';
interface MorphologyBlobProps {
  morphology: any;
}
export function MorphologyBlob({
  morphology
}: MorphologyBlobProps) {
  const {
    t,
    i18n
  } = useTranslation();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({
    x: 0,
    y: 0
  });
  const [archetype, setArchetype] = useState<BlobArchetype | null>(null);
  const [isLoadingArchetype, setIsLoadingArchetype] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const dimensionToZone: Record<string, string> = {
    risk: 'outerGlow',
    complexity: 'mainShape',
    stakeholder: 'mainShape',
    cultural: 'culturalOverlay',
    organizational: 'culturalOverlay',
    knowledge: 'innerPattern',
    development: 'coreGlow',
    temporal: 'mainShape',
    change: 'mainShape'
  };
  useEffect(() => {
    if (selectedDimension) {
      setSelectedZone(dimensionToZone[selectedDimension]);
    } else {
      setSelectedZone(null);
    }
  }, [selectedDimension]);
  useEffect(() => {
    const loadArchetype = async () => {
      if (!morphology) return;
      setIsLoadingArchetype(true);
      try {
        const blobData = mapMorphologyToBlob(morphology);
        const result = await detectArchetype(blobData, morphology, i18n.language as 'en' | 'da');
        setArchetype(result);
      } catch (error) {
        console.error('Error loading archetype:', error);
      } finally {
        setIsLoadingArchetype(false);
      }
    };
    loadArchetype();
  }, [morphology, i18n.language]);
  if (!morphology) {
    return <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.blob.title')}</CardTitle>
          <CardDescription>{t('visualizations.blob.noData')}</CardDescription>
        </CardHeader>
      </Card>;
  }
  const blobData = mapMorphologyToBlob(morphology);
  if (isLoadingArchetype) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('visualizations.blob.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>;
  }
  if (!archetype) {
    return null;
  }
  const handleHover = (zone: string | null, x: number, y: number) => {
    setHoveredZone(zone);
    setTooltipPosition({
      x,
      y
    });
  };
  const getZoneInfo = (zone: string | null) => {
    if (!zone) return null;
    const zoneMap: Record<string, {
      title: string;
      description: string;
      dimension: string;
    }> = {
      outerGlow: {
        title: t('visualizations.blob.zones.outerGlow.title'),
        description: t('visualizations.blob.zones.outerGlow.description'),
        dimension: `${t('morphology.dimensions.risk.title')}: ${t('morphology.dimensions.risk.options.' + morphology.risk)}`
      },
      mainShape: {
        title: t('visualizations.blob.zones.mainShape.title'),
        description: t('visualizations.blob.zones.mainShape.description'),
        dimension: `${t('morphology.dimensions.complexity.title')}: ${t('morphology.dimensions.complexity.options.' + morphology.complexity)}, ${t('morphology.dimensions.stakeholder.title')}: ${t('morphology.dimensions.stakeholder.options.' + morphology.stakeholder)}`
      },
      culturalOverlay: {
        title: t('visualizations.blob.zones.culturalOverlay.title'),
        description: t('visualizations.blob.zones.culturalOverlay.description'),
        dimension: `${t('morphology.dimensions.cultural.title')}: ${t('morphology.dimensions.cultural.options.' + morphology.cultural)}, ${t('morphology.dimensions.organizational.title')}: ${t('morphology.dimensions.organizational.options.' + morphology.organizational)}`
      },
      innerPattern: {
        title: t('visualizations.blob.zones.innerPattern.title'),
        description: t('visualizations.blob.zones.innerPattern.description'),
        dimension: `${t('morphology.dimensions.knowledge.title')}: ${t('morphology.dimensions.knowledge.options.' + morphology.knowledge)}`
      },
      coreGlow: {
        title: t('visualizations.blob.zones.coreGlow.title'),
        description: t('visualizations.blob.zones.coreGlow.description'),
        dimension: `${t('morphology.dimensions.development.title')}: ${t('morphology.dimensions.development.options.' + morphology.development)}`
      }
    };
    return zoneMap[zone];
  };
  const zoneInfo = getZoneInfo(hoveredZone);
  const zoneStyle = hoveredZone ? getZoneStyles(hoveredZone, blobData) : null;
  return <Card className="w-full">
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
            <div className="w-full max-w-[500px] aspect-square bg-muted/30 rounded-lg overflow-hidden relative">
              <ReactP5Wrapper sketch={blobSketch} blobData={blobData} onHover={handleHover} selectedZone={selectedZone} />
              
              {/* Floating tooltip */}
              {hoveredZone && zoneInfo && zoneStyle && <div className="absolute pointer-events-none z-50 animate-tooltip-in" style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -120%)'
            }}>
                  <div className="backdrop-blur-md border-2 rounded-xl shadow-2xl p-4 max-w-sm" style={{
                borderColor: zoneStyle.borderColor,
                background: zoneStyle.gradient
              }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{zoneStyle.icon}</span>
                      <p className="text-base font-bold text-foreground">{zoneInfo.title}</p>
                    </div>
                    
                    <div className="h-0.5 mb-3" style={{
                  background: zoneStyle.borderColor
                }} />
                    
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {zoneInfo.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{
                    backgroundColor: zoneStyle.borderColor
                  }} />
                      <span className="text-xs font-medium">{zoneInfo.dimension}</span>
                    </div>
                  </div>
                </div>}
            </div>
            
            {/* Archetype Badge */}
            <div className="mt-4 text-center">
              <Badge variant="outline" style={{
              borderColor: archetype.color,
              color: archetype.color
            }}>
                {archetype.icon} {archetype.description ? archetype.name : t(archetype.nameKey || '')}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {archetype.description || t(archetype.descriptionKey || '')}
              </p>
            </div>
          </div>
          
          {/* Right: Visual Variable Indicators */}
          <div className="space-y-3">
            
            
            <div className="space-y-2">
              <StatusRow label={t('visualizations.blob.vars.risk')} value={morphology.risk} detail={`${t('visualizations.blob.vars.glow')}: ${(blobData.outerGlowIntensity * 100).toFixed(0)}%`} visualColor={getDimensionVisuals('risk', blobData).color} visualIcon={getDimensionVisuals('risk', blobData).icon} glowIntensity={blobData.outerGlowIntensity} isSelected={selectedDimension === 'risk'} onClick={() => setSelectedDimension(selectedDimension === 'risk' ? null : 'risk')} />
              
              <StatusRow label={t('visualizations.blob.vars.complexity')} value={t(`morphology.dimensions.complexity.options.${morphology.complexity}`)} detail={`${t('visualizations.blob.vars.roughness')}: ${(blobData.roughness * 100).toFixed(0)}%`} visualColor={getDimensionVisuals('complexity', blobData).color} visualIcon={getDimensionVisuals('complexity', blobData).icon} isSelected={selectedDimension === 'complexity'} onClick={() => setSelectedDimension(selectedDimension === 'complexity' ? null : 'complexity')} />
              
              <StatusRow label={t('visualizations.blob.vars.stakeholder')} value={t(`morphology.dimensions.stakeholder.options.${morphology.stakeholder}`)} detail={`${t('visualizations.blob.vars.arms')}: ${blobData.arms}`} visualColor={getDimensionVisuals('stakeholder', blobData).color} visualIcon={getDimensionVisuals('stakeholder', blobData).icon} isSelected={selectedDimension === 'stakeholder'} onClick={() => setSelectedDimension(selectedDimension === 'stakeholder' ? null : 'stakeholder')} />
              
              <StatusRow label={t('visualizations.blob.vars.knowledge')} value={t(`morphology.dimensions.knowledge.options.${morphology.knowledge}`)} detail={`${t('visualizations.blob.vars.pattern')}: ${t(`visualizations.blob.patterns.${blobData.innerPattern}`)}`} visualColor={getDimensionVisuals('knowledge', blobData).color} visualIcon={getDimensionVisuals('knowledge', blobData).icon} visualPattern={blobData.innerPattern} isSelected={selectedDimension === 'knowledge'} onClick={() => setSelectedDimension(selectedDimension === 'knowledge' ? null : 'knowledge')} />
              
              <StatusRow label={t('visualizations.blob.vars.cultural')} value={t(`morphology.dimensions.cultural.options.${morphology.cultural}`)} detail={`${t('visualizations.blob.vars.symmetry')}: ${(blobData.culturalSpread * 100).toFixed(0)}%`} visualColor={getDimensionVisuals('cultural', blobData).color} visualIcon={getDimensionVisuals('cultural', blobData).icon} isSelected={selectedDimension === 'cultural'} onClick={() => setSelectedDimension(selectedDimension === 'cultural' ? null : 'cultural')} />
              
              <StatusRow label={t('visualizations.blob.vars.organizational')} value={t(`morphology.dimensions.organizational.options.${morphology.organizational}`)} detail={`${t('visualizations.blob.vars.baseColor')}: ${blobData.baseHue}°`} visualColor={getDimensionVisuals('organizational', blobData).color} visualIcon={getDimensionVisuals('organizational', blobData).icon} isSelected={selectedDimension === 'organizational'} onClick={() => setSelectedDimension(selectedDimension === 'organizational' ? null : 'organizational')} />
              
              <StatusRow label={t('visualizations.blob.vars.temporal')} value={t(`morphology.dimensions.temporal.options.${morphology.temporal}`)} detail={`${t('visualizations.blob.vars.pulse')}: ${blobData.pulseSpeed.toFixed(1)}s`} visualColor={getDimensionVisuals('temporal', blobData).color} visualIcon={getDimensionVisuals('temporal', blobData).icon} isSelected={selectedDimension === 'temporal'} onClick={() => setSelectedDimension(selectedDimension === 'temporal' ? null : 'temporal')} />
              
              <StatusRow label={t('visualizations.blob.vars.development')} value={t(`morphology.dimensions.development.options.${morphology.development}`)} detail={`${t('visualizations.blob.vars.coreGlow')}: ${(blobData.coreGlow * 100).toFixed(0)}%`} visualColor={getDimensionVisuals('development', blobData).color} visualIcon={getDimensionVisuals('development', blobData).icon} glowIntensity={blobData.coreGlow} isSelected={selectedDimension === 'development'} onClick={() => setSelectedDimension(selectedDimension === 'development' ? null : 'development')} />
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
    </Card>;
}
interface StatusRowProps {
  label: string;
  value: string;
  detail: string;
  visualColor?: string;
  visualIcon?: string;
  visualPattern?: string;
  glowIntensity?: number;
  isSelected?: boolean;
  onClick?: () => void;
}
function StatusRow(props: StatusRowProps) {
  const {
    t
  } = useTranslation();
  return <div onClick={props.onClick} className={`
        group transition-all rounded-lg p-3 border 
        ${props.isSelected ? 'bg-accent border-accent-foreground shadow-lg scale-105' : 'hover:bg-muted/30 border-transparent hover:border-border cursor-pointer'}
      `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Visual Indicator */}
          {props.visualColor && <div className="relative">
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{
            backgroundColor: `${props.visualColor}30`,
            borderColor: props.visualColor
          }}>
                {props.visualIcon && <span className="text-xs">{props.visualIcon}</span>}
              </div>
              
              {/* Glow effect hvis relevant */}
              {props.glowIntensity !== undefined && props.glowIntensity > 0 && <div className="absolute inset-0 rounded-full blur-sm -z-10 animate-glow-pulse" style={{
            backgroundColor: props.visualColor,
            opacity: props.glowIntensity * 0.4
          }} />}
            </div>}
          
          <span className="text-sm font-medium">{props.label}</span>
        </div>
        
        <Badge variant="outline" className="capitalize" style={props.visualColor ? {
        borderColor: `${props.visualColor}60`
      } : {}}>
          {props.value}
        </Badge>
      </div>
      
      {/* Progress/Intensity Bar */}
      {props.glowIntensity !== undefined && <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
          width: `${props.glowIntensity * 100}%`,
          backgroundColor: props.visualColor
        }} />
          </div>
          <span>{(props.glowIntensity * 100).toFixed(0)}%</span>
        </div>}
      
      {/* Detail med pattern preview */}
      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
        {props.visualPattern && <span style={{
        color: props.visualColor || 'currentColor'
      }}>
            {getPatternPreview(props.visualPattern)}
          </span>}
        <span>{props.detail}</span>
      </div>
    </div>;
}