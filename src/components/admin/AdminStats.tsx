import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, FileText, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  users: {
    total: number;
    newLast30Days: number;
  };
  projects: {
    total: number;
    active: number;
    createdLast30Days: number;
  };
  documents: {
    total: number;
  };
  subscriptions: {
    free: number;
    professional: number;
    team: number;
    enterprise: number;
  };
  ai: {
    totalMessagesUsed: number;
    averagePerUser: number;
  };
}

export function AdminStats() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-stats', {
        method: 'GET',
      });

      if (error) throw error;

      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: t('admin.errors.fetchStats'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin.stats.totalUsers')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.users.total}</div>
          <p className="text-xs text-muted-foreground">
            {t('admin.stats.newLast30Days', { count: stats.users.newLast30Days })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin.stats.totalProjects')}</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.projects.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.projects.active} {t('admin.stats.active')} · {stats.projects.createdLast30Days} {t('admin.stats.last30Days')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin.stats.documents')}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documents.total}</div>
          <p className="text-xs text-muted-foreground">
            {t('admin.stats.totalUploaded')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin.stats.aiMessages')}</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ai.totalMessagesUsed}</div>
          <p className="text-xs text-muted-foreground">
            {stats.ai.averagePerUser} {t('admin.stats.avgPerUser')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
