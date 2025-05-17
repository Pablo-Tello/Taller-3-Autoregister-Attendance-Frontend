import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, logout as apiLogout, refreshToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay tokens y datos de usuario en localStorage
    const accessToken = localStorage.getItem('access_token');
    const refreshTokenValue = localStorage.getItem('refresh_token');
    const userInfo = localStorage.getItem('user');

    if (accessToken && refreshTokenValue && userInfo) {
      setUser(JSON.parse(userInfo));
    } else if (refreshTokenValue && !accessToken) {
      // Si solo hay refresh token pero no access token, intentar refrescar
      handleTokenRefresh();
    }

    setLoading(false);
  }, []);

  // Función para manejar el refresco de token
  const handleTokenRefresh = async () => {
    try {
      await refreshToken();
      const userInfo = localStorage.getItem('user');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Error al refrescar token:', error);
      // Si falla el refresh, limpiar datos y redirigir al login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const loginUser = async (email, password) => {
    try {
      setLoading(true);
      console.log('AuthContext: Iniciando login con email:', email);

      const data = await login(email, password);

      console.log('AuthContext: Datos de login recibidos:', data);

      if (!data || !data.access_token || !data.refresh_token) {
        console.error('AuthContext: Datos de login inválidos:', data);
        return {
          success: false,
          message: 'Respuesta inválida del servidor',
        };
      }

      const userData = {
        email: data.email,
        userId: data.user_id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        role: data.role, // 'docente' o 'alumno'
        docenteId: data.docente_id,
        alumnoId: data.alumno_id,
        is_docente: data.is_docente,
        is_alumno: data.is_alumno
      };

      console.log('AuthContext: Guardando datos de usuario:', userData);
      // Los tokens ya se guardan en la función login de api.js
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      if (userData.role === 'docente') {
        console.log('AuthContext: Redirigiendo a dashboard de docente');
        navigate('/docente/dashboard');
      } else if (userData.role === 'alumno') {
        console.log('AuthContext: Redirigiendo a dashboard de alumno');
        navigate('/alumno/dashboard');
      } else {
        console.warn('AuthContext: Rol desconocido:', userData.role);
      }

      return { success: true };
    } catch (error) {
      console.error('AuthContext: Error en loginUser:', error);
      console.error('AuthContext: Detalles del error:', error.response?.data || error.message);

      let errorMessage = 'Error al iniciar sesión';

      if (error.response) {
        // Error de respuesta del servidor
        if (error.response.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.non_field_errors) {
          // Errores de validación de Django REST Framework
          errorMessage = error.response.data.non_field_errors[0];
        }
      } else if (error.request) {
        // Error de red
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      } else {
        // Error de configuración
        errorMessage = error.message || 'Error desconocido';
      }

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Llamar al endpoint de logout
      await apiLogout();

      // Limpiar datos locales (los tokens se limpian en la función logout de api.js)
      localStorage.removeItem('user');
      setUser(null);

      // Redireccionar al login
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún si hay error, limpiamos los datos locales
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
