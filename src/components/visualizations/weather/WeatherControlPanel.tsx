import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';
import { LiveEditMode } from './LiveEditMode';
import { DocumentViewMode } from './DocumentViewMode';
import { toast } from 'sonner';

interface WeatherControlPanelProps {
  projectId: string;
  morphology: any;
  idgProfile?: any;
  onMorphologyChange: (newMorphology: any) => void;
  onIDGChange?: (newIDG: any) => void;
  onSaveChanges?: () => Promise<void>;
  onReset?: () => void;
  hasChanges?: boolean;
}

export function WeatherControlPanel({
  projectId,
  morphology,
  idgProfile,
  onMorphologyChange,
  onIDGChange,
  onSaveChanges,
  onReset,
  hasChanges = false,
}: WeatherControlPanelProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSaveChanges) return;
    
    setSaving(true);
    try {
      await onSaveChanges();
      toast.success(language === 'da' ? 'Ændringer gemt' : 'Changes saved');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(language === 'da' ? 'Kunne ikke gemme ændringer' : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleApplySuggestion = (dimension: string, value: string) => {
    onMorphologyChange({
      ...morphology,
      [dimension]: value,
    });
    toast.success(language === 'da' ? 'Forslag anvendt' : 'Suggestion applied');
  };

  return (
    <Card className="mt-6 border-2 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {language === 'da' ? 'Interaktivt Kontrol Panel' : 'Interactive Control Panel'}
            </CardTitle>
            <CardDescription className="mt-1">
              {language === 'da' 
                ? 'Juster værdier for at se live påvirkning på vejrkortet'
                : 'Adjust values to see live impact on the weather map'}
            </CardDescription>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              {onReset && (
                <Button 
                  onClick={onReset} 
                  variant="outline" 
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {language === 'da' ? 'Nulstil' : 'Reset'}
                </Button>
              )}
              {onSaveChanges && (
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving 
                    ? (language === 'da' ? 'Gemmer...' : 'Saving...') 
                    : (language === 'da' ? 'Gem ændringer' : 'Save changes')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="live-edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live-edit">
              {language === 'da' ? 'Live Redigering' : 'Live Edit'}
            </TabsTrigger>
            <TabsTrigger value="document-analysis">
              {language === 'da' ? 'Dokument Analyse' : 'Document Analysis'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-edit" className="mt-4">
            <LiveEditMode
              morphology={morphology}
              idgProfile={idgProfile}
              onMorphologyChange={onMorphologyChange}
              onIDGChange={onIDGChange}
            />
          </TabsContent>

          <TabsContent value="document-analysis" className="mt-4">
            <DocumentViewMode
              projectId={projectId}
              onApplySuggestion={handleApplySuggestion}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
