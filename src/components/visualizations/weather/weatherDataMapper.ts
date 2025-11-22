// Maps project data to weather visualization data

// Safe string extraction helper
function extractSafeString(value: any, fallback: string = 'Ukendt'): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'object' && value !== null) {
    return value.da || value.en || fallback;
  }
  return fallback;
}

// Helper function to extract morphology value (handles both string and object formats)
function getMorphologyValue(morphologyData: any, key: string, defaultValue: string): string {
  const data = morphologyData?.[key];
  
  // New format: { selectedValue: "...", selectedIndex: 0 }
  if (typeof data === 'object' && data !== null && 'selectedValue' in data) {
    const value = data.selectedValue;
    console.log(`📊 weatherDataMapper: ${key} = ${value} (from object)`);
    return value;
  }
  
  // Old format: just a string
  if (typeof data === 'string') {
    console.log(`📊 weatherDataMapper: ${key} = ${data} (string)`);
    return data;
  }
  
  console.warn(`📊 weatherDataMapper: ${key} missing, using default "${defaultValue}"`);
  return defaultValue;
}

export interface BaseClimateData {
  backgroundColor: string;
  skyDensity: number;
  skyColor: string;
  organizationalStage: string;
  complexity: string;
}

export interface TemperatureRegion {
  id: string;
  name: string;
  score: number;
  temperature: number; // 0-100
  color: string;
  position: { x: number; y: number }; // Percentage positions
}

export interface WindPattern {
  type: 'radial' | 'topdown' | 'network' | 'distributed';
  speed: number; // 1-4 (animation duration multiplier)
  lines: { x1: number; y1: number; x2: number; y2: number }[];
}

export interface PressureZone {
  id: string;
  type: 'H' | 'L';
  x: number;
  y: number;
  intensity: number; // 1-3
  label: string;
  metadata?: {
    source: string; // 'risk_profile' | 'blind_spot'
    description: string;
    blindSpotId?: string;
    blindSpotTitle?: string;
    priority?: string;
  };
}

export interface PressureFront {
  id: string;
  points: { x: number; y: number }[];
  type: 'cold' | 'warm' | 'occluded';
  intensity: number;
  metadata?: {
    source: string; // 'stakeholder' | 'blind_spot'
    description: string;
    blindSpotId?: string;
    blindSpotTitle?: string;
  };
}

export interface PrecipitationEvent {
  id: string;
  type: 'rain' | 'storm' | 'snow' | 'sun' | 'fog';
  x: number;
  y: number;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: 'recommendation' | 'intervention' | 'blindspot';
}

export interface ForecastDay {
  day: string;
  condition: string;
  icon: string;
  confidence: number;
  description: string;
}

export interface WeatherData {
  baseClimate: BaseClimateData;
  temperatureZones: TemperatureRegion[];
  windPatterns: WindPattern;
  pressureSystems: { zones: PressureZone[]; fronts: PressureFront[] };
  precipitation: PrecipitationEvent[];
  forecast: ForecastDay[];
}

export interface ForecastDay {
  day: string;
  condition: string;
  icon: string;
  confidence: number;
  description: string;
}

export interface WeatherData {
  baseClimate: BaseClimateData;
  temperatureZones: TemperatureRegion[];
  forecast: ForecastDay[];
}

// Map organizational stage to background colors
export function mapOrganizationalStage(stage: string): { bg: string; sky: string } {
  const stageMap: Record<string, { bg: string; sky: string }> = {
    red: { bg: 'linear-gradient(135deg, hsl(0, 60%, 25%) 0%, hsl(0, 50%, 35%) 100%)', sky: 'hsl(0, 40%, 40%)' },
    amber: { bg: 'linear-gradient(135deg, hsl(30, 70%, 25%) 0%, hsl(30, 60%, 40%) 100%)', sky: 'hsl(30, 50%, 45%)' },
    orange: { bg: 'linear-gradient(135deg, hsl(25, 75%, 35%) 0%, hsl(40, 70%, 50%) 100%)', sky: 'hsl(35, 65%, 55%)' },
    green: { bg: 'linear-gradient(135deg, hsl(145, 60%, 25%) 0%, hsl(145, 55%, 45%) 100%)', sky: 'hsl(145, 50%, 50%)' },
    teal: { bg: 'linear-gradient(135deg, hsl(175, 60%, 25%) 0%, hsl(175, 55%, 40%) 100%)', sky: 'hsl(175, 50%, 45%)' },
  };
  return stageMap[stage] || stageMap.orange;
}

