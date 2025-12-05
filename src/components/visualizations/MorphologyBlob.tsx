import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Edit2 } from 'lucide-react';
import { mapMorphologyToBlob } from './blob/blobMapping';
import { getZoneStyles, getDimensionVisuals, getPatternPreview } from './blob/colorMapping';
import { useArchetype } from '@/hooks/useArchetype';
import { MORPHOLOGY_DIMENSIONS } from '@/lib/morphologyConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Blob3DScene, mapMorphologyTo3DBlob } from './blob3d';
import { Blob3DLegend } from './blob3d/Blob3DLegend';

interface MorphologyBlobProps {
  morphology: any;
  projectId?: string;
  onMorphologyUpdate?: (newMorphology: any) => void;
}

// State machine for view modes - eliminates race conditions
type ViewMode = 
  | { type: 'idle' }
  | { type: 'viewing_tooltip', dimensionKey: string, zone: string }
  | { type: 'editing', dimensionKey: string, tempValue: string };

export function MorphologyBlob({ morphology, projectId, onMorphologyUpdate }: MorphologyBlobProps) {
  const { t, i18n } = useTranslation('common');
  
  // Defensive check for morphology
  if (!morphology) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.blob.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ingen morfologi data tilgængelig endnu.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Helper to safely extract morphology value (handles both string and object formats)
  const getMorphologyValue = (key: string): string => {
    const value = morphology[key];
    if (typeof value === 'object' && value !== null) {
      return value.selectedValue || '';
    }
    return value || '';
  };
  
  // Normalize morphology early - ensures all values are strings
  const normalizedMorphology = {
    complexity: getMorphologyValue('complexity'),
    stakeholder: getMorphologyValue('stakeholder'),
    knowledge: getMorphologyValue('knowledge'),
    cultural: getMorphologyValue('cultural'),
    organizational: getMorphologyValue('organizational'),
    temporal: getMorphologyValue('temporal'),
    development: getMorphologyValue('development'),
    risk: getMorphologyValue('risk'),
    challenge: getMorphologyValue('challenge') || getMorphologyValue('primary'),
    change: getMorphologyValue('change'),
    information: getMorphologyValue('information'),
    resources: getMorphologyValue('resources') || getMorphologyValue('resource')
  };
  
  let blobData;
  try {
    blobData = mapMorphologyToBlob(normalizedMorphology);
  } catch (error) {
    console.error('Error mapping morphology to blob:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.blob.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Fejl ved generering af morfologi blob.</p>
        </CardContent>
      </Card>
    );
  }
  
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'idle' });
  const [zoneTooltipPosition, setZoneTooltipPosition] = useState({ x: 250, y: 250 });
  const [isSaving, setIsSaving] = useState(false);
  const [legendHoveredLobe, setLegendHoveredLobe] = useState<number | null>(null);
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
    development: 'innerPattern',
    // 4 previously missing dimensions
    challenge: 'mainShape',     // Challenge → noise particles on main shape
    change: 'outerGlow',        // Change → rotation/animation effects
    information: 'mainShape',   // Information → symmetry of shape
    resources: 'mainShape'      // Resources → overall scale and size
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
  
  // Computed values derived from viewMode - eliminates race conditions
  const selectedDimension = viewMode.type !== 'idle' ? viewMode.dimensionKey : null;
  const selectedZone = viewMode.type === 'viewing_tooltip' ? viewMode.zone : null;
  const showZoneTooltip = viewMode.type === 'viewing_tooltip';
  const editingDimension = viewMode.type === 'editing' ? viewMode.dimensionKey : null;
  const tempValue = viewMode.type === 'editing' ? viewMode.tempValue : '';

  // Click outside handler to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewMode.type === 'viewing_tooltip' && 
          blobContainerRef.current && 
          !blobContainerRef.current.contains(event.target as Node)) {
        setViewMode({ type: 'idle' });
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [viewMode]);
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
  
  const handleSaveQuickEdit = async () => {
    if (!projectId || viewMode.type !== 'editing') return;
    
    setIsSaving(true);
    
    const updatedMorphology = {
      ...morphology,
      [viewMode.dimensionKey]: viewMode.tempValue
    };
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ morphology: updatedMorphology })
        .eq('id', projectId);
      
      if (error) throw error;
      
      toast.success(t('morphology.updateSuccess') || 'Morphology updated!');
      setViewMode({ type: 'idle' });
      
      // Update parent with new morphology
      if (onMorphologyUpdate) {
        onMorphologyUpdate(updatedMorphology);
      }
    } catch (error) {
      console.error('Error updating morphology:', error);
      toast.error(t('morphology.updateError') || 'Failed to update morphology');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setViewMode({ type: 'idle' });
  };

  // Direct edit handler for inline edit icon
  const handleDirectEdit = (dimensionKey: string, currentValue: string) => {
    setViewMode({ 
      type: 'editing', 
      dimensionKey, 
      tempValue: getMorphologyValue(dimensionKey) || currentValue 
    });
  };
  
  // State machine-based dimension click handler - eliminates race conditions
  const handleDimensionClick = (dimensionKey: string) => {
    // If already editing this dimension, cancel
    if (viewMode.type === 'editing' && viewMode.dimensionKey === dimensionKey) {
      setViewMode({ type: 'idle' });
      return;
    }
    
    // If viewing tooltip for this dimension and projectId exists, start editing
    if (viewMode.type === 'viewing_tooltip' && viewMode.dimensionKey === dimensionKey && projectId) {
      setViewMode({ 
        type: 'editing', 
        dimensionKey, 
        tempValue: getMorphologyValue(dimensionKey) || '' 
      });
      return;
    }
    
    // First click or switching dimensions - show tooltip
    const zone = dimensionToZone[dimensionKey];
    if (blobContainerRef.current) {
      const position = calculateZonePosition(zone, blobContainerRef.current);
      setZoneTooltipPosition(position);
    }
    setViewMode({ type: 'viewing_tooltip', dimensionKey, zone });
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
        dimension: `${t('morphology.dimensions.risk.title')}: ${t('morphology.dimensions.risk.options.' + normalizedMorphology.risk)}`
      },
      mainShape: {
        title: t('visualizations.blob.zones.mainShape.title'),
        description: t('visualizations.blob.zones.mainShape.description'),
        dimension: `${t('morphology.dimensions.complexity.title')}: ${t('morphology.dimensions.complexity.options.' + normalizedMorphology.complexity)}, ${t('morphology.dimensions.stakeholder.title')}: ${t('morphology.dimensions.stakeholder.options.' + normalizedMorphology.stakeholder)}`
      },
      culturalOverlay: {
        title: t('visualizations.blob.zones.culturalOverlay.title'),
        description: t('visualizations.blob.zones.culturalOverlay.description'),
        dimension: `${t('morphology.dimensions.cultural.title')}: ${t('morphology.dimensions.cultural.options.' + normalizedMorphology.cultural)}, ${t('morphology.dimensions.organizational.title')}: ${t('morphology.dimensions.organizational.options.' + normalizedMorphology.organizational)}`
      },
      innerPattern: {
        title: t('visualizations.blob.zones.innerPattern.title'),
        description: t('visualizations.blob.zones.innerPattern.description'),
        dimension: `${t('morphology.dimensions.knowledge.title')}: ${t('morphology.dimensions.knowledge.options.' + normalizedMorphology.knowledge)}`
      },
      coreGlow: {
        title: t('visualizations.blob.zones.coreGlow.title'),
        description: t('visualizations.blob.zones.coreGlow.description'),
        dimension: `${t('morphology.dimensions.development.title')}: ${t('morphology.dimensions.development.options.' + normalizedMorphology.development)}`
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
            <div ref={blobContainerRef} className="w-full max-w-[500px] aspect-square bg-gradient-to-br from-background via-muted/20 to-background rounded-lg overflow-hidden relative border border-border/30">
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>}>
                <Blob3DScene 
                  data={mapMorphologyTo3DBlob(normalizedMorphology)} 
                  selectedLobe={legendHoveredLobe ?? (selectedDimension ? Object.keys(dimensionToZone).indexOf(selectedDimension) : null)}
                />
              </Suspense>
              
              {/* Toggleable Legend for 3D Blob */}
              <Blob3DLegend 
                morphology={normalizedMorphology} 
                onHoverDimension={(_, lobeIndex) => setLegendHoveredLobe(lobeIndex)}
              />
              
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
                        onClick={() => setViewMode({ type: 'idle' })}
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
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tooltipBorderColor }} />
                        <span className="text-xs font-medium">{zoneInfo.dimension}</span>
                      </div>
                      
                      {/* Edit Button if project is editable */}
                      {projectId && selectedDimension && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewMode({ 
                                type: 'editing', 
                                dimensionKey: selectedDimension, 
                                tempValue: getMorphologyValue(selectedDimension) || '' 
                              });
                            }}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            {t('common.edit')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewMode({ type: 'idle' });
                            }}
                          >
                            {t('common.close')}
                          </Button>
                        </div>
                      )}
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
                {archetype.icon} {archetype.description ? (typeof archetype.name === 'string' ? archetype.name : JSON.stringify(archetype.name)) : t(archetype.nameKey || '')}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {typeof archetype.description === 'string' ? archetype.description : (archetype.descriptionKey ? t(archetype.descriptionKey) : '')}
              </p>
            </div>
          </div>
          
          {/* Right: Visual Variable Indicators */}
          <div className="space-y-3">
            
            
            <div className="space-y-2">
              <StatusRow 
                label={t('visualizations.blob.vars.risk')} 
                value={t(`morphology.dimensions.risk.options.${normalizedMorphology.risk}`)}
                detail={`${t('visualizations.blob.vars.glow')}: ${(blobData.outerGlowIntensity * 100).toFixed(0)}%`} 
                visualColor={getDimensionVisuals('risk', blobData).color} 
                visualIcon={getDimensionVisuals('risk', blobData).icon} 
                glowIntensity={blobData.outerGlowIntensity} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'risk'} 
                dimensionKey="risk"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'risk'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'risk' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('risk')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.complexity')} 
                value={t(`morphology.dimensions.complexity.options.${normalizedMorphology.complexity}`)} 
                detail={`${t('visualizations.blob.vars.roughness')}: ${(blobData.roughness * 100).toFixed(0)}%`}
                visualColor={getDimensionVisuals('complexity', blobData).color} 
                visualIcon={getDimensionVisuals('complexity', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'complexity'} 
                dimensionKey="complexity"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'complexity'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'complexity' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('complexity')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.stakeholder')} 
                value={t(`morphology.dimensions.stakeholder.options.${normalizedMorphology.stakeholder}`)} 
                detail={`${t('visualizations.blob.vars.arms')}: ${blobData.arms}`}
                visualColor={getDimensionVisuals('stakeholder', blobData).color} 
                visualIcon={getDimensionVisuals('stakeholder', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'stakeholder'} 
                dimensionKey="stakeholder"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'stakeholder'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'stakeholder' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('stakeholder')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.knowledge')} 
                value={t(`morphology.dimensions.knowledge.options.${normalizedMorphology.knowledge}`)} 
                detail={`${t('visualizations.blob.vars.pattern')}: ${t(`visualizations.blob.patterns.${blobData.innerPattern}`)}`}
                visualColor={getDimensionVisuals('knowledge', blobData).color} 
                visualIcon={getDimensionVisuals('knowledge', blobData).icon} 
                visualPattern={blobData.innerPattern} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'knowledge'} 
                dimensionKey="knowledge"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'knowledge'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'knowledge' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('knowledge')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.cultural')} 
                value={t(`morphology.dimensions.cultural.options.${normalizedMorphology.cultural}`)} 
                detail={`${t('visualizations.blob.vars.colors')}: ${blobData.colorSpread}`}
                visualColor={getDimensionVisuals('cultural', blobData).color} 
                visualIcon={getDimensionVisuals('cultural', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'cultural'} 
                dimensionKey="cultural"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'cultural'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'cultural' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('cultural')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.organizational')} 
                value={t(`morphology.dimensions.organizational.options.${normalizedMorphology.organizational}`)} 
                detail={`${t('visualizations.blob.vars.baseColor')}: ${blobData.baseHue}°`}
                visualColor={getDimensionVisuals('organizational', blobData).color} 
                visualIcon={getDimensionVisuals('organizational', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'organizational'} 
                dimensionKey="organizational"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'organizational'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'organizational' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('organizational')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.temporal')} 
                value={t(`morphology.dimensions.temporal.options.${normalizedMorphology.temporal}`)} 
                detail={`${t('visualizations.blob.vars.pulse')}: ${blobData.pulseSpeed.toFixed(1)}s`}
                visualColor={getDimensionVisuals('temporal', blobData).color} 
                visualIcon={getDimensionVisuals('temporal', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'temporal'} 
                dimensionKey="temporal"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'temporal'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'temporal' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('temporal')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.development')} 
                value={t(`morphology.dimensions.development.options.${normalizedMorphology.development}`)} 
                detail={`${t('visualizations.blob.vars.coreGlow')}: ${(blobData.coreGlow * 100).toFixed(0)}%`}
                visualColor={getDimensionVisuals('development', blobData).color} 
                visualIcon={getDimensionVisuals('development', blobData).icon} 
                glowIntensity={blobData.coreGlow} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'development'} 
                dimensionKey="development"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'development'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'development' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('development')} 
              />
              
              {/* 4 Previously Missing Dimensions */}
              <StatusRow 
                label={t('visualizations.blob.vars.challenge')} 
                value={t(`morphology.dimensions.challenge.options.${normalizedMorphology.challenge}`)} 
                detail={`${t('visualizations.blob.vars.effect')}: ${t('visualizations.blob.effects.noiseParticles')}`}
                visualColor={getDimensionVisuals('challenge', blobData).color} 
                visualIcon={getDimensionVisuals('challenge', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'challenge'} 
                dimensionKey="challenge"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'challenge'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'challenge' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('challenge')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.resources')} 
                value={t(`morphology.dimensions.resources.options.${normalizedMorphology.resources}`)} 
                detail={`${t('visualizations.blob.vars.effect')}: ${t('visualizations.blob.effects.scaleSize')}`}
                visualColor={getDimensionVisuals('resources', blobData).color} 
                visualIcon={getDimensionVisuals('resources', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'resources'} 
                dimensionKey="resources"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'resources'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'resources' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('resources')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.change')} 
                value={t(`morphology.dimensions.change.options.${normalizedMorphology.change}`)} 
                detail={`${t('visualizations.blob.vars.effect')}: ${t('visualizations.blob.effects.rotationSpeed')}`}
                visualColor={getDimensionVisuals('change', blobData).color} 
                visualIcon={getDimensionVisuals('change', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'change'} 
                dimensionKey="change"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'change'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'change' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('change')} 
              />
              
              <StatusRow 
                label={t('visualizations.blob.vars.information')} 
                value={t(`morphology.dimensions.information.options.${normalizedMorphology.information}`)} 
                detail={`${t('visualizations.blob.vars.effect')}: ${t('visualizations.blob.effects.symmetry')}`}
                visualColor={getDimensionVisuals('information', blobData).color} 
                visualIcon={getDimensionVisuals('information', blobData).icon} 
                isSelected={viewMode.type !== 'idle' && viewMode.dimensionKey === 'information'} 
                dimensionKey="information"
                isEditing={viewMode.type === 'editing' && viewMode.dimensionKey === 'information'}
                tempValue={viewMode.type === 'editing' && viewMode.dimensionKey === 'information' ? viewMode.tempValue : ''}
                onTempValueChange={(value) => {
                  if (viewMode.type === 'editing') {
                    setViewMode({ ...viewMode, tempValue: value });
                  }
                }}
                isSaving={isSaving}
                onEdit={handleDirectEdit}
                onSave={handleSaveQuickEdit}
                onCancel={handleCancelEdit}
                onClick={() => handleDimensionClick('information')} 
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
  dimensionKey?: string;
  isEditing?: boolean;
  onEdit?: (dimensionKey: string, currentValue: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  tempValue?: string;
  onTempValueChange?: (value: string) => void;
  isSaving?: boolean;
}
function StatusRow(props: StatusRowProps) {
  const { t } = useTranslation();
  
  // Get dimension options for editing
  const dimensionConfig = props.dimensionKey 
    ? MORPHOLOGY_DIMENSIONS.find(d => d.key === props.dimensionKey)
    : null;
  
  return (
    <div className={`
      group transition-all rounded-lg p-3 border 
      ${props.isSelected ? 'bg-accent border-accent-foreground shadow-lg scale-105' : 'hover:bg-muted/30 border-transparent hover:border-border cursor-pointer'}
    `}>
      <div onClick={props.onClick}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Visual Indicator */}
            {props.visualColor && (
              <div className="relative">
                <div 
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center" 
                  style={{
                    backgroundColor: `${props.visualColor}30`,
                    borderColor: props.visualColor
                  }}
                >
                  {props.visualIcon && <span className="text-xs">{props.visualIcon}</span>}
                </div>
                
                {/* Glow effect hvis relevant */}
                {props.glowIntensity !== undefined && props.glowIntensity > 0 && (
                  <div 
                    className="absolute inset-0 rounded-full blur-sm -z-10 animate-glow-pulse" 
                    style={{
                      backgroundColor: props.visualColor,
                      opacity: props.glowIntensity * 0.4
                    }} 
                  />
                )}
              </div>
            )}
            
            <span className="text-sm font-medium">{props.label}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="capitalize" 
              style={props.visualColor ? { borderColor: `${props.visualColor}60` } : {}}
            >
              {typeof props.value === 'string' ? props.value : JSON.stringify(props.value)}
            </Badge>
            
            {/* Inline Edit Icon - appears on hover */}
            {props.dimensionKey && !props.isEditing && props.onEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onEdit?.(props.dimensionKey!, props.value);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress/Intensity Bar */}
        {props.glowIntensity !== undefined && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{
                  width: `${props.glowIntensity * 100}%`,
                  backgroundColor: props.visualColor
                }} 
              />
            </div>
            <span>{(props.glowIntensity * 100).toFixed(0)}%</span>
          </div>
        )}
        
        {/* Detail med pattern preview */}
        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
          {props.visualPattern && (
            <span style={{ color: props.visualColor || 'currentColor' }}>
              {getPatternPreview(props.visualPattern)}
            </span>
          )}
          <span>{props.detail}</span>
        </div>
      </div>
      
      {/* Quick Edit Dropdown */}
      {props.isEditing && dimensionConfig && (
        <div className="mt-3 space-y-2 animate-in fade-in-0 slide-in-from-top-2 border-t border-border pt-3">
          <Select 
            value={props.tempValue} 
            onValueChange={props.onTempValueChange}
            disabled={props.isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('morphology.selectOption')} />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-background">
              {dimensionConfig.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.translationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                props.onSave?.();
              }}
              disabled={props.isSaving || !props.tempValue}
              className="flex-1"
            >
              {props.isSaving ? t('common.saving') : t('common.save')}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                props.onCancel?.();
              }}
              disabled={props.isSaving}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}