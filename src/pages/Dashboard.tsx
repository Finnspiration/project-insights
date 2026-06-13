import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Folder, CheckCircle, AlertCircle, FileText, MessageSquare, ArrowRight, Upload, Brain } from 'lucide-react';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import type { Project } from '@/types/project';
import { ProjectConstellation } from '@/components/visualizations/ProjectConstellation';
import { PortfolioIDGRadar } from '@/components/visualizations/PortfolioIDGRadar';
import { BlindSpotRiskMatrix } from '@/components/visualizations/BlindSpotRiskMatrix';
import { TheoryUPortfolioMap } from '@/components/visualizations/TheoryUPortfolioMap';
import { DNABarcodeStrip } from '@/components/visualizations/DNABarcodeStrip';

interface ProjectStats {
  total: number;
  assessed: number;
  unassessed: number;
  documents: number;
}


export default function Dashboard() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProjectStats>({ total: 0, assessed: 0, unassessed: 0, documents: 0 });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [aiMessagesUsed, setAiMessagesUsed] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState('free');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, description, dna_code, status, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      // Fetch documents count
      const { count: documentCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Fetch user profile for AI usage
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('ai_messages_used_this_month, subscription_tier')
        .eq('id', user?.id)
        .single();

      const projectList = projects || [];
      setStats({
        total: projectList.length,
        assessed: projectList.filter(p => p.dna_code).length,
        unassessed: projectList.filter(p => !p.dna_code).length,
        documents: documentCount || 0,
      });

      setRecentProjects(projectList.slice(0, 3));
      setAiMessagesUsed(profile?.ai_messages_used_this_month || 0);
      setSubscriptionTier(profile?.subscription_tier || 'free');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAiMessageLimit = () => {
    if (subscriptionTier === 'team') return '∞';
    if (subscriptionTier === 'pro') return '500';
    return '20';
  };

  const getAiMessagesRemaining = () => {
    if (subscriptionTier === 'team') return '∞';
    const limit = subscriptionTier === 'pro' ? 500 : 20;
    return Math.max(0, limit - aiMessagesUsed);
  };

  const getProjectName = (project: Project) => {
    if (typeof project.name === 'string') return project.name;
    return project.name?.[i18n.language] || project.name?.en || 'Unnamed Project';
  };

  const recommendations = [];
  if (stats.unassessed > 0) {
    recommendations.push({
      icon: Brain,
      title: t('dashboard.recommendations.completeAssessments'),
      description: t('dashboard.recommendations.completeAssessmentsDesc', { count: stats.unassessed }),
      action: () => navigate('/projects'),
      actionLabel: t('dashboard.recommendations.viewProjects'),
    });
  }
  if (stats.assessed > 0 && stats.documents === 0) {
    recommendations.push({
      icon: Upload,
      title: t('dashboard.recommendations.uploadDocuments'),
      description: t('dashboard.recommendations.uploadDocumentsDesc'),
      action: () => navigate('/projects'),
      actionLabel: t('dashboard.recommendations.viewProjects'),
    });
  }
  if (getAiMessagesRemaining() !== '∞' && Number(getAiMessagesRemaining()) < 5) {
    recommendations.push({
      icon: MessageSquare,
      title: t('dashboard.recommendations.lowAiMessages'),
      description: t('dashboard.recommendations.lowAiMessagesDesc'),
      action: () => navigate('/settings'),
      actionLabel: t('dashboard.recommendations.viewSettings'),
    });
  }

  const isEmpty = stats.total === 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : isEmpty ? (
          // Empty State
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
        ) : (
          <>
            {/* Project Statistics */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">{t('dashboard.overview')}</h2>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('dashboard.createProject')}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.stats.totalProjects')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.assessed}</div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.stats.assessed')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.unassessed}</div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.stats.unassessed')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.documents}</div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.stats.documents')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{aiMessagesUsed}</div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.stats.aiUsed')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Sparkles className="h-5 w-5 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{getAiMessagesRemaining()}</div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.stats.aiRemaining')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Portfolio Constellation */}
            {stats.assessed > 0 && <ProjectConstellation />}

            {/* Portfolio IDG Radar */}
            {stats.assessed > 1 && <PortfolioIDGRadar />}

            {/* Blind Spot Risk Matrix */}
            {stats.assessed > 0 && <BlindSpotRiskMatrix />}

            {/* Theory-U Portfolio Map */}
            {stats.assessed > 0 && <TheoryUPortfolioMap />}

            {/* DNA Barcode Strip */}
            {stats.assessed > 1 && <DNABarcodeStrip />}

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-4">{t('dashboard.recentProjects')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentProjects.map(project => (
                    <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/projects/${project.id}`)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-1">{getProjectName(project)}</CardTitle>
                          <Badge variant={project.dna_code ? 'default' : 'secondary'}>
                            {project.dna_code ? t('dashboard.assessed') : t('dashboard.unassessed')}
                          </Badge>
                        </div>
                        <CardDescription>
                          {formatDistanceToNow(new Date(project.created_at!), { addSuffix: true, locale: i18n.language === 'da' ? da : undefined })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}>
                            {t('dashboard.view')}
                          </Button>
                          {!project.dna_code && (
                            <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/projects`); }}>
                              {t('dashboard.assess')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {recommendations.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-4">{t('dashboard.recommendedActions')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <rec.icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{rec.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={rec.action}>
                          {rec.actionLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <CreateProjectDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            setCreateDialogOpen(false);
            fetchDashboardData();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
