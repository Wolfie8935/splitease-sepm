import { supabase } from '@/integrations/supabase/client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdmin: boolean;
  users: any[];
  loading: boolean;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.email === 'ag2351@srmist.edu.in') {
      setIsAdmin(true);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const resetUserPassword = async (email: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      if (error) throw error;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const value = {
    isAdmin,
    users,
    loading,
    deleteUser,
    resetUserPassword,
    updateUserPassword,
    fetchUsers,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}; 