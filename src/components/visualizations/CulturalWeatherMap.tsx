import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, CloudSnow, Sun } from 'lucide-react';

interface CulturalWeatherMapProps {
  morphology: any;
}

export function CulturalWeatherMap({ morphology }: CulturalWeatherMapProps) {
  const { t } = useTranslation('common');

  // Map morphology to weather conditions
  const getWeatherCondition = () => {
    const stakeholder = morphology?.stakeholder || 'cooperative';
    const challenge = morphology?.challenge || 'technical';
    
    // Sunny: Unified/Cooperative + Technical/Social
    if (
      (stakeholder === 'unified' || stakeholder === 'cooperative') &&
      (challenge === 'technical' || challenge === 'social')
    ) {
      return {
        icon: Sun,
        label: t('visualizations.culturalWeather.conditions.sunny'),
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        temp: 85,
      };
    }
    
    // Cloudy: Cooperative/Competitive + Social/Political
    if (
      (stakeholder === 'cooperative' || stakeholder === 'competitive') &&
      (challenge === 'social' || challenge === 'political')
    ) {
      return {
        icon: Cloud,
        label: t('visualizations.culturalWeather.conditions.cloudy'),
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        temp: 60,
      };
    }
    
    // Rainy: Competitive/Adversarial + Political/Cognitive
    if (
      (stakeholder === 'competitive' || stakeholder === 'adversarial') &&
      (challenge === 'political' || challenge === 'cognitive')
    ) {
      return {
        icon: CloudRain,
        label: t('visualizations.culturalWeather.conditions.rainy'),
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        temp: 40,
      };
    }
    
    // Stormy: Adversarial + Adaptive
    return {
      icon: CloudSnow,
      label: t('visualizations.culturalWeather.conditions.stormy'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      temp: 25,
    };
  };

  const weather = getWeatherCondition();
  const WeatherIcon = weather.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WeatherIcon className={`h-5 w-5 ${weather.color}`} />
          {t('visualizations.culturalWeather.title')}
        </CardTitle>
        <CardDescription>
          {t('visualizations.culturalWeather.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`${weather.bgColor} rounded-lg p-8 transition-colors`}>
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Weather Icon */}
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-50" style={{ background: `var(--tw-gradient-from)` }} />
              <WeatherIcon className={`relative h-24 w-24 ${weather.color} animate-fade-in`} />
            </div>

            {/* Weather Label */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{weather.label}</h3>
              <p className="text-sm text-muted-foreground">
                {t('visualizations.culturalWeather.weather')}
              </p>
            </div>

            {/* Temperature Gauge */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('visualizations.culturalWeather.cold')}</span>
                <span>{t('visualizations.culturalWeather.temperature')}: {weather.temp}°</span>
                <span>{t('visualizations.culturalWeather.warm')}</span>
              </div>
              <div className="h-3 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full relative overflow-hidden">
                <div
                  className="absolute h-full w-1 bg-foreground shadow-lg transition-all duration-500"
                  style={{ left: `${weather.temp}%` }}
                />
              </div>
            </div>

            {/* Context Info */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md text-center text-sm">
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-muted-foreground mb-1">Stakeholder</p>
                <p className="font-medium capitalize">{morphology?.stakeholder || 'N/A'}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-muted-foreground mb-1">Challenge</p>
                <p className="font-medium capitalize">{morphology?.challenge || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
