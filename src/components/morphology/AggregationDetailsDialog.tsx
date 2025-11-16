import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, TrendingUp } from 'lucide-react';

interface AggregationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aggregationData: any;
}

export function AggregationDetailsDialog({
  open,
  onOpenChange,
  aggregationData
}: AggregationDetailsDialogProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';

  if (!aggregationData) return null;

  const { analyzedDocuments, totalDocuments, overallConfidence, overallAgreement, details } = aggregationData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'da' ? 'Aggregeringsdetaljer' : 'Aggregation Details'}
          </DialogTitle>
          <DialogDescription>
            {language === 'da' 
              ? `Baseret på ${analyzedDocuments} af ${totalDocuments} dokumenter`
              : `Based on ${analyzedDocuments} of ${totalDocuments} documents`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Overall Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {language === 'da' ? 'Samlet Tillid' : 'Overall Confidence'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Progress value={overallConfidence * 100} className="flex-1" />
                  <span className="text-2xl font-bold">{Math.round(overallConfidence * 100)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {language === 'da' ? 'Dokument-enighed' : 'Document Agreement'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Progress value={overallAgreement * 100} className="flex-1" />
                  <span className="text-2xl font-bold">{Math.round(overallAgreement * 100)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dimension Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              {language === 'da' ? 'Dimensionsdetaljer' : 'Dimension Details'}
            </h3>
            
            {Object.entries(details || {}).map(([dimension, data]: [string, any]) => (
              <Card key={dimension}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize">
                      {dimension.replace(/_/g, ' ')}
                    </CardTitle>
                    <Badge variant={data.agreement > 0.7 ? 'default' : 'secondary'}>
                      {Math.round(data.confidence * 100)}% {language === 'da' ? 'tillid' : 'confidence'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {language === 'da' ? 'Valgt værdi:' : 'Selected value:'}{' '}
                    <span className="font-medium">{data.selectedValue}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Agreement Stats */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>
                      {data.supportingDocuments} {language === 'da' ? 'af' : 'of'} {data.totalDocuments} {language === 'da' ? 'dokumenter' : 'documents'}
                    </span>
                    <TrendingUp className="h-3 w-3 ml-2" />
                    <span>{Math.round(data.agreement * 100)}% {language === 'da' ? 'enighed' : 'agreement'}</span>
                  </div>

                  {/* Supporting Documents */}
                  {data.sources && data.sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {language === 'da' ? 'Kilde-dokumenter:' : 'Source documents:'}
                      </p>
                      <div className="space-y-1">
                        {data.sources.map((source: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-muted/30 rounded p-2">
                            <span className="font-medium">{source.filename}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(source.confidence * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {data.alternatives && data.alternatives.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {language === 'da' ? 'Alternative forslag:' : 'Alternative suggestions:'}
                      </p>
                      {data.alternatives.map((alt: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span>{alt.value}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {alt.documentCount} {language === 'da' ? 'dok.' : 'docs'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(alt.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
