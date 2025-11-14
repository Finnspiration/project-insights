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

export type CategoryType = 'context' | 'capacity' | 'dynamics' | 'resources' | 'challenge';

export interface DimensionOption {
  value: string;
  translationKeyShort: string;
  translationKeyLong: string;
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
      { value: 'simple', translationKeyShort: 'morphology.dimensions.complexity.options.simple.short', translationKeyLong: 'morphology.dimensions.complexity.options.simple.long' },
      { value: 'complicated', translationKeyShort: 'morphology.dimensions.complexity.options.complicated.short', translationKeyLong: 'morphology.dimensions.complexity.options.complicated.long' },
      { value: 'complex', translationKeyShort: 'morphology.dimensions.complexity.options.complex.short', translationKeyLong: 'morphology.dimensions.complexity.options.complex.long' },
      { value: 'chaotic', translationKeyShort: 'morphology.dimensions.complexity.options.chaotic.short', translationKeyLong: 'morphology.dimensions.complexity.options.chaotic.long' },
    ]
  },
  {
    key: 'stakeholder',
    translationKey: 'morphology.dimensions.stakeholder.title',
    category: 'context',
    options: [
      { value: 'unified', translationKeyShort: 'morphology.dimensions.stakeholder.options.unified.short', translationKeyLong: 'morphology.dimensions.stakeholder.options.unified.long' },
      { value: 'cooperative', translationKeyShort: 'morphology.dimensions.stakeholder.options.cooperative.short', translationKeyLong: 'morphology.dimensions.stakeholder.options.cooperative.long' },
      { value: 'competitive', translationKeyShort: 'morphology.dimensions.stakeholder.options.competitive.short', translationKeyLong: 'morphology.dimensions.stakeholder.options.competitive.long' },
      { value: 'adversarial', translationKeyShort: 'morphology.dimensions.stakeholder.options.adversarial.short', translationKeyLong: 'morphology.dimensions.stakeholder.options.adversarial.long' },
    ]
  },
  {
    key: 'knowledge',
    translationKey: 'morphology.dimensions.knowledge.title',
    category: 'capacity',
    options: [
      { value: 'routine', translationKeyShort: 'morphology.dimensions.knowledge.options.routine.short', translationKeyLong: 'morphology.dimensions.knowledge.options.routine.long' },
      { value: 'adaptive', translationKeyShort: 'morphology.dimensions.knowledge.options.adaptive.short', translationKeyLong: 'morphology.dimensions.knowledge.options.adaptive.long' },
      { value: 'innovative', translationKeyShort: 'morphology.dimensions.knowledge.options.innovative.short', translationKeyLong: 'morphology.dimensions.knowledge.options.innovative.long' },
      { value: 'breakthrough', translationKeyShort: 'morphology.dimensions.knowledge.options.breakthrough.short', translationKeyLong: 'morphology.dimensions.knowledge.options.breakthrough.long' },
    ]
  },
  {
    key: 'cultural',
    translationKey: 'morphology.dimensions.cultural.title',
    category: 'context',
    options: [
      { value: 'mono', translationKeyShort: 'morphology.dimensions.cultural.options.mono.short', translationKeyLong: 'morphology.dimensions.cultural.options.mono.long' },
      { value: 'crossfunctional', translationKeyShort: 'morphology.dimensions.cultural.options.crossfunctional.short', translationKeyLong: 'morphology.dimensions.cultural.options.crossfunctional.long' },
      { value: 'crossorg', translationKeyShort: 'morphology.dimensions.cultural.options.crossorg.short', translationKeyLong: 'morphology.dimensions.cultural.options.crossorg.long' },
      { value: 'crosscultural', translationKeyShort: 'morphology.dimensions.cultural.options.crosscultural.short', translationKeyLong: 'morphology.dimensions.cultural.options.crosscultural.long' },
    ]
  },
  {
    key: 'temporal',
    translationKey: 'morphology.dimensions.temporal.title',
    category: 'dynamics',
    options: [
      { value: 'sprint', translationKeyShort: 'morphology.dimensions.temporal.options.sprint.short', translationKeyLong: 'morphology.dimensions.temporal.options.sprint.long' },
      { value: 'project', translationKeyShort: 'morphology.dimensions.temporal.options.project.short', translationKeyLong: 'morphology.dimensions.temporal.options.project.long' },
      { value: 'program', translationKeyShort: 'morphology.dimensions.temporal.options.program.short', translationKeyLong: 'morphology.dimensions.temporal.options.program.long' },
      { value: 'transformation', translationKeyShort: 'morphology.dimensions.temporal.options.transformation.short', translationKeyLong: 'morphology.dimensions.temporal.options.transformation.long' },
    ]
  },
  {
    key: 'organizational',
    translationKey: 'morphology.dimensions.organizational.title',
    category: 'capacity',
    options: [
      { value: 'red', translationKeyShort: 'morphology.dimensions.organizational.options.red.short', translationKeyLong: 'morphology.dimensions.organizational.options.red.long' },
      { value: 'amber', translationKeyShort: 'morphology.dimensions.organizational.options.amber.short', translationKeyLong: 'morphology.dimensions.organizational.options.amber.long' },
      { value: 'orange', translationKeyShort: 'morphology.dimensions.organizational.options.orange.short', translationKeyLong: 'morphology.dimensions.organizational.options.orange.long' },
      { value: 'green', translationKeyShort: 'morphology.dimensions.organizational.options.green.short', translationKeyLong: 'morphology.dimensions.organizational.options.green.long' },
      { value: 'teal', translationKeyShort: 'morphology.dimensions.organizational.options.teal.short', translationKeyLong: 'morphology.dimensions.organizational.options.teal.long' },
    ]
  },
  {
    key: 'challenge',
    translationKey: 'morphology.dimensions.challenge.title',
    category: 'challenge',
    options: [
      { value: 'technical', translationKeyShort: 'morphology.dimensions.challenge.options.technical.short', translationKeyLong: 'morphology.dimensions.challenge.options.technical.long' },
      { value: 'social', translationKeyShort: 'morphology.dimensions.challenge.options.social.short', translationKeyLong: 'morphology.dimensions.challenge.options.social.long' },
      { value: 'political', translationKeyShort: 'morphology.dimensions.challenge.options.political.short', translationKeyLong: 'morphology.dimensions.challenge.options.political.long' },
      { value: 'cognitive', translationKeyShort: 'morphology.dimensions.challenge.options.cognitive.short', translationKeyLong: 'morphology.dimensions.challenge.options.cognitive.long' },
      { value: 'adaptive', translationKeyShort: 'morphology.dimensions.challenge.options.adaptive.short', translationKeyLong: 'morphology.dimensions.challenge.options.adaptive.long' },
    ]
  },
  {
    key: 'development',
    translationKey: 'morphology.dimensions.development.title',
    category: 'capacity',
    options: [
      { value: 'being', translationKeyShort: 'morphology.dimensions.development.options.being.short', translationKeyLong: 'morphology.dimensions.development.options.being.long' },
      { value: 'thinking', translationKeyShort: 'morphology.dimensions.development.options.thinking.short', translationKeyLong: 'morphology.dimensions.development.options.thinking.long' },
      { value: 'relating', translationKeyShort: 'morphology.dimensions.development.options.relating.short', translationKeyLong: 'morphology.dimensions.development.options.relating.long' },
      { value: 'collaborating', translationKeyShort: 'morphology.dimensions.development.options.collaborating.short', translationKeyLong: 'morphology.dimensions.development.options.collaborating.long' },
      { value: 'acting', translationKeyShort: 'morphology.dimensions.development.options.acting.short', translationKeyLong: 'morphology.dimensions.development.options.acting.long' },
    ]
  },
  {
    key: 'resources',
    translationKey: 'morphology.dimensions.resources.title',
    category: 'resources',
    options: [
      { value: 'rich', translationKeyShort: 'morphology.dimensions.resources.options.rich.short', translationKeyLong: 'morphology.dimensions.resources.options.rich.long' },
      { value: 'balanced', translationKeyShort: 'morphology.dimensions.resources.options.balanced.short', translationKeyLong: 'morphology.dimensions.resources.options.balanced.long' },
      { value: 'constrained', translationKeyShort: 'morphology.dimensions.resources.options.constrained.short', translationKeyLong: 'morphology.dimensions.resources.options.constrained.long' },
      { value: 'scarce', translationKeyShort: 'morphology.dimensions.resources.options.scarce.short', translationKeyLong: 'morphology.dimensions.resources.options.scarce.long' },
    ]
  },
  {
    key: 'change',
    translationKey: 'morphology.dimensions.change.title',
    category: 'dynamics',
    options: [
      { value: 'incremental', translationKeyShort: 'morphology.dimensions.change.options.incremental.short', translationKeyLong: 'morphology.dimensions.change.options.incremental.long' },
      { value: 'transitional', translationKeyShort: 'morphology.dimensions.change.options.transitional.short', translationKeyLong: 'morphology.dimensions.change.options.transitional.long' },
      { value: 'transformational', translationKeyShort: 'morphology.dimensions.change.options.transformational.short', translationKeyLong: 'morphology.dimensions.change.options.transformational.long' },
      { value: 'disruptive', translationKeyShort: 'morphology.dimensions.change.options.disruptive.short', translationKeyLong: 'morphology.dimensions.change.options.disruptive.long' },
    ]
  },
  {
    key: 'information',
    translationKey: 'morphology.dimensions.information.title',
    category: 'dynamics',
    options: [
      { value: 'centralized', translationKeyShort: 'morphology.dimensions.information.options.centralized.short', translationKeyLong: 'morphology.dimensions.information.options.centralized.long' },
      { value: 'hierarchical', translationKeyShort: 'morphology.dimensions.information.options.hierarchical.short', translationKeyLong: 'morphology.dimensions.information.options.hierarchical.long' },
      { value: 'network', translationKeyShort: 'morphology.dimensions.information.options.network.short', translationKeyLong: 'morphology.dimensions.information.options.network.long' },
      { value: 'distributed', translationKeyShort: 'morphology.dimensions.information.options.distributed.short', translationKeyLong: 'morphology.dimensions.information.options.distributed.long' },
    ]
  },
  {
    key: 'risk',
    translationKey: 'morphology.dimensions.risk.title',
    category: 'challenge',
    options: [
      { value: 'low', translationKeyShort: 'morphology.dimensions.risk.options.low.short', translationKeyLong: 'morphology.dimensions.risk.options.low.long' },
      { value: 'moderate', translationKeyShort: 'morphology.dimensions.risk.options.moderate.short', translationKeyLong: 'morphology.dimensions.risk.options.moderate.long' },
      { value: 'high', translationKeyShort: 'morphology.dimensions.risk.options.high.short', translationKeyLong: 'morphology.dimensions.risk.options.high.long' },
      { value: 'extreme', translationKeyShort: 'morphology.dimensions.risk.options.extreme.short', translationKeyLong: 'morphology.dimensions.risk.options.extreme.long' },
    ]
  },
];

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  context: 'hsl(var(--primary))',
  capacity: 'hsl(var(--secondary))',
  dynamics: 'hsl(var(--accent))',
  resources: 'hsl(var(--warning))',
  challenge: 'hsl(var(--success))',
};
