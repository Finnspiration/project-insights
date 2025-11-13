import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-full" />
            <Sparkles className="relative h-24 w-24 text-primary" />
          </div>
          
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('dashboard.welcome')}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            {t('dashboard.emptyState')}
          </p>
          
          <Button size="lg" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-5 w-5" />
            {t('dashboard.createProject')}
          </Button>

          <CreateProjectDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={() => {
              // TODO: Refresh projects list
              console.log('Project created successfully');
            }}
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">{t('dashboard.quickStart.step1')}</h3>
              <p className="text-sm text-muted-foreground">{t('dashboard.quickStart.step1Desc')}</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">{t('dashboard.quickStart.step2')}</h3>
              <p className="text-sm text-muted-foreground">{t('dashboard.quickStart.step2Desc')}</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-3xl mb-2">💡</div>
              <h3 className="font-semibold mb-1">{t('dashboard.quickStart.step3')}</h3>
              <p className="text-sm text-muted-foreground">{t('dashboard.quickStart.step3Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
