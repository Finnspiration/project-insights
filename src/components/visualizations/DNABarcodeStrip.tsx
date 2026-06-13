import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dna, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/hooks/usePortfolio';
import { askAIChat } from '@/lib/aiChat';
import { MORPHOLOGY_DIMENSIONS } from '@/lib/morphologyConfig';

const ORDINAL_COLORS = ['#9FE1CB', '#5DCAA5', '#1D9E75', '#0F6E56', '#085041'];
const NEUTRAL = '#D3D1C7';

interface Band {
  color: string;
  label: string;
}
interface BarcodeRow {
  id: string;
  name: string;
  bands: Band[];
}

function readName(name: unknown, lang: string, fallback: string): string {
  if (typeof name === 'string') return name;
  const obj = name as { en?: string; da?: string } | null;
  return obj?.[lang as 'en' | 'da'] || obj?.en || fallback;
}

export function DNABarcodeStrip() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { data, isLoading } = usePortfolio();

  const rows = useMemo<BarcodeRow[]>(() => {
    if (!data) return [];
    return data.projects
      .filter((p) => p.dna_code && !p.dna_code.includes('[object Object]'))
      .map((p) => {
        const segments = (p.dna_code as string).split('-');
        const bands: Band[] = segments.map((seg, i) => {
          const dim = MORPHOLOGY_DIMENSIONS[i];
          const ordinal = dim ? dim.options.findIndex((o) => o.value === seg) : -1;
          const dimTitle = dim ? t(dim.translationKey) : '';
          const optionLabel =
            dim && ordinal >= 0 ? t(dim.options[ordinal].translationKey).split(' - ')[0] : seg;
          return {
            color: ordinal >= 0 ? ORDINAL_COLORS[Math.min(ordinal, ORDINAL_COLORS.length - 1)] : NEUTRAL,
            label: dimTitle ? `${dimTitle}: ${optionLabel}` : seg,
          };
        });
        return {
          id: p.id,
          name: readName(p.name, i18n.language, t('common.untitled', 'Untitled')),
          bands,
        };
      });
  }, [data, i18n.language, t]);

  if (isLoading) return <Skeleton className="h-[320px] w-full" />;
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Dna className="h-5 w-5 text-primary" />
              {t('visualizations.dnaBarcode.title')}
            </CardTitle>
            <CardDescription>{t('visualizations.dnaBarcode.description')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => askAIChat(t('visualizations.dnaBarcode.aiPrompt'))}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {t('visualizations.askAi')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => navigate(`/projects/${row.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted"
            >
              <span className="w-40 shrink-0 truncate text-sm font-medium">{row.name}</span>
              <div className="flex h-8 flex-1 overflow-hidden rounded">
                {row.bands.map((band, i) => (
                  <div
                    key={i}
                    title={band.label}
                    className="flex-1"
                    style={{ backgroundColor: band.color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{t('visualizations.dnaBarcode.legend')}</p>
      </CardContent>
    </Card>
  );
}
