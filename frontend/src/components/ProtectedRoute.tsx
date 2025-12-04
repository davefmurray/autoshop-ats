import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireShop?: boolean;
}

export function ProtectedRoute({ children, requireShop = true }: ProtectedRouteProps) {
  const { user, shop, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If shop is required but user doesn't have one, redirect to setup
  if (requireShop && !shop) {
    return <Navigate to="/setup-shop" replace />;
  }

  return <>{children}</>;
}
