import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginUser, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, ingrese su correo y contraseña');
      return;
    }

    try {
      console.log('Intentando iniciar sesión con:', { email });
      const result = await loginUser(email, password);

      if (!result.success) {
        console.error('Error de login:', result.message);
        setError(result.message || 'Error al iniciar sesión. Inténtelo de nuevo.');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setError('Error al conectar con el servidor. Por favor, inténtelo más tarde.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex w-full max-w-5xl animate-fade-in">
        {/* Panel izquierdo - Imagen de fondo y mensaje de bienvenida */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-uni-600 to-uni-800 rounded-l-2xl overflow-hidden relative">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-uni-600/90 to-uni-800/90 z-10"></div>
            <div className="absolute top-0 left-0 right-0 h-40 bg-white rounded-br-[100px] z-0"></div>
            {/* Patrón de fondo sutil */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0yNCAzMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAx'+
            'Ljc5IDQgNCA0IDQtMS43OSA0LTR6bTI0IDBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiI+PC9wYXRoPjwvZz48L2c+PC9zdmc+')] z-20"></div>
          </div>

          <div className="relative z-20 flex flex-col items-center justify-center w-full p-12 text-white">
            <div className="mb-8">
              <img
                src="https://www.uni.edu.pe/images/logos/logo_uni_2016.png"
                alt="UNI Logo"
                className="h-24 mx-auto"
              />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-center">BIENVENIDO AL</h2>
            <h1 className="text-3xl font-bold mb-6 text-center">Sistema de Asistencia Académica</h1>
            <p className="text-center text-white/80 max-w-md">
              Plataforma digital para el registro y control de asistencia de estudiantes y docentes de la Universidad Nacional de Ingeniería.
            </p>
          </div>
        </div>

        {/* Panel derecho - Formulario de login */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 rounded-2xl md:rounded-l-none md:rounded-r-2xl shadow-xl">
          <div className="md:hidden mb-8 flex justify-center">
            <img
              src="https://www.uni.edu.pe/images/logos/logo_uni_2016.png"
              alt="UNI Logo"
              className="h-16"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center md:text-left">Iniciar sesión</h2>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-uni-600 p-4 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-uni-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-uni-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-MAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uni-500 focus:border-uni-500 transition-colors"
                placeholder="usuario@uni.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                PASSWORD
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uni-500 focus:border-uni-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-uni-600 focus:ring-uni-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Recordar mis datos
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-uni-600 text-white py-3 px-4 rounded-md hover:bg-uni-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uni-500 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                className="flex-1 bg-white text-uni-600 border border-uni-600 py-3 px-4 rounded-md hover:bg-uni-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uni-500 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Registrarse
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Universidad Nacional de Ingeniería - Sistema de Asistencia</p>
            <p className="mt-1">&copy; {new Date().getFullYear()} Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
};
