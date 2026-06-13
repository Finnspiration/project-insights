import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { X, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { mapMorphologyToBlob } from './blob/blobMapping';
import { getZoneStyles, getDimensionVisuals } from './blob/colorMapping';
import { useArchetype } from '@/hooks/useArchetype';
import { Blob3DScene, mapMorphologyTo3DBlob } from './blob3d';
import { EnhancedBlob3DLegend } from './blob3d/EnhancedBlob3DLegend';
import { BlobDemoMode } from './blob3d/BlobDemoMode';
import { ParameterBanner } from './blob3d/ParameterBanner';
import { BlobReadingGuide } from './blob3d/BlobReadingGuide';

interface MorphologyBlobProps {
  morphology: any;
  projectId?: string;
}

// State machine for view modes - eliminates race conditions
type ViewMode = 
  | { type: 'idle' }
  | { type: 'viewing_tooltip', dimensionKey: string, zone: string }
  | { type: 'editing', dimensionKey: string, tempValue: string };

export function MorphologyBlob({ morphology, projectId }: MorphologyBlobProps) {
  const { t, i18n } = useTranslation('common');
  
  // Defensive check for morphology
  if (!morphology) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.blob.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('visualizations.noMorphologyData')}</p>
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
  const [legendHoveredLobe, setLegendHoveredLobe] = useState<number | null>(null);
  const blobContainerRef = useRef<HTMLDivElement>(null);
  
  // Demo mode state
  const [demoMorphology, setDemoMorphology] = useState<Record<string, string> | null>(null);
  const [demoDimension, setDemoDimension] = useState<string | null>(null);
  const isDemoActive = demoMorphology !== null;
  
  // LOCAL morphology state for experimentation (NOT persisted to database)
  // This allows users to explore parameter changes without affecting the morphological box
  const [localMorphology, setLocalMorphology] = useState<Record<string, string>>(() => ({ ...normalizedMorphology }));
  
  // Sync local morphology when the actual morphology (from morphological box) changes
  useEffect(() => {
    setLocalMorphology({ ...normalizedMorphology });
  }, [JSON.stringify(normalizedMorphology)]);
  
  // Detect if user has made LOCAL changes from the saved morphology
  const hasChanges = useMemo(() => {
    return Object.keys(localMorphology).some(
      key => localMorphology[key] !== normalizedMorphology[key]
    );
  }, [localMorphology, normalizedMorphology]);
  
  // Reset local morphology to saved values (from morphological box)
  const handleResetToOriginal = useCallback(() => {
    setLocalMorphology({ ...normalizedMorphology });
    toast.success(t('morphology.resetSuccess'));
  }, [normalizedMorphology, t]);
  
  // Demo mode handlers
  const handleDemoMorphologyChange = useCallback((newMorphology: Record<string, string>) => {
    setDemoMorphology(newMorphology);
  }, []);
  
  const handleDemoStateChange = useCallback((isActive: boolean, currentDimension: string | null) => {
    if (!isActive) {
      setDemoMorphology(null);
      setDemoDimension(null);
    } else {
      setDemoDimension(currentDimension);
    }
  }, []);
  
  // Handler for banner/legend parameter changes - updates LOCAL state only (NOT database)
  const handleLocalMorphologyChange = useCallback((key: string, value: string) => {
    setLocalMorphology(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Active morphology - prioritize: demo > local > normalized
  const activeMorphology = isDemoActive ? demoMorphology : localMorphology;
  
  // Use React Query for archetype loading - prevents race conditions
  const { data: archetype, isLoading: isLoadingArchetype, isFetching } = useArchetype(
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

  // Only show skeleton on initial load, not during updates
  if (!archetype && isLoadingArchetype) {
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
      
      <CardContent className="space-y-0">
        {/* Full-width Blob Canvas */}
        <div className="relative">
          <div ref={blobContainerRef} className="w-full aspect-[16/10] min-h-[400px] max-h-[600px] bg-gradient-to-br from-background via-muted/20 to-background rounded-t-lg overflow-hidden relative border border-border/30 border-b-0">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>}>
              <div className={`w-full h-full transition-opacity duration-500 ${isFetching ? 'opacity-80' : 'opacity-100'}`}>
                <Blob3DScene 
                  data={mapMorphologyTo3DBlob(activeMorphology)} 
                  selectedLobe={legendHoveredLobe ?? (demoDimension ? Object.keys(dimensionToZone).indexOf(demoDimension) : (selectedDimension ? Object.keys(dimensionToZone).indexOf(selectedDimension) : null))}
                />
              </div>
            </Suspense>
            
            {/* Demo Mode Controls */}
            <BlobDemoMode
              baseMorphology={normalizedMorphology}
              onDemoMorphologyChange={handleDemoMorphologyChange}
              onDemoStateChange={handleDemoStateChange}
            />
            
            {/* Enhanced Draggable Legend with Editing */}
            <EnhancedBlob3DLegend 
              morphology={activeMorphology}
              projectId={projectId}
              onHoverDimension={(_, lobeIndex) => setLegendHoveredLobe(lobeIndex)}
              onMorphologyChange={handleLocalMorphologyChange}
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
          
          {/* Parameter Banner - placed below visualization */}
          <ParameterBanner 
            morphology={activeMorphology}
            activeDimension={demoDimension}
            onMorphologyChange={projectId ? handleLocalMorphologyChange : undefined}
            className="border border-border/30 border-t-0"
          />
          
          {/* Reset Button - always visible, disabled when no changes */}
          {!isDemoActive && (
            <div className="flex justify-center py-3 border border-border/30 border-t-0 rounded-b-lg bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToOriginal}
                disabled={!hasChanges}
                className={`gap-2 ${hasChanges ? 'text-muted-foreground hover:text-foreground' : 'opacity-50'}`}
              >
                <RotateCcw className="h-4 w-4" />
                {t('morphology.resetToSaved')}
              </Button>
            </div>
          )}
          
          {/* Archetype Badge */}
          <div className="mt-4 text-center relative">
            {isFetching && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in-0">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t('common.updating') || 'Updating...'}</span>
              </div>
            )}
            <Badge 
              variant="outline" 
              className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}
              style={{
                borderColor: archetype.color,
                color: archetype.color
              }}
            >
              {archetype.icon} {archetype.description ? (typeof archetype.name === 'string' ? archetype.name : JSON.stringify(archetype.name)) : t(archetype.nameKey || '')}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {typeof archetype.description === 'string' ? archetype.description : (archetype.descriptionKey ? t(archetype.descriptionKey) : '')}
            </p>
          </div>
        </div>

        {/* How to Read Guide */}
        <BlobReadingGuide />
      </CardContent>
    </Card>;
}