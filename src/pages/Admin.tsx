import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminStats } from '@/components/admin/AdminStats';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProjectManagement } from '@/components/admin/ProjectManagement';
import { Shield } from 'lucide-react';

export default function Admin() {
  const { t } = useTranslation('common');

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
            <p className="text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
            <TabsTrigger value="projects">{t('admin.tabs.projects')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminStats />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
