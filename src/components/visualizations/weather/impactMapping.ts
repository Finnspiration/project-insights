import { MORPHOLOGY_DIMENSIONS, DimensionKey } from '@/lib/morphologyConfig';

export interface WeatherImpact {
  icon: string;
  text: {
    en: string;
    da: string;
  };
}

// Map morphology dimensions to weather impacts
export function getWeatherImpacts(dimension: DimensionKey, value: string): WeatherImpact[] {
  const impactMap: Record<DimensionKey, Record<string, WeatherImpact[]>> = {
    complexity: {
      simple: [
        { icon: '☀️', text: { en: 'Clear skies', da: 'Klar himmel' } },
        { icon: '🌡️', text: { en: 'Stable 18°C', da: 'Stabil 18°C' } },
      ],
      complicated: [
        { icon: '⛅', text: { en: '+2 clouds', da: '+2 skyer' } },
        { icon: '🌡️', text: { en: '20°C, slight variation', da: '20°C, let variation' } },
      ],
      complex: [
        { icon: '☁️', text: { en: '+5 clouds', da: '+5 skyer' } },
        { icon: '🌡️', text: { en: '22°C, varied zones', da: '22°C, varierede zoner' } },
        { icon: '💨', text: { en: 'Wind speed ↑', da: 'Vindhastighed ↑' } },
      ],
      chaotic: [
        { icon: '⛈️', text: { en: '+12 clouds, storms', da: '+12 skyer, storme' } },
        { icon: '🌪️', text: { en: 'High wind, turbulence', da: 'Høj vind, turbulens' } },
        { icon: '🌡️', text: { en: 'Extreme 26°C+', da: 'Ekstrem 26°C+' } },
      ],
    },
    stakeholder: {
      unified: [
        { icon: '🌡️', text: { en: 'Warm zones (24°C)', da: 'Varme zoner (24°C)' } },
        { icon: '💨', text: { en: 'Aligned wind patterns', da: 'Justerede vindmønstre' } },
      ],
      cooperative: [
        { icon: '🌡️', text: { en: 'Mild 22°C', da: 'Mild 22°C' } },
        { icon: '☀️', text: { en: 'Few warm fronts', da: 'Få varme fronter' } },
      ],
      competitive: [
        { icon: '🌡️', text: { en: 'Cool 18°C', da: 'Kølig 18°C' } },
        { icon: '❄️', text: { en: 'Cold fronts appear', da: 'Kolde fronter vises' } },
      ],
      adversarial: [
        { icon: '🌡️', text: { en: 'Cold zones (14°C)', da: 'Kolde zoner (14°C)' } },
        { icon: '❄️', text: { en: 'Multiple cold fronts', da: 'Flere kolde fronter' } },
        { icon: '💨', text: { en: 'Conflicting winds', da: 'Modstridende vinde' } },
      ],
    },
    knowledge: {
      routine: [
        { icon: '☀️', text: { en: 'Clear weather', da: 'Klart vejr' } },
        { icon: '🌡️', text: { en: 'Stable temperature', da: 'Stabil temperatur' } },
      ],
      adaptive: [
        { icon: '⛅', text: { en: 'Partly cloudy', da: 'Delvis overskyet' } },
        { icon: '💨', text: { en: 'Moderate wind', da: 'Moderat vind' } },
      ],
      innovative: [
        { icon: '☁️', text: { en: 'More clouds', da: 'Flere skyer' } },
        { icon: '🌡️', text: { en: 'Temperature shifts', da: 'Temperaturskift' } },
      ],
      breakthrough: [
        { icon: '⛈️', text: { en: 'Storm systems', da: 'Stormesystemer' } },
        { icon: '🌪️', text: { en: 'High turbulence', da: 'Høj turbulens' } },
      ],
    },
    cultural: {
      mono: [
        { icon: '🌡️', text: { en: 'Uniform temperature', da: 'Ensartet temperatur' } },
        { icon: '💨', text: { en: 'Single wind pattern', da: 'Enkelt vindmønster' } },
      ],
      cross_functional: [
        { icon: '🌡️', text: { en: '2 temperature zones', da: '2 temperaturzoner' } },
        { icon: '💨', text: { en: 'Varied wind', da: 'Varieret vind' } },
      ],
      cross_org: [
        { icon: '🌡️', text: { en: '3+ temp zones', da: '3+ temp zoner' } },
        { icon: '☁️', text: { en: 'Multiple systems', da: 'Flere systemer' } },
      ],
      cross_cultural: [
        { icon: '🌡️', text: { en: 'Extreme variation', da: 'Ekstrem variation' } },
        { icon: '💨', text: { en: 'Complex wind patterns', da: 'Komplekse vindmønstre' } },
      ],
    },
    temporal: {
      sprint: [
        { icon: '💨', text: { en: 'Fast wind speed', da: 'Hurtig vindhastighed' } },
        { icon: '🌡️', text: { en: 'Quick changes', da: 'Hurtige ændringer' } },
      ],
      project: [
        { icon: '💨', text: { en: 'Moderate wind', da: 'Moderat vind' } },
        { icon: '🌡️', text: { en: 'Stable evolution', da: 'Stabil udvikling' } },
      ],
      program: [
        { icon: '💨', text: { en: 'Slow wind patterns', da: 'Langsomme vindmønstre' } },
        { icon: '☁️', text: { en: 'Layered systems', da: 'Lagdelte systemer' } },
      ],
      transformation: [
        { icon: '💨', text: { en: 'Complex circulation', da: 'Kompleks cirkulation' } },
        { icon: '⛈️', text: { en: 'Long-term storms', da: 'Langvarige storme' } },
      ],
    },
    organizational: {
      red: [
        { icon: '🌡️', text: { en: 'Hot, reactive (26°C)', da: 'Varm, reaktiv (26°C)' } },
        { icon: '⛈️', text: { en: 'Sudden storms', da: 'Pludselige storme' } },
      ],
      amber: [
        { icon: '🌡️', text: { en: 'Controlled 22°C', da: 'Kontrolleret 22°C' } },
        { icon: '💨', text: { en: 'Structured wind', da: 'Struktureret vind' } },
      ],
      orange: [
        { icon: '🌡️', text: { en: 'Competitive 20°C', da: 'Konkurrencepræget 20°C' } },
        { icon: '☁️', text: { en: 'Performance clouds', da: 'Performance skyer' } },
      ],
      green: [
        { icon: '🌡️', text: { en: 'Warm, inclusive (24°C)', da: 'Varm, inkluderende (24°C)' } },
        { icon: '☀️', text: { en: 'Harmonious weather', da: 'Harmonisk vejr' } },
      ],
      teal: [
        { icon: '🌡️', text: { en: 'Adaptive 22°C', da: 'Adaptiv 22°C' } },
        { icon: '💨', text: { en: 'Self-organizing wind', da: 'Selvorganiserende vind' } },
      ],
    },
    challenge: {
      technical: [
        { icon: '☁️', text: { en: 'Data clouds', da: 'Data skyer' } },
        { icon: '🌡️', text: { en: 'Precision needed', da: 'Præcision nødvendig' } },
      ],
      social: [
        { icon: '🌡️', text: { en: 'Relationship warmth', da: 'Relationel varme' } },
        { icon: '☀️', text: { en: 'Connection focus', da: 'Forbindelsesfokus' } },
      ],
      political: [
        { icon: '❄️', text: { en: 'Cold fronts', da: 'Kolde fronter' } },
        { icon: '💨', text: { en: 'Power dynamics wind', da: 'Magtdynamik vind' } },
      ],
      cognitive: [
        { icon: '☁️', text: { en: 'Mental fog', da: 'Mental tåge' } },
        { icon: '🌡️', text: { en: 'Thinking depth', da: 'Tænkningsdybde' } },
      ],
      adaptive: [
        { icon: '💨', text: { en: 'Change winds', da: 'Ændringsvinde' } },
        { icon: '⛈️', text: { en: 'Transformation storms', da: 'Transformationsstorme' } },
      ],
    },
    development: {
      being: [
        { icon: '🌡️', text: { en: 'Inner warmth', da: 'Indre varme' } },
        { icon: '☀️', text: { en: 'Presence clarity', da: 'Nærvær klarhed' } },
      ],
      thinking: [
        { icon: '☁️', text: { en: 'Cognitive clouds', da: 'Kognitive skyer' } },
        { icon: '🌡️', text: { en: 'Mental climate', da: 'Mentalt klima' } },
      ],
      relating: [
        { icon: '🌡️', text: { en: 'Relational warmth', da: 'Relationel varme' } },
        { icon: '💨', text: { en: 'Connection flow', da: 'Forbindelsesstrøm' } },
      ],
      collaborating: [
        { icon: '☀️', text: { en: 'Team sunshine', da: 'Team solskin' } },
        { icon: '💨', text: { en: 'Shared wind', da: 'Delt vind' } },
      ],
      acting: [
        { icon: '💨', text: { en: 'Action wind', da: 'Handlingsvind' } },
        { icon: '⛈️', text: { en: 'Implementation storms', da: 'Implementeringsstorme' } },
      ],
    },
    resources: {
      rich: [
        { icon: '☀️', text: { en: 'Abundant energy', da: 'Rigelig energi' } },
        { icon: '🌡️', text: { en: 'Comfortable 24°C', da: 'Behagelig 24°C' } },
      ],
      balanced: [
        { icon: '⛅', text: { en: 'Balanced conditions', da: 'Balancerede forhold' } },
        { icon: '🌡️', text: { en: 'Moderate 20°C', da: 'Moderat 20°C' } },
      ],
      constrained: [
        { icon: '☁️', text: { en: 'Resource clouds', da: 'Ressourceskyer' } },
        { icon: '🌡️', text: { en: 'Cooler 18°C', da: 'Køligere 18°C' } },
      ],
      scarce: [
        { icon: '⛈️', text: { en: 'Pressure systems', da: 'Trykssystemer' } },
        { icon: '🌡️', text: { en: 'Cold stress (14°C)', da: 'Kold stress (14°C)' } },
      ],
    },
    change: {
      incremental: [
        { icon: '☀️', text: { en: 'Gentle evolution', da: 'Blid udvikling' } },
        { icon: '🌡️', text: { en: 'Slow warming', da: 'Langsom opvarmning' } },
      ],
      transitional: [
        { icon: '⛅', text: { en: 'Transition clouds', da: 'Overgangsskyer' } },
        { icon: '💨', text: { en: 'Change winds', da: 'Ændringsvinde' } },
      ],
      transformational: [
        { icon: '☁️', text: { en: 'Heavy clouds', da: 'Tunge skyer' } },
        { icon: '⛈️', text: { en: 'Storm fronts', da: 'Stormfronter' } },
      ],
      disruptive: [
        { icon: '🌪️', text: { en: 'Tornado activity', da: 'Tornado aktivitet' } },
        { icon: '⛈️', text: { en: 'Severe storms', da: 'Alvorlige storme' } },
        { icon: '🌡️', text: { en: 'Extreme shifts', da: 'Ekstreme skift' } },
      ],
    },
    information: {
      centralized: [
        { icon: '💨', text: { en: 'Radial wind from center', da: 'Radial vind fra center' } },
        { icon: '🌡️', text: { en: 'Core heat source', da: 'Kernvarmekilde' } },
      ],
      hierarchical: [
        { icon: '💨', text: { en: 'Layered wind tiers', da: 'Lagdelte vindniveauer' } },
        { icon: '🌡️', text: { en: 'Top-down temp gradient', da: 'Top-down temp gradient' } },
      ],
      network: [
        { icon: '💨', text: { en: 'Multi-directional flow', da: 'Multidirektionel strøm' } },
        { icon: '🌡️', text: { en: 'Distributed warmth', da: 'Fordelt varme' } },
      ],
      distributed: [
        { icon: '💨', text: { en: 'Complex circulation', da: 'Kompleks cirkulation' } },
        { icon: '☁️', text: { en: 'Decentralized systems', da: 'Decentraliserede systemer' } },
      ],
    },
    risk: {
      low: [
        { icon: '☀️', text: { en: 'Clear, predictable', da: 'Klar, forudsigelig' } },
        { icon: '🌡️', text: { en: 'Stable 20°C', da: 'Stabil 20°C' } },
      ],
      moderate: [
        { icon: '⛅', text: { en: 'Some uncertainty', da: 'Nogen usikkerhed' } },
        { icon: '💨', text: { en: 'Variable wind', da: 'Variabel vind' } },
      ],
      high: [
        { icon: '☁️', text: { en: 'Heavy clouds', da: 'Tunge skyer' } },
        { icon: '⛈️', text: { en: 'Frequent storms', da: 'Hyppige storme' } },
      ],
      extreme: [
        { icon: '🌪️', text: { en: 'Tornado warnings', da: 'Tornado advarsler' } },
        { icon: '⛈️', text: { en: 'Catastrophic potential', da: 'Katastrofalt potentiale' } },
        { icon: '🌡️', text: { en: 'Extreme volatility', da: 'Ekstrem volatilitet' } },
      ],
    },
  };

  return impactMap[dimension]?.[value] || [];
}

