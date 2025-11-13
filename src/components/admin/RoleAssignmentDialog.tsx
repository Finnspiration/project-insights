import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';

interface User {
  id: string;
  email: string;
  roles: string[];
}

interface RoleAssignmentDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RoleAssignmentDialog({ user, open, onOpenChange, onSuccess }: RoleAssignmentDialogProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const { isSuperAdmin } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles);

  const availableRoles = [
    { value: 'admin', label: t('admin.roles.admin'), description: t('admin.roleDescriptions.admin') },
    { value: 'super_admin', label: t('admin.roles.super_admin'), description: t('admin.roleDescriptions.super_admin') },
  ];

  const handleRoleToggle = (role: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentRoles = new Set(user.roles);
      const newRoles = new Set(selectedRoles);

      // Roles to add
      const rolesToAdd = Array.from(newRoles).filter(r => !currentRoles.has(r));
      
      // Roles to remove
      const rolesToRemove = Array.from(currentRoles).filter(r => !newRoles.has(r));

      // Add new roles
      for (const role of rolesToAdd) {
        const { error } = await supabase.functions.invoke('admin-manage-roles', {
          body: {
            userId: user.id,
            role,
            action: 'add'
          }
        });

        if (error) throw error;
      }

      // Remove roles
      for (const role of rolesToRemove) {
        const { error } = await supabase.functions.invoke('admin-manage-roles', {
          body: {
            userId: user.id,
            role,
            action: 'remove'
          }
        });

        if (error) throw error;
      }

      toast({
        title: t('admin.success.rolesUpdated'),
        description: t('admin.success.rolesUpdatedDesc'),
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: t('admin.errors.updateRoles'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.manageRoles')}</DialogTitle>
          <DialogDescription>
            {t('admin.manageRolesFor', { email: user.email })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableRoles.map((role) => (
            <div key={role.value} className="flex items-start space-x-3">
              <Checkbox
                id={role.value}
                checked={selectedRoles.includes(role.value)}
                onCheckedChange={(checked) => handleRoleToggle(role.value, checked as boolean)}
                disabled={!isSuperAdmin || (role.value === 'super_admin' && !isSuperAdmin)}
              />
              <div className="flex-1 space-y-1">
                <Label htmlFor={role.value} className="cursor-pointer font-medium">
                  {role.label}
                </Label>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('admin.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('admin.saving') : t('admin.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
