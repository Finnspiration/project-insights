import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, X, ChevronDown, ChevronUp, Edit2, Check, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MORPHOLOGY_DIMENSIONS } from '@/lib/morphologyConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DimensionInfo {
  key: string;
  icon: string;
  effectKey: string;
  zone: string;
  lobeIndex: number;
}

// Updated effect keys to reflect new visual mappings
const DIMENSION_MAP: DimensionInfo[] = [
  { key: 'complexity', icon: '🌀', effectKey: 'spikesRoughness', zone: 'mainShape', lobeIndex: 0 },
  { key: 'stakeholder', icon: '👥', effectKey: 'lobesSpread', zone: 'mainShape', lobeIndex: 1 },
  { key: 'knowledge', icon: '🧠', effectKey: 'wireframePattern', zone: 'innerPattern', lobeIndex: 2 },
  { key: 'cultural', icon: '🌍', effectKey: 'multiHueColors', zone: 'culturalOverlay', lobeIndex: 3 },
  { key: 'organizational', icon: '🏢', effectKey: 'backgroundAtmosphere', zone: 'coreGlow', lobeIndex: 4 },
  { key: 'temporal', icon: '⏱️', effectKey: 'pulseSpeed', zone: 'outerGlow', lobeIndex: 5 },
  { key: 'development', icon: '🌱', effectKey: 'coreVisibility', zone: 'innerPattern', lobeIndex: 6 },
  { key: 'risk', icon: '🔥', effectKey: 'glowWarningAura', zone: 'outerGlow', lobeIndex: 7 },
  { key: 'challenge', icon: '⚡', effectKey: 'spikesParticles', zone: 'mainShape', lobeIndex: 8 },
  { key: 'resources', icon: '💎', effectKey: 'scaleSize', zone: 'mainShape', lobeIndex: 9 },
  { key: 'change', icon: '🔄', effectKey: 'rotationSpeed', zone: 'outerGlow', lobeIndex: 10 },
  { key: 'information', icon: '🕳️', effectKey: 'holesVoids', zone: 'mainShape', lobeIndex: 11 },
];

const ZONE_COLORS: Record<string, string> = {
  mainShape: 'hsl(220, 70%, 50%)',
  innerPattern: 'hsl(280, 65%, 60%)',
  outerGlow: 'hsl(30, 90%, 50%)',
  coreGlow: 'hsl(45, 80%, 55%)',
  culturalOverlay: 'hsl(340, 75%, 55%)',
};

interface EnhancedBlob3DLegendProps {
  morphology: Record<string, string>;
  projectId?: string;
  onHoverDimension?: (dimensionKey: string | null, lobeIndex: number | null) => void;
  onMorphologyUpdate?: (newMorphology: any) => void;
  className?: string;
}

