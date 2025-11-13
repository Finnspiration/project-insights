import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminContextType {
  userRoles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  refreshRoles: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async () => {
    if (!user) {
      setUserRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        setUserRoles([]);
      } else {
        const roles = data?.map(r => r.role) || [];
        setUserRoles(roles);
        console.log('User roles loaded:', roles);
      }
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [user]);

  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
  const isSuperAdmin = userRoles.includes('super_admin');

  return (
    <AdminContext.Provider 
      value={{ 
        userRoles, 
        isAdmin, 
        isSuperAdmin, 
        loading,
        refreshRoles: fetchUserRoles
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
