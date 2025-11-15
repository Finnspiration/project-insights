export type DimensionKey = 
  | 'complexity' 
  | 'stakeholder' 
  | 'knowledge' 
  | 'cultural' 
  | 'temporal' 
  | 'organizational' 
  | 'challenge' 
  | 'development' 
  | 'resources' 
  | 'change' 
  | 'information' 
  | 'risk';

export type CategoryType = 'context' | 'capacity' | 'dynamics' | 'challenge_and_resources';

export interface DimensionOption {
  value: string;
  translationKey: string;
}

export interface DimensionConfig {
  key: DimensionKey;
  translationKey: string;
  category: CategoryType;
  options: DimensionOption[];
}

export const MORPHOLOGY_DIMENSIONS: DimensionConfig[] = [
  {
    key: 'complexity',
    translationKey: 'morphology.dimensions.complexity.title',
    category: 'context',
    options: [
      { value: 'simple', translationKey: 'morphology.dimensions.complexity.options.simple' },
      { value: 'complicated', translationKey: 'morphology.dimensions.complexity.options.complicated' },
      { value: 'complex', translationKey: 'morphology.dimensions.complexity.options.complex' },
      { value: 'chaotic', translationKey: 'morphology.dimensions.complexity.options.chaotic' },
    ]
  },
  {
    key: 'stakeholder',
    translationKey: 'morphology.dimensions.stakeholder.title',
    category: 'context',
    options: [
      { value: 'unified', translationKey: 'morphology.dimensions.stakeholder.options.unified' },
      { value: 'cooperative', translationKey: 'morphology.dimensions.stakeholder.options.cooperative' },
      { value: 'competitive', translationKey: 'morphology.dimensions.stakeholder.options.competitive' },
      { value: 'adversarial', translationKey: 'morphology.dimensions.stakeholder.options.adversarial' },
    ]
  },
  {
    key: 'knowledge',
    translationKey: 'morphology.dimensions.knowledge.title',
    category: 'capacity',
    options: [
      { value: 'routine', translationKey: 'morphology.dimensions.knowledge.options.routine' },
      { value: 'adaptive', translationKey: 'morphology.dimensions.knowledge.options.adaptive' },
      { value: 'innovative', translationKey: 'morphology.dimensions.knowledge.options.innovative' },
      { value: 'breakthrough', translationKey: 'morphology.dimensions.knowledge.options.breakthrough' },
    ]
  },
  {
    key: 'cultural',
    translationKey: 'morphology.dimensions.cultural.title',
    category: 'context',
    options: [
      { value: 'mono', translationKey: 'morphology.dimensions.cultural.options.mono' },
      { value: 'crossfunctional', translationKey: 'morphology.dimensions.cultural.options.crossfunctional' },
      { value: 'crossorg', translationKey: 'morphology.dimensions.cultural.options.crossorg' },
      { value: 'crosscultural', translationKey: 'morphology.dimensions.cultural.options.crosscultural' },
    ]
  },
  {
    key: 'temporal',
    translationKey: 'morphology.dimensions.temporal.title',
    category: 'dynamics',
    options: [
      { value: 'sprint', translationKey: 'morphology.dimensions.temporal.options.sprint' },
      { value: 'project', translationKey: 'morphology.dimensions.temporal.options.project' },
      { value: 'program', translationKey: 'morphology.dimensions.temporal.options.program' },
      { value: 'transformation', translationKey: 'morphology.dimensions.temporal.options.transformation' },
    ]
  },
  {
    key: 'organizational',
    translationKey: 'morphology.dimensions.organizational.title',
    category: 'capacity',
    options: [
      { value: 'red', translationKey: 'morphology.dimensions.organizational.options.red' },
      { value: 'amber', translationKey: 'morphology.dimensions.organizational.options.amber' },
      { value: 'orange', translationKey: 'morphology.dimensions.organizational.options.orange' },
      { value: 'green', translationKey: 'morphology.dimensions.organizational.options.green' },
      { value: 'teal', translationKey: 'morphology.dimensions.organizational.options.teal' },
    ]
  },
  {
    key: 'challenge',
    translationKey: 'morphology.dimensions.challenge.title',
    category: 'challenge_and_resources',
    options: [
      { value: 'technical', translationKey: 'morphology.dimensions.challenge.options.technical' },
      { value: 'social', translationKey: 'morphology.dimensions.challenge.options.social' },
      { value: 'political', translationKey: 'morphology.dimensions.challenge.options.political' },
      { value: 'cognitive', translationKey: 'morphology.dimensions.challenge.options.cognitive' },
      { value: 'adaptive', translationKey: 'morphology.dimensions.challenge.options.adaptive' },
    ]
  },
  {
    key: 'development',
    translationKey: 'morphology.dimensions.development.title',
    category: 'capacity',
    options: [
      { value: 'being', translationKey: 'morphology.dimensions.development.options.being' },
      { value: 'thinking', translationKey: 'morphology.dimensions.development.options.thinking' },
      { value: 'relating', translationKey: 'morphology.dimensions.development.options.relating' },
      { value: 'collaborating', translationKey: 'morphology.dimensions.development.options.collaborating' },
      { value: 'acting', translationKey: 'morphology.dimensions.development.options.acting' },
    ]
  },
  {
    key: 'resources',
    translationKey: 'morphology.dimensions.resources.title',
    category: 'challenge_and_resources',
    options: [
      { value: 'rich', translationKey: 'morphology.dimensions.resources.options.rich' },
      { value: 'balanced', translationKey: 'morphology.dimensions.resources.options.balanced' },
      { value: 'constrained', translationKey: 'morphology.dimensions.resources.options.constrained' },
      { value: 'scarce', translationKey: 'morphology.dimensions.resources.options.scarce' },
    ]
  },
  {
    key: 'change',
    translationKey: 'morphology.dimensions.change.title',
    category: 'dynamics',
    options: [
      { value: 'incremental', translationKey: 'morphology.dimensions.change.options.incremental' },
      { value: 'transitional', translationKey: 'morphology.dimensions.change.options.transitional' },
      { value: 'transformational', translationKey: 'morphology.dimensions.change.options.transformational' },
      { value: 'disruptive', translationKey: 'morphology.dimensions.change.options.disruptive' },
    ]
  },
  {
    key: 'information',
    translationKey: 'morphology.dimensions.information.title',
    category: 'dynamics',
    options: [
      { value: 'centralized', translationKey: 'morphology.dimensions.information.options.centralized' },
      { value: 'hierarchical', translationKey: 'morphology.dimensions.information.options.hierarchical' },
      { value: 'network', translationKey: 'morphology.dimensions.information.options.network' },
      { value: 'distributed', translationKey: 'morphology.dimensions.information.options.distributed' },
    ]
  },
  {
    key: 'risk',
    translationKey: 'morphology.dimensions.risk.title',
    category: 'challenge_and_resources',
    options: [
      { value: 'low', translationKey: 'morphology.dimensions.risk.options.low' },
      { value: 'moderate', translationKey: 'morphology.dimensions.risk.options.moderate' },
      { value: 'high', translationKey: 'morphology.dimensions.risk.options.high' },
      { value: 'extreme', translationKey: 'morphology.dimensions.risk.options.extreme' },
    ]
  },
];

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  context: '220, 70%, 50%',       // Blue
  capacity: '280, 65%, 60%',      // Purple
  dynamics: '340, 75%, 55%',      // Pink/Magenta
  challenge_and_resources: '30, 90%, 50%',  // Orange
};

export const CATEGORY_ICONS: Record<CategoryType, string> = {
  context: 'Globe',
  capacity: 'Brain',
  dynamics: 'Zap',
  challenge_and_resources: 'Shield',
};
