// Maps project data to weather visualization data

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

// Map IDG score (0-10) to temperature (0-100)
export function mapIDGScoreToTemperature(score: number): number {
  return score * 10; // 0-10 -> 0-100
}

// Get temperature color based on score
export function getTemperatureColor(temperature: number): string {
  if (temperature <= 30) return 'hsl(220, 90%, 55%)'; // Blue (cold)
  if (temperature <= 60) return 'hsl(180, 70%, 50%)'; // Cyan (cool)
  if (temperature <= 80) return 'hsl(45, 95%, 55%)'; // Yellow (warm)
  return 'hsl(0, 85%, 60%)'; // Red (hot)
}

// Map Theory U position to forecast
export function mapTheoryUToForecast(
  position: string,
  nextPhase?: string,
  readiness?: any
): ForecastDay[] {
  const forecastMap: Record<string, { condition: string; icon: string; description: string }> = {
    downloading: { condition: 'Foggy', icon: '🌫️', description: 'Unclear patterns, need deeper sensing' },
    seeing: { condition: 'Partly Cloudy', icon: '⛅', description: 'Clarity emerging, patterns visible' },
    sensing: { condition: 'Light Rain', icon: '🌧️', description: 'Cleansing process, deep listening' },
    presencing: { condition: 'Clear & Calm', icon: '🌅', description: 'Stillness, profound insight' },
    crystallizing: { condition: 'Sunrise', icon: '🌄', description: 'Vision crystallizing, new dawn' },
    prototyping: { condition: 'Variable', icon: '🌦️', description: 'Experimentation, rapid changes' },
    performing: { condition: 'Sunny', icon: '☀️', description: 'Sustained performance, clear skies' },
  };

  const currentForecast = forecastMap[position] || forecastMap.downloading;
  const nextForecast = forecastMap[nextPhase || 'sensing'] || forecastMap.seeing;
  
  const confidence = readiness?.overall || 65;

  return [
    {
      day: 'Today',
      condition: currentForecast.condition,
      icon: currentForecast.icon,
      confidence: confidence,
      description: currentForecast.description,
    },
    {
      day: 'Tomorrow',
      condition: nextForecast.condition,
      icon: nextForecast.icon,
      confidence: Math.max(40, confidence - 15),
      description: nextForecast.description,
    },
    {
      day: 'Day 3',
      condition: confidence > 60 ? 'Improving' : 'Uncertain',
      icon: confidence > 60 ? '🌤️' : '☁️',
      confidence: Math.max(30, confidence - 25),
      description: confidence > 60 ? 'Positive trajectory' : 'Multiple possibilities',
    },
  ];
}

// Main mapper function
export function mapProjectToWeatherData(
  morphology: any,
  idgProfile: { being: number; thinking: number; relating: number; collaborating: number; acting: number },
  theoryUAnalysis?: any
): WeatherData {
  const stage = morphology?.organizational_stage || 'orange';
  const complexity = morphology?.complexity || 'complicated';
  const { bg, sky } = mapOrganizationalStage(stage);

  const baseClimate: BaseClimateData = {
    backgroundColor: bg,
    skyDensity: mapComplexityToSkyDensity(complexity),
    skyColor: sky,
    organizationalStage: stage,
    complexity: complexity,
  };

  // Create 5 temperature regions based on IDG profile
  const temperatureZones: TemperatureRegion[] = [
    {
      id: 'being',
      name: 'Being',
      score: idgProfile.being,
      temperature: mapIDGScoreToTemperature(idgProfile.being),
      color: getTemperatureColor(mapIDGScoreToTemperature(idgProfile.being)),
      position: { x: 20, y: 20 }, // NW
    },
    {
      id: 'thinking',
      name: 'Thinking',
      score: idgProfile.thinking,
      temperature: mapIDGScoreToTemperature(idgProfile.thinking),
      color: getTemperatureColor(mapIDGScoreToTemperature(idgProfile.thinking)),
      position: { x: 80, y: 20 }, // NE
    },
    {
      id: 'relating',
      name: 'Relating',
      score: idgProfile.relating,
      temperature: mapIDGScoreToTemperature(idgProfile.relating),
      color: getTemperatureColor(mapIDGScoreToTemperature(idgProfile.relating)),
      position: { x: 50, y: 50 }, // Center
    },
    {
      id: 'collaborating',
      name: 'Collaborating',
      score: idgProfile.collaborating,
      temperature: mapIDGScoreToTemperature(idgProfile.collaborating),
      color: getTemperatureColor(mapIDGScoreToTemperature(idgProfile.collaborating)),
      position: { x: 20, y: 80 }, // SW
    },
    {
      id: 'acting',
      name: 'Acting',
      score: idgProfile.acting,
      temperature: mapIDGScoreToTemperature(idgProfile.acting),
      color: getTemperatureColor(mapIDGScoreToTemperature(idgProfile.acting)),
      position: { x: 80, y: 80 }, // SE
    },
  ];

  const forecast = mapTheoryUToForecast(
    theoryUAnalysis?.position || 'downloading',
    theoryUAnalysis?.nextPhase,
    theoryUAnalysis?.readiness
  );

  return {
    baseClimate,
    temperatureZones,
    forecast,
  };
}
