import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BodyPartExplanationProps {
  part: 'head' | 'face' | 'shoulders' | 'torso' | 'belly' | 'spine' | 'legs';
  data: any;
  morphology: any;
  documents?: any[];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export function BodyPartExplanation({ part, data, morphology, documents, isHovered, onHover, onLeave }: BodyPartExplanationProps) {
  const { t } = useTranslation('common');
  
  // Get relevant quote from documents
  const getRelevantQuote = (): string | null => {
    if (!documents || documents.length === 0) return null;
    
    // Find a document with relevant IDG analysis
    const partIDGMap: Record<string, string[]> = {
      head: ['thinking'],
      face: ['relating'],
      torso: ['being', 'relating'],
      legs: ['acting', 'collaborating']
    };
    
    const relevantIDGs = partIDGMap[part] || [];
    for (const doc of documents) {
      if (doc.metadata?.idgAnalysis) {
        for (const idgKey of relevantIDGs) {
          const quotes = doc.metadata.idgAnalysis[`${idgKey}Quotes`];
          if (quotes && quotes.length > 0) {
            return quotes[0];
          }
        }
      }
    }
    return null;
  };
  
  const quote = getRelevantQuote();
  
  const partNumbers: Record<string, number> = {
    head: 1,
    face: 2,
    shoulders: 3,
    torso: 4,
    belly: 5,
    spine: 6,
    legs: 7
  };
  
  const getStatus = (): 'healthy' | 'attention' | 'critical' | 'danger' => {
    if (part === 'head') {
      const clarity = data.clarity;
      if (clarity > 0.8) return 'healthy';
      if (clarity > 0.6) return 'attention';
      if (clarity > 0.4) return 'critical';
      return 'danger';
    }
    
    if (part === 'face') {
      const tension = data.tension;
      if (tension < 0.3) return 'healthy';
      if (tension < 0.7) return 'attention';
      return 'critical';
    }
    
    if (part === 'shoulders') {
      const resources = morphology?.resources;
      if (resources === 'rich') return 'healthy';
      if (resources === 'balanced') return 'attention';
      if (resources === 'constrained') return 'critical';
      return 'danger';
    }
    
    if (part === 'torso') {
      const heartStrength = data.heartStrength;
      if (heartStrength >= 0.8) return 'healthy';
      if (heartStrength >= 0.5) return 'attention';
      return 'critical';
    }
    
    if (part === 'belly') {
      const risk = morphology?.risk;
      if (risk === 'low') return 'healthy';
      if (risk === 'moderate') return 'attention';
      if (risk === 'high') return 'critical';
      return 'danger';
    }
    
    if (part === 'spine') {
      const strength = data.strength;
      if (strength >= 0.8) return 'healthy';
      if (strength >= 0.6) return 'attention';
      return 'critical';
    }
    
    if (part === 'legs') {
      const stability = data.stability;
      if (stability > 0.7) return 'healthy';
      if (stability > 0.5) return 'attention';
      if (stability > 0.3) return 'critical';
      return 'danger';
    }
    
    return 'attention';
  };
  
  const status = getStatus();
  
  const statusColors: Record<string, string> = {
    healthy: 'bg-chart-1 text-chart-1-foreground',
    attention: 'bg-chart-3 text-chart-3-foreground',
    critical: 'bg-chart-4 text-chart-4-foreground',
    danger: 'bg-chart-5 text-chart-5-foreground'
  };
  
  const getDescription = (): string => {
    if (part === 'head') {
      return t(`visualizations.bodyScan.descriptions.head.${morphology?.complexity || 'simple'}`);
    }
    if (part === 'face') {
      return t(`visualizations.bodyScan.descriptions.face.${morphology?.stakeholder || 'unified'}`);
    }
    if (part === 'shoulders') {
      return t(`visualizations.bodyScan.descriptions.shoulders.${morphology?.resources || 'balanced'}`);
    }
    if (part === 'torso') {
      return t(`visualizations.bodyScan.descriptions.torso.${morphology?.organizational || 'orange'}`);
    }
    if (part === 'belly') {
      return t(`visualizations.bodyScan.descriptions.belly.${morphology?.risk || 'moderate'}`);
    }
    if (part === 'spine') {
      return t(`visualizations.bodyScan.descriptions.spine.${morphology?.information || 'hierarchical'}`);
    }
    if (part === 'legs') {
      const stance = data.stance;
      return t(`visualizations.bodyScan.descriptions.legs.${stance}`);
    }
    return '';
  };
  
  return (
    <div 
      className={cn(
        "space-y-2 p-3 rounded-lg transition-all duration-300 cursor-pointer",
        isHovered && "bg-primary/10 ring-2 ring-primary/50 shadow-lg"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all duration-300",
            isHovered ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {partNumbers[part]}
          </span>
          <h4 className="font-semibold text-sm">
            {t(`visualizations.bodyScan.parts.${part}`)}
          </h4>
        </div>
        <Badge className={statusColors[status]}>
          {t(`visualizations.bodyScan.status.${status}`)}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground ml-8">
        {getDescription()}
      </p>
      
      {quote && (
        <div className="mt-2 ml-8 p-2 bg-accent/20 rounded border border-accent/30">
          <p className="text-xs font-semibold text-foreground mb-1">
            {t('visualizations.bodyScan.fromDocuments')}
          </p>
          <blockquote className="text-xs italic text-muted-foreground border-l-2 border-accent pl-2">
            "{quote}"
          </blockquote>
        </div>
      )}
    </div>
  );
}
