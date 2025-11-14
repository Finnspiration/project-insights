import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BodyPartExplanationProps {
  part: 'head' | 'face' | 'shoulders' | 'torso' | 'belly' | 'spine' | 'legs';
  data: any;
  morphology: any;
}

export function BodyPartExplanation({ part, data, morphology }: BodyPartExplanationProps) {
  const { t } = useTranslation('common');
  
  const getStatus = (): 'healthy' | 'attention' | 'critical' | 'danger' => {
    if (part === 'head') {
      const clarity = data.clarity;
      if (clarity > 0.8) return 'healthy';
      if (clarity > 0.6) return 'attention';
      if (clarity > 0.4) return 'critical';
      return 'danger';
    }
    
    if (part === 'shoulders') {
      const resources = morphology?.resources;
      if (resources === 'rich') return 'healthy';
      if (resources === 'balanced') return 'attention';
      if (resources === 'constrained') return 'critical';
      return 'danger';
    }
    
    if (part === 'belly') {
      const risk = morphology?.risk;
      if (risk === 'low') return 'healthy';
      if (risk === 'moderate') return 'attention';
      if (risk === 'high') return 'critical';
      return 'danger';
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">
          {t(`visualizations.bodyScan.parts.${part}`)}
        </h4>
        <Badge className={statusColors[status]}>
          {t(`visualizations.bodyScan.status.${status}`)}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {getDescription()}
      </p>
    </div>
  );
}