// Map complexity to sky density (number of clouds)
export function mapComplexityToSkyDensity(complexity: string): number {
  const densityMap: Record<string, number> = {
    simple: 2,
    complicated: 4,
    complex: 7,
    chaotic: 12,
  };
  return densityMap[complexity] || 4;
}

// Map IDG score (0-10) to temperature celsius (-10 to 30)
export function mapIDGScoreToTemperature(score: number): number {
  // 0-10 maps to -10°C to 30°C
  return -10 + (score * 4);
}

// Get temperature color based on celsius
export function getTemperatureColor(temperature: number): string {
  if (temperature <= 0) return 'hsl(220, 90%, 55%)'; // Blue (freezing)
  if (temperature <= 10) return 'hsl(200, 80%, 50%)'; // Light blue (cold)
  if (temperature <= 20) return 'hsl(45, 95%, 55%)'; // Yellow (mild)
  return 'hsl(0, 85%, 60%)'; // Red (hot)
}

// Map information flow to wind patterns
export function mapInformationFlowToWind(
  informationFlow: string,
  temporalDynamics: string
): WindPattern {
  const flowPatterns: Record<string, WindPattern['type']> = {
    centralized: 'radial',
    hierarchical: 'topdown',
    network: 'network',
    distributed: 'distributed',
  };

  const speedMap: Record<string, number> = {
    sprint: 2,
    project: 4,
    program: 6,
    transformation: 8,
  };

  const type = flowPatterns[informationFlow] || 'network';
  const speed = speedMap[temporalDynamics] || 4;

  // Generate wind lines based on pattern type
  let lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  if (type === 'radial') {
    // Radial from center out
    for (let i = 0; i < 8; i++) {
      const angle = (i * 360) / 8;
      lines.push({
        x1: 50,
        y1: 50,
        x2: 50 + 40 * Math.cos((angle * Math.PI) / 180),
        y2: 50 + 40 * Math.sin((angle * Math.PI) / 180),
      });
    }
  } else if (type === 'topdown') {
    // Top to bottom
    for (let i = 0; i < 6; i++) {
      lines.push({
        x1: 20 + i * 12,
        y1: 10,
        x2: 20 + i * 12,
        y2: 90,
      });
    }
  } else if (type === 'network') {
    // Criss-crossing
    for (let i = 0; i < 5; i++) {
      lines.push({
        x1: i * 20 + 10,
        y1: 10,
        x2: (4 - i) * 20 + 10,
        y2: 90,
      });
    }
  } else {
    // Distributed - chaotic
    for (let i = 0; i < 10; i++) {
      lines.push({
        x1: (i * 37 + 10) % 90,
        y1: (i * 23 + 10) % 90,
        x2: ((i + 1) * 41 + 20) % 90,
        y2: ((i + 1) * 29 + 20) % 90,
      });
    }
  }

  return { type, speed, lines };
}

