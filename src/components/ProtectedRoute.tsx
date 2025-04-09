import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { currentUser, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If this route requires admin access and the user is not an admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
