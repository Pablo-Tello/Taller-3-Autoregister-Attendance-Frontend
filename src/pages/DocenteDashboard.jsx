import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDocenteInfo, getDocenteCursos, getSesionesClase, generarCodigoQR } from '../services/api';
import { UserIcon, BookOpenIcon, QrCodeIcon } from '@heroicons/react/24/outline';

export const DocenteDashboard = () => {
  const { user, logout } = useAuth();
  const [docenteInfo, setDocenteInfo] = useState(null);
  const [secciones, setSecciones] = useState([]);
  const [sesionesClase, setSesionesClase] = useState([]);
  const [selectedSeccion, setSelectedSeccion] = useState(null);
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [codigoQR, setCodigoQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState('datos'); // 'datos' o 'cursos'
  const [selectedCurso, setSelectedCurso] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Datos del usuario en DocenteDashboard:', user);

        // Obtener información del docente usando el ID del docente directamente
        if (user?.docenteId) {
          // Obtener información detallada del docente
          console.log('Obteniendo información del docente con ID:', user.docenteId);
          const docenteData = await getDocenteInfo(user.docenteId);
          console.log('Datos del docente recibidos:', docenteData);

          if (docenteData) {
            setDocenteInfo(docenteData);
            console.log('Información del docente establecida:', docenteData);

            // Obtener cursos usando el ID del docente que ya tenemos
            console.log('Obteniendo cursos para el docente ID:', user.docenteId);
            const cursosData = await getDocenteCursos(user.docenteId);
            console.log('Datos de cursos recibidos:', cursosData);

            // Asegurarse de que cursosData sea un array
            if (Array.isArray(cursosData)) {
              setSecciones(cursosData);
              console.log('Cursos establecidos:', cursosData.length, 'cursos');
            } else {
              console.error('La respuesta de cursos no es un array:', cursosData);
              setSecciones([]);
            }
          } else {
            console.error('No se encontró información del docente');
            setError('No se encontró información del docente');
          }
        } else {
          console.error('ID de docente no disponible en el objeto de usuario');
          setError('No se pudo obtener el ID del docente');
        }
      } catch (error) {
        setError('Error al obtener información del docente');
        console.error('Error en fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Cargar sesiones de clase cuando se selecciona una sección
  useEffect(() => {
    const fetchSesiones = async () => {
      if (selectedSeccion) {
        try {
          setLoading(true);
          // Obtener horarios de la sección seleccionada
          // Aquí asumimos que cada sección tiene un horario asociado
          // En un caso real, podríamos necesitar obtener primero los horarios
          const horarioId = selectedSeccion.int_idSeccion; // Esto es una simplificación
          const sesionesData = await getSesionesClase(horarioId);
          setSesionesClase(sesionesData);
        } catch (error) {
          setError('Error al obtener sesiones de clase');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSesiones();
  }, [selectedSeccion]);

  const handleSesionChange = (sesion) => {
    setSelectedSesion(sesion);
    setCodigoQR(null);
  };

  const handleGenerarQR = async () => {
    if (!selectedSesion || !user?.docenteId) {
      setError('Debe seleccionar una sesión de clase y tener un ID de docente válido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await generarCodigoQR(
        selectedSesion.int_idSesionClase,
        user.docenteId
      );
      setCodigoQR(data.qr_code);
    } catch (error) {
      setError('Error al generar código QR');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el clic en un curso
  const handleCursoClick = (seccion) => {
    setSelectedCurso(seccion);
    setSelectedSeccion(seccion);
    setSelectedSesion(null);
    setCodigoQR(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img
                  src="https://www.uni.edu.pe/images/logos/logo_uni_2016.png"
                  alt="UNI Logo"
                  className="h-8 mr-3"
                />
                <h1 className="text-xl font-bold text-gray-800">Sistema de Asistencia</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                {user?.email}
              </span>
              <button
                onClick={logout}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-uni-600 hover:bg-uni-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uni-500 transition-colors duration-200 disabled:bg-uni-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cerrando...
                  </>
                ) : 'Cerrar sesión'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Menú Docente</h2>
          </div>
          <nav className="mt-4">
            <ul>
              <li>
                <button
                  onClick={() => setActiveMenu('datos')}
                  className={`flex items-center w-full px-4 py-3 text-left ${activeMenu === 'datos' ? 'bg-uni-100 text-uni-700 border-l-4 border-uni-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  <span>Datos del Docente</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveMenu('cursos')}
                  className={`flex items-center w-full px-4 py-3 text-left ${activeMenu === 'cursos' ? 'bg-uni-100 text-uni-700 border-l-4 border-uni-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <BookOpenIcon className="h-5 w-5 mr-3" />
                  <span>Mis Cursos</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-6">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">
                Dashboard del Docente
              </h1>
            </header>

            <main>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uni-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando información...</p>
                </div>
              ) : (
                <>
                  {/* Datos del Docente */}
                  {activeMenu === 'datos' && docenteInfo && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Información del Docente
                        </h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Nombre completo
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {docenteInfo.str_nombres} {docenteInfo.str_apellidos}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Correo electrónico
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {docenteInfo.str_email}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Especialidad
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {docenteInfo.str_especialidad}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {/* Mis Cursos */}
                  {activeMenu === 'cursos' && (
                    <div>
                      {!selectedCurso ? (
                        <>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Mis Cursos Asignados</h3>
                          {secciones.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {secciones.map((seccion) => (
                                <div
                                  key={seccion.int_idSeccion}
                                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
                                  onClick={() => handleCursoClick(seccion)}
                                >
                                  <div className="p-4 border-b border-gray-200 bg-uni-50">
                                    <h4 className="font-semibold text-lg text-gray-800">Sección {seccion.str_numero}</h4>
                                  </div>
                                  <div className="p-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                      <span className="font-medium">Curso:</span> {seccion.str_nombreCurso || "No disponible"}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                      <span className="font-medium">Horario:</span> {seccion.str_horario || "No disponible"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Aula:</span> {seccion.str_aula || "No disponible"}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 px-4 py-3 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-uni-100 text-uni-800">
                                      <QrCodeIcon className="h-3 w-3 mr-1" />
                                      Generar QR
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white shadow rounded-lg p-6 text-center">
                              <p className="text-gray-500">No tienes cursos asignados actualmente.</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center mb-6">
                            <button
                              onClick={() => setSelectedCurso(null)}
                              className="mr-4 text-uni-600 hover:text-uni-800 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                              Volver a mis cursos
                            </button>
                            <h3 className="text-lg font-medium text-gray-900">
                              Sección {selectedCurso.str_numero} - {selectedCurso.str_nombreCurso || "Curso"}
                            </h3>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Generar Código QR
                              </h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Selecciona una sesión de clase para generar un código QR de asistencia.
                              </p>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5">
                              {error && (
                                <div className="mb-4 text-sm text-red-600">{error}</div>
                              )}

                              <div className="mb-4">
                                <label htmlFor="sesion" className="block text-sm font-medium text-gray-700 mb-1">
                                  Sesión de Clase
                                </label>
                                <select
                                  id="sesion"
                                  name="sesion"
                                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-uni-500 focus:border-uni-500 sm:text-sm rounded-md"
                                  onChange={(e) => {
                                    const sesion = sesionesClase.find(s => s.int_idSesionClase === parseInt(e.target.value));
                                    handleSesionChange(sesion);
                                  }}
                                  value={selectedSesion?.int_idSesionClase || ''}
                                  disabled={loading || !selectedSeccion || sesionesClase.length === 0}
                                >
                                  <option value="">Selecciona una sesión</option>
                                  {sesionesClase.map((sesion) => (
                                    <option key={sesion.int_idSesionClase} value={sesion.int_idSesionClase}>
                                      {sesion.str_tema || `Sesión ${sesion.int_idSesionClase}`}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                onClick={handleGenerarQR}
                                disabled={loading || !selectedSesion}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-uni-600 hover:bg-uni-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uni-500 disabled:bg-uni-300 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                {loading ? 'Generando...' : 'Generar Código QR'}
                              </button>

                              {codigoQR && (
                                <div className="mt-4">
                                  <div className="bg-gray-100 p-4 rounded-md">
                                    <p className="text-sm font-medium text-gray-900">
                                      Código QR generado:
                                    </p>
                                    <div className="mt-2 flex justify-center">
                                      <img
                                        src={codigoQR}
                                        alt="Código QR"
                                        className="h-64 w-64"
                                      />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 text-center">
                                      Este código QR tiene un tiempo limitado de validez.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
