import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { localized, type BlindSpot, type Language } from '@/types/project';
import type { WeatherReading, WindPatternKey } from '@/lib/weatherReading';

// One visual channel per variable type, the way a real weather chart works:
//
//   colour   = the tension field          (continuous)
//   arrows   = information flow           (direction)
//   markers  = open blind spots           (discrete events)
//
// The old field mixed these: background colour encoded a *categorical* Laloux
// stage, twelve circles encoded scores, dashed isobars encoded pressure, and
// eight converging lines — the most visually dominant thing on the canvas —
// encoded a single dimension.

interface WeatherFieldProps {
  reading: WeatherReading;
  blindSpots: BlindSpot[];
  language: Language;
  onSelectBlindSpot?: (blindSpot: BlindSpot) => void;
}

/** Two flow lines per pattern, expressed as SVG paths in a 100x100 viewBox. */
const WIND_PATHS: Record<WindPatternKey, string[]> = {
  centralized: ['M6,50 L44,50', 'M94,50 L56,50'],
  hierarchical: ['M50,6 L50,44', 'M50,56 L50,94'],
  network: ['M8,78 C30,70 44,52 62,44 S86,30 94,26', 'M6,92 C28,86 46,72 66,64 S88,52 96,48'],
  distributed: ['M10,20 L40,44', 'M90,80 L60,56'],
};

/** Deterministic, non-overlapping placement — highest priority nearest the centre. */
const MARKER_POSITIONS = [
  { x: 30, y: 36 },
  { x: 68, y: 62 },
  { x: 56, y: 22 },
  { x: 22, y: 68 },
  { x: 80, y: 32 },
  { x: 44, y: 80 },
];

const PRIORITY_SIZE: Record<string, number> = { high: 44, medium: 34, low: 26 };
const PRIORITY_COLOR: Record<string, string> = {
  high: 'hsl(4, 62%, 50%)',
  medium: 'hsl(27, 66%, 55%)',
  low: 'hsl(43, 55%, 54%)',
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function WeatherField({ reading, blindSpots, language, onSelectBlindSpot }: WeatherFieldProps) {
  const { t } = useTranslation('common');

  // Warm where pressure is high, cool where visibility is low — a single
  // continuous field rather than a categorical background colour.
  const warmth = reading.pressure.score * 10;
  const haze = (10 - reading.visibility.score) * 10;

  const openSpots = blindSpots
    .filter((spot) => spot.status !== 'addressed')
    .sort((a, b) => (PRIORITY_ORDER[a.priority ?? 'low'] ?? 2) - (PRIORITY_ORDER[b.priority ?? 'low'] ?? 2))
    .slice(0, MARKER_POSITIONS.length);

  return (
    <>
    <div
      className="relative h-[220px] w-full overflow-hidden sm:h-[360px] lg:h-full lg:min-h-[360px]"
      style={{
        background: `
          radial-gradient(58% 62% at 26% 32%, hsla(4, 62%, 50%, ${(warmth / 100) * 0.42}), transparent 66%),
          radial-gradient(50% 55% at 74% 66%, hsla(205, 65%, 50%, ${(haze / 100) * 0.36}), transparent 68%),
          linear-gradient(140deg, hsl(35, 30%, 94%) 0%, hsl(150, 8%, 94%) 52%, hsl(200, 22%, 93%) 100%)
        `,
      }}
    >
      {/* Information flow — one direction, not eight lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <marker id="wf-arrow" markerWidth="3.5" markerHeight="3.5" refX="3" refY="1.75" orient="auto">
            <path d="M0,0 L3.5,1.75 L0,3.5 z" fill="hsl(160, 10%, 58%)" />
          </marker>
        </defs>
        {WIND_PATHS[reading.wind].map((d, i) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="hsl(160, 10%, 58%)"
            strokeWidth={i === 0 ? 0.45 : 0.32}
            strokeDasharray="3 2.4"
            opacity={i === 0 ? 0.5 : 0.3}
            markerEnd="url(#wf-arrow)"
          />
        ))}
      </svg>

      {/* Open blind spots — the actual content of the map */}
      {openSpots.map((spot, i) => {
        const position = MARKER_POSITIONS[i];
        const priority = spot.priority ?? 'low';
        const size = PRIORITY_SIZE[priority] ?? 26;
        const title = localized(spot.title, language);

        return (
          <motion.button
            key={spot.id}
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
            onClick={() => onSelectBlindSpot?.(spot)}
            disabled={!onSelectBlindSpot}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <span
              className="grid place-items-center rounded-full font-bold text-white shadow-md"
              style={{
                width: size,
                height: size,
                background: PRIORITY_COLOR[priority] ?? PRIORITY_COLOR.low,
                fontSize: size > 36 ? 14 : 12,
              }}
            >
              {i + 1}
            </span>
            <span className="hidden max-w-[13rem] rounded-md border border-border bg-background/95 px-2 py-1 text-center text-[11px] font-medium leading-snug shadow-sm sm:block">
              {title}
              <span className="mt-0.5 block text-[9.5px] font-normal text-muted-foreground">
                {t(`blindSpots.priority.${priority}`, priority)}
              </span>
            </span>
          </motion.button>
        );
      })}

      {openSpots.length === 0 && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">
          {t('visualizations.weatherReading.noBlindSpots')}
        </p>
      )}

      {/* The only legend the field needs */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-border bg-background/85 px-2.5 py-1.5 text-[10.5px] text-muted-foreground backdrop-blur-sm">
        <span>{t('visualizations.weatherReading.scaleCool')}</span>
        <span
          className="h-1.5 w-20 rounded-full"
          style={{ background: 'linear-gradient(90deg, hsl(205,65%,50%), hsl(40,20%,88%), hsl(4,62%,50%))' }}
        />
        <span>{t('visualizations.weatherReading.scaleWarm')}</span>
        <span className="ml-1 hidden sm:inline">· {t('visualizations.weatherReading.scaleCaption')}</span>
      </div>
    </div>

    {/* Small screens have no room for inline labels; the numbers key to this list. */}
    {openSpots.length > 0 && (
      <ol className="space-y-1.5 border-t border-border px-5 py-4 sm:hidden">
        {openSpots.map((spot, i) => (
          <li key={spot.id}>
            <button
              type="button"
              onClick={() => onSelectBlindSpot?.(spot)}
              disabled={!onSelectBlindSpot}
              className="flex w-full items-start gap-2.5 text-left"
            >
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: PRIORITY_COLOR[spot.priority ?? 'low'] ?? PRIORITY_COLOR.low }}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-snug">
                  {localized(spot.title, language)}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {t(`blindSpots.priority.${spot.priority ?? 'low'}`, spot.priority ?? 'low')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    )}
    </>
  );
}