// Map risk and stakeholder to pressure systems
export function mapToPressureSystems(
  riskProfile: string,
  stakeholder: string,
  blindSpots?: any[]
): { zones: PressureZone[]; fronts: PressureFront[] } {
  const zones: PressureZone[] = [];

  // Risk profile descriptions
  const riskDescriptions: Record<string, string> = {
    low: 'Lav risikoprofil: Projektet har minimal usikkerhed og kendte faktorer',
    moderate: 'Moderat risikoprofil: Projektet har nogle usikre elementer der kræver opmærksomhed',
    high: 'Høj risikoprofil: Projektet har betydelige risici og komplekse udfordringer',
    extreme: 'Ekstrem risikoprofil: Projektet navigerer i ekstremt usikkert og volatilt terræn'
  };

  // Stakeholder descriptions
  const stakeholderDescriptions: Record<string, string> = {
    unified: 'Ensrettet stakeholder-felt: Stærk konsensus og fælles retning blandt interessenter',
    cooperative: 'Kooperativt stakeholder-felt: Generel samarbejdsvilje med nogle forskelle',
    competitive: 'Konkurrerende stakeholder-felt: Forskellige interesser skaber spændinger',
    adversarial: 'Modstridende stakeholder-felt: Direkte konflikter og modsatrettede agendaer'
  };

  // Risk creates H zones
  const riskMap: Record<string, number> = {
    low: 1,
    moderate: 2,
    high: 3,
    extreme: 4,
  };

  const riskIntensity = riskMap[riskProfile] || 2;

  // Add H zones based on risk
  for (let i = 0; i < riskIntensity; i++) {
    zones.push({
      id: `h-${i}`,
      type: 'H',
      x: 25 + i * 25,
      y: 25 + (i % 2) * 40,
      intensity: riskIntensity,
      label: 'Højtryk',
      metadata: {
        source: 'risk_profile',
        description: riskDescriptions[riskProfile] || 'Ukendt risikoprofil'
      }
    });
  }

  // Add extra H-zones from high-priority blind spots
  if (blindSpots && blindSpots.length > 0) {
    const highPrioritySpots = blindSpots.filter(bs => bs.priority === 'high');
    const extraPositions = [
      { x: 60, y: 45, label: 'Critical Gap' },
      { x: 40, y: 60, label: 'Blind Spot' },
      { x: 70, y: 55, label: 'Hidden Risk' },
    ];

    highPrioritySpots.slice(0, 3).forEach((blindSpot, index) => {
      // Extract title - handle both string and multilingual object formats
      const title = typeof blindSpot.title === 'object' 
        ? (blindSpot.title.da || blindSpot.title.en || 'Ukendt')
        : blindSpot.title || 'Ukendt';
      
      // Extract description - handle both string and multilingual object formats
      const description = typeof blindSpot.description === 'object'
        ? (blindSpot.description.da || blindSpot.description.en || '')
        : blindSpot.description || '';
      
      zones.push({
        id: `h-blindspot-${blindSpot.id}`,
        type: 'H',
        ...extraPositions[index],
        intensity: 3,
        metadata: {
          source: 'blind_spot',
          description: description ? `${title}: ${description}` : `Kritisk blind spot: ${title}`,
          blindSpotId: blindSpot.id,
          blindSpotTitle: title, // Always a string now
          priority: blindSpot.priority
        }
      });
    });
  }

  // Add L zones for balance
  zones.push({
    id: 'l-1',
    type: 'L',
    x: 70,
    y: 60,
    intensity: 1,
    label: 'Lavtryk',
    metadata: {
      source: 'risk_profile',
      description: 'Lavtryksområde: Mindre stress og roligere forhold'
    }
  });

  // Create fronts based on stakeholder dynamics
  const fronts: PressureFront[] = [];
  const stakeholderFronts: Record<string, number> = {
    unified: 0,
    cooperative: 1,
    competitive: 3,
    adversarial: 5,
  };

  const numFronts = stakeholderFronts[stakeholder] || 1;

  for (let i = 0; i < numFronts; i++) {
    const yPos = 8 + i * 8; // Start at top-center, smaller spacing
    fronts.push({
      id: `front-${i}`,
      points: [
        { x: 35, y: yPos },
        { x: 42, y: yPos + 2 },
        { x: 50, y: yPos - 1 },
        { x: 58, y: yPos + 2 },
        { x: 65, y: yPos },
      ],
      type: i % 2 === 0 ? 'cold' : 'warm',
      intensity: Math.ceil(numFronts / 2),
      metadata: {
        source: 'stakeholder',
        description: stakeholderDescriptions[stakeholder] || 'Ukendt stakeholder-dynamik'
      }
    });
  }

  // Add extra fronts from stakeholder/political blind spots
  if (blindSpots && blindSpots.length > 0) {
    const politicalSpots = blindSpots.filter(bs => {
      const title = typeof bs.title === 'object' 
        ? (bs.title.da || bs.title.en || '')
        : (bs.title || '');
      const desc = typeof bs.description === 'object'
        ? (bs.description.da || bs.description.en || '')
        : (bs.description || '');
      
      const text = `${title} ${desc}`.toLowerCase();
      return text.includes('stakeholder') || 
             text.includes('politik') || 
             text.includes('political') ||
             text.includes('konflikt') ||
             text.includes('conflict');
    });

    const extraFrontPaths = [
      [{ x: 38, y: 26 }, { x: 50, y: 24 }, { x: 62, y: 26 }], // Top-center
      [{ x: 36, y: 34 }, { x: 50, y: 32 }, { x: 64, y: 34 }], // Below first
    ];

    politicalSpots.slice(0, 2).forEach((blindSpot, index) => {
      const title = typeof blindSpot.title === 'object' 
        ? (blindSpot.title.da || blindSpot.title.en || 'Ukendt')
        : blindSpot.title;

      fronts.push({
        id: `front-blindspot-${blindSpot.id}`,
        type: 'occluded',
        points: extraFrontPaths[index],
        intensity: 3,
        metadata: {
          source: 'blind_spot',
          description: `Politisk/stakeholder konflikt: ${title}`,
          blindSpotId: blindSpot.id,
          blindSpotTitle: title
        }
      });
    });
  }

  return { zones, fronts };
}

