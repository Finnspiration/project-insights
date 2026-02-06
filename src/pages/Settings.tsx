import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.preferred_language || 'en');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ preferred_language: selectedLanguage });
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>

        <div className="space-y-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language.title')}</CardTitle>
              <CardDescription>{t('settings.language.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en" className="cursor-pointer">
                    🇬🇧 English
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="da" id="da" />
                  <Label htmlFor="da" className="cursor-pointer">
                    🇩🇰 Dansk
                  </Label>
                </div>
              </RadioGroup>
              <Button
                onClick={handleSave}
                disabled={saving || selectedLanguage === profile?.preferred_language}
                className="mt-4"
              >
                {saving ? t('settings.saving') : t('settings.saveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.subscription.title')}</CardTitle>
              <CardDescription>{t('settings.subscription.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.subscription.tier')}:</span>
                  <span className="font-medium capitalize">{profile?.subscription_tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.subscription.status')}:</span>
                  <span className="font-medium capitalize">{profile?.subscription_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.subscription.aiMessages')}:</span>
                  <span className="font-medium">{profile?.ai_messages_used_this_month || 0} / {profile?.subscription_tier === 'free' ? '20' : profile?.subscription_tier === 'professional' ? '500' : '∞'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
