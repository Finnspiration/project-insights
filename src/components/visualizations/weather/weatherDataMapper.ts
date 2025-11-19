// Maps project data to weather visualization data

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
          title: typeof spot.title === 'object' ? spot.title.da || spot.title.en : spot.title,
          description: 'Kritisk blind vinkel',
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
          title: typeof rec.title === 'object' ? rec.title.da || rec.title.en : rec.title,
          description: 'Anbefaling',
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
        title: typeof int.title === 'object' ? int.title.da || int.title.en : int.title,
        description: 'Intervention',
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

  // Use default IDG profile if not provided
  const defaultIDG = { being: 5, thinking: 6, relating: 5, collaborating: 6, acting: 5 };
  const profile = idgProfile || defaultIDG;

  // Create 5 temperature regions based on IDG profile
  const temperatureZones: TemperatureRegion[] = [
    {
      id: 'being',
      name: 'Væren',
      score: profile.being,
      temperature: mapIDGScoreToTemperature(profile.being),
      color: getTemperatureColor(mapIDGScoreToTemperature(profile.being)),
      position: { x: 20, y: 20 }, // NW
    },
    {
      id: 'thinking',
      name: 'Tænkning',
      score: profile.thinking,
      temperature: mapIDGScoreToTemperature(profile.thinking),
      color: getTemperatureColor(mapIDGScoreToTemperature(profile.thinking)),
      position: { x: 80, y: 20 }, // NE
    },
    {
      id: 'relating',
      name: 'Relationsdannelse',
      score: profile.relating,
      temperature: mapIDGScoreToTemperature(profile.relating),
      color: getTemperatureColor(mapIDGScoreToTemperature(profile.relating)),
      position: { x: 50, y: 50 }, // Center
    },
    {
      id: 'collaborating',
      name: 'Samarbejde',
      score: profile.collaborating,
      temperature: mapIDGScoreToTemperature(profile.collaborating),
      color: getTemperatureColor(mapIDGScoreToTemperature(profile.collaborating)),
      position: { x: 20, y: 80 }, // SW
    },
    {
      id: 'acting',
      name: 'Handling',
      score: profile.acting,
      temperature: mapIDGScoreToTemperature(profile.acting),
      color: getTemperatureColor(mapIDGScoreToTemperature(profile.acting)),
      position: { x: 80, y: 80 }, // SE
    },
  ];

  const windPatterns = mapInformationFlowToWind(
    getMorphologyValue(morphology, 'information', 'network'),
    getMorphologyValue(morphology, 'temporal', 'project')
  );

  const pressureSystems = mapToPressureSystems(
    getMorphologyValue(morphology, 'risk', 'moderate'),
    getMorphologyValue(morphology, 'stakeholder', 'cooperative'),
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