// Map recommendations and interventions to precipitation
export function mapToPrecipitation(
  recommendations?: any[],
  interventions?: any[],
  blindSpots?: any[]
): PrecipitationEvent[] {
  const events: PrecipitationEvent[] = [];

  // Add storm warnings from high priority blind spots
  if (blindSpots) {
    blindSpots
      .filter((spot) => spot.priority === 'high')
      .slice(0, 3)
      .forEach((spot, i) => {
        events.push({
          id: `storm-${i}`,
          type: 'storm',
          x: 20 + i * 30,
          y: 30 + i * 10,
          priority: 'high',
          title: extractSafeString(spot.title, 'Kritisk blind vinkel'),
          description: extractSafeString(spot.description, 'Høj prioritet område kræver opmærksomhed'),
          source: 'blindspot',
        });
      });
  }

  // Add rain from medium priority recommendations
  if (recommendations) {
    recommendations
      .filter((rec) => rec.priority === 'medium')
      .slice(0, 2)
      .forEach((rec, i) => {
        events.push({
          id: `rain-${i}`,
          type: 'rain',
          x: 40 + i * 30,
          y: 50 + i * 15,
          priority: 'medium',
          title: extractSafeString(rec.title, 'Anbefaling'),
          description: extractSafeString(rec.description, 'Handling anbefalet'),
          source: 'recommendation',
        });
      });
  }

  // Add sun breaks from positive interventions
  if (interventions) {
    interventions.slice(0, 2).forEach((int, i) => {
      events.push({
        id: `sun-${i}`,
        type: 'sun',
        x: 60 + i * 20,
        y: 70,
        priority: 'low',
        title: extractSafeString(int.title, 'Positiv udvikling'),
        description: extractSafeString(int.description, 'Gode fremskridt'),
        source: 'intervention',
      });
    });
  }

  return events;
}

// Map Theory U position to forecast
export function mapTheoryUToForecast(
  position: string,
  nextPhase?: string,
  readiness?: any
): ForecastDay[] {
  const forecastMap: Record<string, { condition: string; icon: string; description: string }> = {
    downloading: { condition: 'Tåget', icon: '🌫️', description: 'Uklare mønstre, behov for dybere føling' },
    seeing: { condition: 'Delvis skyet', icon: '⛅', description: 'Klarhed fremkommer, mønstre synlige' },
    sensing: { condition: 'Let regn', icon: '🌧️', description: 'Rensende proces, dyb lytning' },
    presencing: { condition: 'Klart & roligt', icon: '🌅', description: 'Stilhed, dyb indsigt' },
    crystallizing: { condition: 'Solopgang', icon: '🌄', description: 'Vision krystalliserer, nyt daggry' },
    prototyping: { condition: 'Variabelt', icon: '🌦️', description: 'Eksperimenter, hurtige ændringer' },
    performing: { condition: 'Solrigt', icon: '☀️', description: 'Vedvarende præstation, klar himmel' },
  };

  const currentForecast = forecastMap[position] || forecastMap.downloading;
  const nextForecast = forecastMap[nextPhase || 'sensing'] || forecastMap.seeing;
  
  const confidence = readiness?.overall || 65;

  return [
    {
      day: 'I dag',
      condition: currentForecast.condition,
      icon: currentForecast.icon,
      confidence: confidence,
      description: currentForecast.description,
    },
    {
      day: 'I morgen',
      condition: nextForecast.condition,
      icon: nextForecast.icon,
      confidence: Math.max(40, confidence - 15),
      description: nextForecast.description,
    },
    {
      day: 'Dag 3',
      condition: confidence > 60 ? 'Forbedring' : 'Usikkert',
      icon: confidence > 60 ? '🌤️' : '☁️',
      confidence: Math.max(30, confidence - 25),
      description: confidence > 60 ? 'Positiv udvikling' : 'Flere muligheder',
    },
  ];
}

