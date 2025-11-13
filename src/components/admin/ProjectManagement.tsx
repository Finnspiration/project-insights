import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: { en?: string; da?: string };
  description: { en?: string; da?: string };
  status: string;
  dna_code: string | null;
  created_at: string;
  user_id: string;
  user_email?: string;
  team_size: number | null;
  timeline_start: string | null;
  timeline_end: string | null;
}

export function ProjectManagement() {
  const { t, i18n } = useTranslation('common');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dnaFilter, setDnaFilter] = useState<string>('all');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Fetch all projects (admin can see all)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch user emails for each project
      const projectsWithUsers: Project[] = [];
      
      for (const project of projectsData || []) {
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(project.user_id);
        
        projectsWithUsers.push({
          ...project,
          user_email: user?.email || 'Unknown'
        });
      }

      setProjects(projectsWithUsers);
      setFilteredProjects(projectsWithUsers);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: t('admin.errors.fetchProjects'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project => {
        const projectName = project.name?.[i18n.language as 'en' | 'da'] || project.name?.en || '';
        const userEmail = project.user_email || '';
        return (
          projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          userEmail.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // DNA filter
    if (dnaFilter !== 'all') {
      if (dnaFilter === 'assessed') {
        filtered = filtered.filter(project => project.dna_code !== null);
      } else if (dnaFilter === 'unassessed') {
        filtered = filtered.filter(project => project.dna_code === null);
      }
    }

    setFilteredProjects(filtered);
  }, [searchQuery, statusFilter, dnaFilter, projects, i18n.language]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'archived':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('admin.loadingProjects')}</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.projectManagement')}</CardTitle>
        <CardDescription>{t('admin.projectManagementDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchProjects')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('admin.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('admin.status.active')}</SelectItem>
                <SelectItem value="completed">{t('admin.status.completed')}</SelectItem>
                <SelectItem value="archived">{t('admin.status.archived')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dnaFilter} onValueChange={setDnaFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('admin.filterByDNA')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allProjects')}</SelectItem>
                <SelectItem value="assessed">{t('admin.assessed')}</SelectItem>
                <SelectItem value="unassessed">{t('admin.unassessed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.table.projectName')}</TableHead>
                <TableHead>{t('admin.table.owner')}</TableHead>
                <TableHead>{t('admin.table.status')}</TableHead>
                <TableHead>{t('admin.table.dnaAssessed')}</TableHead>
                <TableHead>{t('admin.table.teamSize')}</TableHead>
                <TableHead>{t('admin.table.created')}</TableHead>
                <TableHead>{t('admin.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    {project.name?.[i18n.language as 'en' | 'da'] || project.name?.en || 'Untitled'}
                  </TableCell>
                  <TableCell>{project.user_email}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {t(`admin.status.${project.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.dna_code ? (
                      <Badge variant="default">{t('admin.assessed')}</Badge>
                    ) : (
                      <Badge variant="outline">{t('admin.unassessed')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{project.team_size || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(project.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('admin.viewProject')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || dnaFilter !== 'all' 
              ? t('admin.noProjectsFiltered')
              : t('admin.noProjects')
            }
          </div>
        )}

        {/* Summary */}
        <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
          <div>
            {t('admin.showingProjects', { 
              count: filteredProjects.length, 
              total: projects.length 
            })}
          </div>
          <div>
            {t('admin.assessedCount', { 
              count: projects.filter(p => p.dna_code).length 
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
