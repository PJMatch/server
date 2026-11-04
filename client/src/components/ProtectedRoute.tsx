import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProgressBar } from './ui';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto py-24 px-4 flex flex-col items-center gap-4">
        <p className="font-bold text-blue-900 text-lg">Verifying session...</p>
        <ProgressBar value={70} size="md" color="primary" className="w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login, keeping the attempted location in navigation state
    return <Navigate to="/logowanie" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