export function EnhancedBlob3DLegend({ 
  morphology, 
  projectId,
  onHoverDimension, 
  onMorphologyUpdate,
  className 
}: EnhancedBlob3DLegendProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';
  
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('blob3d-legend-open');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);
  const [editingDimension, setEditingDimension] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Draggable state
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('blob3d-legend-open', JSON.stringify(isOpen));
  }, [isOpen]);

  // Keyboard shortcut (L to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      // Get parent container bounds for boundary checking
      const parent = dragRef.current?.parentElement;
      const maxX = parent ? parent.clientWidth - 320 : window.innerWidth - 320;
      const maxY = parent ? parent.clientHeight - 200 : window.innerHeight - 200;
      
      setPosition({
        x: Math.min(Math.max(0, initialPos.current.x + deltaX), maxX),
        y: Math.min(Math.max(0, initialPos.current.y + deltaY), maxY),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = position;
  };

  const getMorphologyValue = (key: string): string => {
    const value = morphology?.[key];
    if (typeof value === 'object' && value !== null) {
      return (value as any).selectedValue || '';
    }
    return value || '';
  };

  const getEffectTranslation = (effectKey: string): string => {
    const effects: Record<string, { en: string; da: string }> = {
      spikesRoughness: { en: 'Spikes & surface', da: 'Pigge & overflade' },
      lobesSpread: { en: 'Lobes & spread', da: 'Arme & spredning' },
      wireframePattern: { en: 'Orbit & edge glow', da: 'Kredsløb & kantglød' },
      multiHueColors: { en: 'Multi-hue colors', da: 'Multi-farve nuancer' },
      backgroundAtmosphere: { en: 'Background & atmosphere', da: 'Baggrund & atmosfære' },
      pulseSpeed: { en: 'Pulse speed', da: 'Pulshastighed' },
      coreVisibility: { en: 'Core visibility', da: 'Kerne-synlighed' },
      glowWarningAura: { en: 'Glow & warning aura', da: 'Glød & advarsels-aura' },
      spikesParticles: { en: 'Spikes & particles', da: 'Pigge & partikler' },
      scaleSize: { en: 'Scale & size', da: 'Skala & størrelse' },
      rotationSpeed: { en: 'Rotation speed', da: 'Rotationshastighed' },
      holesVoids: { en: 'Holes & voids', da: 'Huller & hulrum' },
    };
    
    return effects[effectKey]?.[language] || effectKey;
  };

  const handleDimensionHover = (dim: DimensionInfo | null) => {
    const key = dim?.key || null;
    const lobeIndex = dim?.lobeIndex ?? null;
    setHoveredDimension(key);
    onHoverDimension?.(key, lobeIndex);
  };

  const handleStartEdit = (dimensionKey: string) => {
    if (!projectId) return;
    setEditingDimension(dimensionKey);
    setTempValue(getMorphologyValue(dimensionKey));
  };

  const handleSaveEdit = async () => {
    if (!projectId || !editingDimension) return;
    
    setIsSaving(true);
    
    const updatedMorphology = {
      ...morphology,
      [editingDimension]: tempValue
    };
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ morphology: updatedMorphology })
        .eq('id', projectId);
      
      if (error) throw error;
      
      toast.success(t('morphology.updateSuccess') || 'Morphology updated!');
      setEditingDimension(null);
      
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
    setEditingDimension(null);
    setTempValue('');
  };

  const getDimensionOptions = (dimensionKey: string) => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === dimensionKey);
    return dimension?.options || [];
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "absolute top-4 right-4 z-10 h-10 w-10 rounded-full",
          "bg-background/80 backdrop-blur-sm border border-border/50",
          "hover:bg-background/90 hover:border-border",
          "transition-all duration-200 shadow-lg",
          className
        )}
        title={language === 'da' ? 'Vis parameter guide (L)' : 'Show parameter guide (L)'}
      >
        <Info className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        "absolute z-10 w-80",
        "bg-background/95 backdrop-blur-md",
        "border border-border/50 rounded-xl shadow-2xl",
        "animate-in fade-in-0 slide-in-from-right-2 duration-300",
        "flex flex-col max-h-[80%]",
        isDragging && "cursor-grabbing select-none",
        className
      )}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      {/* Draggable Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-3 border-b border-border/30 flex-shrink-0",
          "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Info className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {language === 'da' ? 'Dimensioner' : 'Dimensions'}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            12
          </Badge>
        </div>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content - scrollable */}
      {isExpanded && (
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent'
          }}
          onMouseLeave={() => handleDimensionHover(null)}
        >
          <div className="p-2 space-y-1">
            {DIMENSION_MAP.map((dim) => {
              const value = getMorphologyValue(dim.key);
              const translatedName = t(`morphology.dimensions.${dim.key}.title`);
              const translatedValue = value 
                ? t(`morphology.dimensions.${dim.key}.options.${value}`)
                : (language === 'da' ? 'Ikke sat' : 'Not set');
              const zoneColor = ZONE_COLORS[dim.zone];
              const isHovered = hoveredDimension === dim.key;
              const isEditing = editingDimension === dim.key;
              const options = getDimensionOptions(dim.key);
              
              return (
                <div
                  key={dim.key}
                  onMouseEnter={() => handleDimensionHover(dim)}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    isHovered && !isEditing ? "bg-primary/10 scale-[1.01]" : "hover:bg-muted/50",
                    isEditing && "bg-primary/15 ring-1 ring-primary/30"
                  )}
                  style={isHovered || isEditing ? { 
                    borderLeft: `3px solid ${zoneColor}`,
                    paddingLeft: '5px'
                  } : undefined}
                >
                  <div className="flex items-start gap-2">
                    {/* Icon */}
                    <span className={cn(
                      "text-base flex-shrink-0 mt-0.5",
                      (isHovered || isEditing) && "scale-110"
                    )}>
                      {dim.icon}
                    </span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-xs font-medium",
                          (isHovered || isEditing) && "text-primary"
                        )}>
                          {translatedName}
                        </span>
                        
                        {/* Edit button or editing controls */}
                        {projectId && !isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            style={{ opacity: isHovered ? 1 : 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(dim.key);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Value display or editor */}
                      {isEditing ? (
                        <div className="mt-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <Select value={tempValue} onValueChange={setTempValue}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {t(opt.translationKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-6 text-xs flex-1"
                              onClick={handleSaveEdit}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  {language === 'da' ? 'Gem' : 'Save'}
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {translatedValue.split(' - ')[0]}
                          </div>
                          <div 
                            className={cn(
                              "text-[9px] mt-0.5 transition-opacity",
                              isHovered ? "opacity-100" : "opacity-50"
                            )}
                            style={{ color: zoneColor }}
                          >
                            → {getEffectTranslation(dim.effectKey)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border/30 bg-muted/30 flex-shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">
          {language === 'da' 
            ? 'Tryk L for at toggle • Træk for at flytte' 
            : 'Press L to toggle • Drag to move'}
        </p>
      </div>
    </div>
  );
}
