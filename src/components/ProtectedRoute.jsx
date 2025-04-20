import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Si el usuario no tiene el rol permitido, redirigir a su dashboard
    if (user.role === 'docente') {
      return <Navigate to="/docente/dashboard" replace />;
    } else if (user.role === 'alumno') {
      return <Navigate to="/alumno/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
};
