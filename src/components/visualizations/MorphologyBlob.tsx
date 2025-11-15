import { ReactP5Wrapper } from 'react-p5-wrapper';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';
import { mapMorphologyToBlob } from './blob/blobMapping';
import { blobSketch } from './blob/BlobGenerator';
import { getZoneStyles, getDimensionVisuals, getPatternPreview } from './blob/colorMapping';
import { useArchetype } from '@/hooks/useArchetype';
interface MorphologyBlobProps {
  morphology: any;
}
export function MorphologyBlob({ morphology }: MorphologyBlobProps) {
  const { t, i18n } = useTranslation('common');
  const blobData = mapMorphologyToBlob(morphology);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showZoneTooltip, setShowZoneTooltip] = useState(false);
  const [zoneTooltipPosition, setZoneTooltipPosition] = useState({ x: 250, y: 250 });
  const blobContainerRef = useRef<HTMLDivElement>(null);
  
  // Use React Query for archetype loading - prevents race conditions
  const { data: archetype, isLoading: isLoadingArchetype } = useArchetype(
    morphology,
    i18n.language as 'en' | 'da'
  );

  const dimensionToZone: Record<string, string> = {
    risk: 'outerGlow',
    complexity: 'mainShape',
    stakeholder: 'mainShape',
    knowledge: 'innerPattern',
    cultural: 'culturalOverlay',
    organizational: 'coreGlow',
    temporal: 'outerGlow',
    development: 'innerPattern'
  };

  // Calculate precise position for zone tooltip based on blob's layout
  const calculateZonePosition = (zone: string, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.35;
    
    // Base positions for each zone
    const positions: Record<string, { x: number; y: number }> = {
      outerGlow: { 
        x: centerX, 
        y: centerY - radius * 1.3  // Top
      },
      mainShape: { 
        x: centerX + radius * 0.9, 
        y: centerY  // Right
      },
      culturalOverlay: { 
        x: centerX - radius * 0.9, 
        y: centerY  // Left
      },
      innerPattern: { 
        x: centerX, 
        y: centerY + radius * 0.9  // Bottom
      },
      coreGlow: { 
        x: centerX, 
        y: centerY  // Center
      }
    };
    
    let position = positions[zone] || { x: centerX, y: centerY };
    
    // Boundary checking - ensure tooltip stays within container
    const tooltipWidth = 320; // max-w-sm ≈ 320px
    const tooltipHeight = 200; // estimated height
    const padding = 20;
    
    // Check right boundary
    if (position.x + tooltipWidth/2 > rect.width - padding) {
      position.x = rect.width - tooltipWidth/2 - padding;
    }
    
    // Check left boundary
    if (position.x - tooltipWidth/2 < padding) {
      position.x = tooltipWidth/2 + padding;
    }
    
    // Check bottom boundary
    if (position.y + tooltipHeight/2 > rect.height - padding) {
      position.y = rect.height - tooltipHeight/2 - padding;
    }
    
    // Check top boundary
    if (position.y - tooltipHeight/2 < padding) {
      position.y = tooltipHeight/2 + padding;
    }
    
    return position;
  };
  // Click outside handler to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showZoneTooltip && 
          blobContainerRef.current && 
          !blobContainerRef.current.contains(event.target as Node)) {
        setShowZoneTooltip(false);
        setSelectedDimension(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showZoneTooltip]);
  if (!morphology) {
    return <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.blob.title')}</CardTitle>
          <CardDescription>{t('visualizations.blob.noData')}</CardDescription>
        </CardHeader>
      </Card>;
  }

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
            <div ref={blobContainerRef} className="w-full max-w-[500px] aspect-square bg-muted/30 rounded-lg overflow-hidden relative">
              <ReactP5Wrapper sketch={blobSketch} blobData={blobData} selectedZone={selectedZone} selectedDimension={selectedDimension} onZoneHover={handleHover} />
              
              {/* Persistent Zone Tooltip - shows on dimension click */}
              {showZoneTooltip && selectedZone && (() => {
                const zoneInfo = getZoneInfo(selectedZone);
                const zoneStyle = getZoneStyles(selectedZone, blobData);
                
                // Get dimension color and icon instead of zone color
                const dimensionVisuals = selectedDimension 
                  ? getDimensionVisuals(selectedDimension, blobData) 
                  : null;
                
    // Override zone colors with dimension colors
    const tooltipBorderColor = dimensionVisuals?.color || zoneStyle.borderColor;
    const tooltipGradient = dimensionVisuals 
      ? `linear-gradient(135deg, ${dimensionVisuals.color}85, ${dimensionVisuals.color}95)`
      : zoneStyle.gradient;
                const tooltipIcon = dimensionVisuals?.icon || zoneStyle.icon;
                
                if (!zoneInfo || !zoneStyle) return null;
                
                return (
                  <div 
                    className="absolute z-50 animate-in fade-in-0 zoom-in-95 duration-300"
                    style={{
                      left: `${zoneTooltipPosition.x}px`,
                      top: `${zoneTooltipPosition.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div 
                      className="backdrop-blur-md border-2 rounded-xl shadow-2xl p-4 max-w-sm relative"
                      style={{
                        borderColor: tooltipBorderColor,
                        background: tooltipGradient
                      }}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => {
                          setShowZoneTooltip(false);
                          setSelectedDimension(null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Arrow pointing to zone */}
                      <div 
                        className="absolute w-0 h-0 border-8"
                        style={{
                          top: '50%',
                          right: '-16px',
                          transform: 'translateY(-50%)',
                          borderColor: `transparent transparent transparent ${tooltipBorderColor}`,
                        }}
                      />
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{tooltipIcon}</span>
                        <p className="text-base font-bold text-foreground">{zoneInfo.title}</p>
                      </div>
                      
                      <div className="h-0.5 mb-3" style={{ background: tooltipBorderColor }} />
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {zoneInfo.description}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tooltipBorderColor }} />
                        <span className="text-xs font-medium">{zoneInfo.dimension}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Hover Tooltip */}
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
              <StatusRow 
                label={t('visualizations.blob.vars.risk')} 
                value={morphology.risk} 
                detail={`${t('visualizations.blob.vars.glow')}: ${(blobData.outerGlowIntensity * 100).toFixed(0)}%`} 
                visualColor={getDimensionVisuals('risk', blobData).color} 
                visualIcon={getDimensionVisuals('risk', blobData).icon} 
                glowIntensity={blobData.outerGlowIntensity} 
                isSelected={selectedDimension === 'risk'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'risk' ? null : 'risk';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.complexity')} 
                value={t(`morphology.dimensions.complexity.options.${morphology.complexity}`)} 
                detail={`${t('visualizations.blob.vars.roughness')}: ${(blobData.roughness * 100).toFixed(0)}%`} 
                visualColor={getDimensionVisuals('complexity', blobData).color} 
                visualIcon={getDimensionVisuals('complexity', blobData).icon} 
                isSelected={selectedDimension === 'complexity'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'complexity' ? null : 'complexity';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.stakeholder')} 
                value={t(`morphology.dimensions.stakeholder.options.${morphology.stakeholder}`)} 
                detail={`${t('visualizations.blob.vars.arms')}: ${blobData.arms}`} 
                visualColor={getDimensionVisuals('stakeholder', blobData).color} 
                visualIcon={getDimensionVisuals('stakeholder', blobData).icon} 
                isSelected={selectedDimension === 'stakeholder'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'stakeholder' ? null : 'stakeholder';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.knowledge')} 
                value={t(`morphology.dimensions.knowledge.options.${morphology.knowledge}`)} 
                detail={`${t('visualizations.blob.vars.pattern')}: ${t(`visualizations.blob.patterns.${blobData.innerPattern}`)}`} 
                visualColor={getDimensionVisuals('knowledge', blobData).color} 
                visualIcon={getDimensionVisuals('knowledge', blobData).icon} 
                visualPattern={blobData.innerPattern} 
                isSelected={selectedDimension === 'knowledge'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'knowledge' ? null : 'knowledge';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.cultural')} 
                value={t(`morphology.dimensions.cultural.options.${morphology.cultural}`)} 
                detail={`${t('visualizations.blob.vars.colors')}: ${blobData.colorSpread}`} 
                visualColor={getDimensionVisuals('cultural', blobData).color} 
                visualIcon={getDimensionVisuals('cultural', blobData).icon} 
                isSelected={selectedDimension === 'cultural'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'cultural' ? null : 'cultural';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.organizational')} 
                value={t(`morphology.dimensions.organizational.options.${morphology.organizational}`)} 
                detail={`${t('visualizations.blob.vars.baseColor')}: ${blobData.baseHue}°`} 
                visualColor={getDimensionVisuals('organizational', blobData).color} 
                visualIcon={getDimensionVisuals('organizational', blobData).icon} 
                isSelected={selectedDimension === 'organizational'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'organizational' ? null : 'organizational';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.temporal')} 
                value={t(`morphology.dimensions.temporal.options.${morphology.temporal}`)} 
                detail={`${t('visualizations.blob.vars.pulse')}: ${blobData.pulseSpeed.toFixed(1)}s`} 
                visualColor={getDimensionVisuals('temporal', blobData).color} 
                visualIcon={getDimensionVisuals('temporal', blobData).icon} 
                isSelected={selectedDimension === 'temporal'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'temporal' ? null : 'temporal';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.development')} 
                value={t(`morphology.dimensions.development.options.${morphology.development}`)} 
                detail={`${t('visualizations.blob.vars.coreGlow')}: ${(blobData.coreGlow * 100).toFixed(0)}%`} 
                visualColor={getDimensionVisuals('development', blobData).color} 
                visualIcon={getDimensionVisuals('development', blobData).icon} 
                glowIntensity={blobData.coreGlow} 
                isSelected={selectedDimension === 'development'} 
                onClick={() => {
                  const newDimension = selectedDimension === 'development' ? null : 'development';
                  setSelectedDimension(newDimension);
                  
                  if (newDimension && blobContainerRef.current) {
                    const zone = dimensionToZone[newDimension];
                    setSelectedZone(zone);
                    const position = calculateZonePosition(zone, blobContainerRef.current);
                    setZoneTooltipPosition(position);
                    setShowZoneTooltip(true);
                  } else {
                    setShowZoneTooltip(false);
                    setSelectedZone(null);
                  }
                }} 
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