// Map IDG scores (0-10) to weather impacts
export function getIDGImpacts(dimension: string, score: number, language: 'en' | 'da'): WeatherImpact[] {
  const impacts: WeatherImpact[] = [];

  const idgMap: Record<string, { low: WeatherImpact; high: WeatherImpact }> = {
    being: {
      low: { icon: '🌡️', text: { en: 'Cold inner climate (16°C)', da: 'Koldt indre klima (16°C)' } },
      high: { icon: '🌡️', text: { en: 'Warm presence (24°C)', da: 'Varm tilstedeværelse (24°C)' } },
    },
    thinking: {
      low: { icon: '☁️', text: { en: 'Mental fog', da: 'Mental tåge' } },
      high: { icon: '☀️', text: { en: 'Clear thinking', da: 'Klar tænkning' } },
    },
    relating: {
      low: { icon: '❄️', text: { en: 'Cold relational fronts', da: 'Kolde relationelle fronter' } },
      high: { icon: '🌡️', text: { en: 'Warm connections (25°C)', da: 'Varme forbindelser (25°C)' } },
    },
    collaborating: {
      low: { icon: '💨', text: { en: 'Fragmented wind', da: 'Fragmenteret vind' } },
      high: { icon: '💨', text: { en: 'Aligned team flow', da: 'Justeret teamstrøm' } },
    },
    acting: {
      low: { icon: '☁️', text: { en: 'Stagnant clouds', da: 'Stagnerende skyer' } },
      high: { icon: '💨', text: { en: 'Action wind ↑↑', da: 'Handlingsvind ↑↑' } },
    },
  };

  const mapping = idgMap[dimension];
  if (!mapping) return impacts;

  if (score <= 3) {
    impacts.push(mapping.low);
  } else if (score >= 7) {
    impacts.push(mapping.high);
  } else {
    // Medium range (4-6)
    impacts.push({
      icon: '⛅',
      text: {
        en: `Moderate ${dimension} climate`,
        da: `Moderat ${dimension} klima`,
      },
    });
  }

  return impacts;
}