// Main mapper function
export function mapProjectToWeatherData(
  morphology: any,
  idgProfile?: { being: number; thinking: number; relating: number; collaborating: number; acting: number },
  theoryUAnalysis?: any,
  recommendations?: any[],
  interventions?: any[],
  blindSpots?: any[]
): WeatherData {
  // Extract values using helper (handles both formats)
  const stage = getMorphologyValue(morphology, 'organizational', 'orange');
  const complexity = getMorphologyValue(morphology, 'complexity', 'complicated');
  const { bg, sky } = mapOrganizationalStage(stage);

  const baseClimate: BaseClimateData = {
    backgroundColor: bg,
    skyDensity: mapComplexityToSkyDensity(complexity),
    skyColor: sky,
    organizationalStage: stage,
    complexity: complexity,
  };

  // Map morphology dimension values to scores (0-10)
  const valueToScore = (dimension: string, value: string): number => {
    const scoreMaps: Record<string, Record<string, number>> = {
      complexity: { simple: 2, complicated: 5, complex: 8, chaotic: 10 },
      organizational: { red: 2, amber: 4, orange: 6, green: 8, teal: 10 },
      cultural: { mono: 2, crossfunctional: 5, crossorg: 7, crosscultural: 10 },
      knowledge: { routine: 2, adaptive: 5, innovative: 8, breakthrough: 10 },
      challenge: { technical: 3, social: 5, political: 7, cognitive: 8, adaptive: 10 },
      development: { being: 2, thinking: 4, relating: 6, collaborating: 8, acting: 10 },
      resources: { rich: 10, balanced: 7, constrained: 4, scarce: 2 },
      stakeholder: { unified: 10, cooperative: 7, competitive: 4, adversarial: 2 },
      temporal: { sprint: 3, project: 5, program: 7, transformation: 10 },
      change: { incremental: 3, transitional: 5, transformational: 8, disruptive: 10 },
      information: { centralized: 3, hierarchical: 5, network: 7, distributed: 10 },
      risk: { low: 2, moderate: 5, high: 8, extreme: 10 },
    };
    
    return scoreMaps[dimension]?.[value] || 5;
  };

  // Create temperature regions based on MORPHOLOGY dimensions (grouped by category)
  // Temperatur Zoner group: complexity, organizational, cultural
  const complexityValue = getMorphologyValue(morphology, 'complexity', 'complicated');
  const orgValue = getMorphologyValue(morphology, 'organizational', 'orange');
  const culturalValue = getMorphologyValue(morphology, 'cultural', 'mono');
  
  // Nedbør & Skyer group: knowledge, challenge, change
  const knowledgeValue = getMorphologyValue(morphology, 'knowledge', 'adaptive');
  const challengeValue = getMorphologyValue(morphology, 'challenge', 'technical');
  const changeValue = getMorphologyValue(morphology, 'change', 'transitional');
  
  // Vind Mønstre group: information, temporal  
  const infoValue = getMorphologyValue(morphology, 'information', 'network');
  const temporalValue = getMorphologyValue(morphology, 'temporal', 'project');
  
  // Tryk & Fronter group: risk, stakeholder, resources, development
  const riskValue = getMorphologyValue(morphology, 'risk', 'moderate');
  const stakeholderValue = getMorphologyValue(morphology, 'stakeholder', 'cooperative');
  const resourcesValue = getMorphologyValue(morphology, 'resources', 'balanced');
  const developmentValue = getMorphologyValue(morphology, 'development', 'thinking');

  const temperatureZones: TemperatureRegion[] = [
    // Temperatur Zoner (3 dimensions)
    {
      id: 'complexity',
      name: 'Kompleksitetsniveau',
      score: valueToScore('complexity', complexityValue),
      temperature: mapIDGScoreToTemperature(valueToScore('complexity', complexityValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('complexity', complexityValue))),
      position: { x: 15, y: 15 },
    },
    {
      id: 'organizational',
      name: 'Organisatorisk Stadium',
      score: valueToScore('organizational', orgValue),
      temperature: mapIDGScoreToTemperature(valueToScore('organizational', orgValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('organizational', orgValue))),
      position: { x: 15, y: 45 },
    },
    {
      id: 'cultural',
      name: 'Kulturel Kontekst',
      score: valueToScore('cultural', culturalValue),
      temperature: mapIDGScoreToTemperature(valueToScore('cultural', culturalValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('cultural', culturalValue))),
      position: { x: 15, y: 75 },
    },
    
    // Vind Mønstre (2 dimensions)
    {
      id: 'information',
      name: 'Informationsflow',
      score: valueToScore('information', infoValue),
      temperature: mapIDGScoreToTemperature(valueToScore('information', infoValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('information', infoValue))),
      position: { x: 35, y: 30 },
    },
    {
      id: 'temporal',
      name: 'Temporal Dynamik',
      score: valueToScore('temporal', temporalValue),
      temperature: mapIDGScoreToTemperature(valueToScore('temporal', temporalValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('temporal', temporalValue))),
      position: { x: 35, y: 60 },
    },
    
    // Nedbør & Skyer (3 dimensions)
    {
      id: 'knowledge',
      name: 'Vidensintensitet',
      score: valueToScore('knowledge', knowledgeValue),
      temperature: mapIDGScoreToTemperature(valueToScore('knowledge', knowledgeValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('knowledge', knowledgeValue))),
      position: { x: 60, y: 20 },
    },
    {
      id: 'challenge',
      name: 'Primær Udfordring',
      score: valueToScore('challenge', challengeValue),
      temperature: mapIDGScoreToTemperature(valueToScore('challenge', challengeValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('challenge', challengeValue))),
      position: { x: 60, y: 50 },
    },
    {
      id: 'change',
      name: 'Forandringsintensitet',
      score: valueToScore('change', changeValue),
      temperature: mapIDGScoreToTemperature(valueToScore('change', changeValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('change', changeValue))),
      position: { x: 60, y: 80 },
    },
    
    // Tryk & Fronter (4 dimensions)
    {
      id: 'risk',
      name: 'Risikoprofil',
      score: valueToScore('risk', riskValue),
      temperature: mapIDGScoreToTemperature(valueToScore('risk', riskValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('risk', riskValue))),
      position: { x: 85, y: 15 },
    },
    {
      id: 'stakeholder',
      name: 'Interessentdynamik',
      score: valueToScore('stakeholder', stakeholderValue),
      temperature: mapIDGScoreToTemperature(valueToScore('stakeholder', stakeholderValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('stakeholder', stakeholderValue))),
      position: { x: 85, y: 40 },
    },
    {
      id: 'resources',
      name: 'Ressourcekarakteristika',
      score: valueToScore('resources', resourcesValue),
      temperature: mapIDGScoreToTemperature(valueToScore('resources', resourcesValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('resources', resourcesValue))),
      position: { x: 85, y: 65 },
    },
    {
      id: 'development',
      name: 'Indre Udviklingsbehov',
      score: valueToScore('development', developmentValue),
      temperature: mapIDGScoreToTemperature(valueToScore('development', developmentValue)),
      color: getTemperatureColor(mapIDGScoreToTemperature(valueToScore('development', developmentValue))),
      position: { x: 85, y: 90 },
    },
  ];

  const windPatterns = mapInformationFlowToWind(
    infoValue,
    temporalValue
  );

  const pressureSystems = mapToPressureSystems(
    riskValue,
    stakeholderValue,
    blindSpots
  );

  const precipitation = mapToPrecipitation(recommendations, interventions, blindSpots);

  const forecast = mapTheoryUToForecast(
    theoryUAnalysis?.position || 'downloading',
    theoryUAnalysis?.nextPhase,
    theoryUAnalysis?.readiness
  );

  return {
    baseClimate,
    temperatureZones,
    windPatterns,
    pressureSystems,
    precipitation,
    forecast,
  };
}
