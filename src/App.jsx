import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { DocenteDashboard } from './pages/DocenteDashboard';
import { AlumnoDashboard } from './pages/AlumnoDashboard';
import { RegistrarAsistencia } from './pages/RegistrarAsistencia';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/docente/dashboard"
            element={
              <ProtectedRoute allowedRoles={['docente']}>
                <ErrorBoundary
                  FallbackComponent={({ error }) => (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                          <svg className="w-6 h-6 text-uni-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Ha ocurrido un error</h2>
                        <p className="text-gray-600 mb-6 text-center">
                          Lo sentimos, ha ocurrido un error al cargar el dashboard del docente. Por favor, intente nuevamente o contacte al administrador del sistema.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-md mb-4 overflow-auto max-h-40">
                          <p className="text-xs font-mono text-gray-700">{error.message}</p>
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => window.location.reload()}
                            className="bg-uni-600 text-white py-2 px-4 rounded-md hover:bg-uni-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uni-500 transition-colors duration-200"
                          >
                            Recargar página
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  onReset={() => window.location.reload()}
                >
                  <DocenteDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/alumno/dashboard"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <AlumnoDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alumno/registrar-asistencia"
            element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <RegistrarAsistencia />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
