import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, User as UserIcon } from 'lucide-react';
import { RoleAssignmentDialog } from './RoleAssignmentDialog';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  roles: string[];
  profile: {
    preferred_language: string;
    subscription_tier: string;
    subscription_status: string;
    ai_messages_used_this_month: number;
  } | null;
  project_count: number;
}

export function UserManagement() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const { isSuperAdmin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        method: 'GET',
      });

      if (error) throw error;

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t('admin.errors.fetchUsers'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('admin.loadingUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.userManagement')}</CardTitle>
          <CardDescription>{t('admin.userManagementDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.table.email')}</TableHead>
                <TableHead>{t('admin.table.roles')}</TableHead>
                <TableHead>{t('admin.table.subscription')}</TableHead>
                <TableHead>{t('admin.table.projects')}</TableHead>
                <TableHead>{t('admin.table.aiUsage')}</TableHead>
                <TableHead>{t('admin.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)} className="gap-1">
                            {getRoleIcon(role)}
                            {t(`admin.roles.${role}`)}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <UserIcon className="h-3 w-3" />
                          {t('admin.roles.user')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.profile?.subscription_tier || 'free'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.project_count}</TableCell>
                  <TableCell>
                    {user.profile?.ai_messages_used_this_month || 0}
                    {user.profile?.subscription_tier === 'free' && ' / 20'}
                  </TableCell>
                  <TableCell>
                    {isSuperAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        {t('admin.manageRoles')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.noUsers')}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <RoleAssignmentDialog
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          onSuccess={fetchUsers}
        />
      )}
    </>
  );
}
