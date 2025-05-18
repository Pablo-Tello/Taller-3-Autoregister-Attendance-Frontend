import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAlumnoInfo, getAlumnoSecciones, getAlumnoCursos, getAsistenciasByAlumnoSeccion, getSesionesBySeccion } from '../services/api';
import { Link } from 'react-router-dom';
import { UserIcon, BookOpenIcon, AcademicCapIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export const AlumnoDashboard = () => {
  const { user, logout } = useAuth();
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [secciones, setSecciones] = useState([]);
  const [secciones2, setSecciones2] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState('datos'); // 'datos' o 'cursos'
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  const formatTime = (timeString) => {
    // Extract hours, minutes, seconds
    const [hours, minutes, seconds] = timeString.split(':');

    // Remove milliseconds if present
    const cleanSeconds = seconds.split('.')[0];

    // Format in 12-hour format with AM/PM
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${hour12}:${minutes}:${cleanSeconds} ${ampm}`;
  }

  const searchSesionById = (id) => {
    try {
      // Buscar la sesión en el estado de sesiones
      const sesionData = sesiones.find(s => s.int_idSesionClase === parseInt(id));
      if (!sesionData) {
        console.log(`Sesión no encontrada para ID: ${id}`);
        return "Sesión no encontrada";
      }

      console.log('Datos de la sesión encontrada:', sesionData);

      // Si la sesión tiene un tema, devolverlo, de lo contrario devolver un texto genérico
      return sesionData.str_tema || `Sesión ${id}`;
    } catch (error) {
      console.error('Error al obtener la sesión:', error);
      return `Sesión ${id}`;
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Datos del usuario en AlumnoDashboard:', user);

        if (user?.alumnoId) {
          // Obtener información del alumno
          console.log('Obteniendo información del alumno con ID:', user.alumnoId);
          const alumnoData = await getAlumnoInfo(user.alumnoId);
          console.log('Datos del alumno recibidos:', alumnoData);

          if (alumnoData) {
            setAlumnoInfo(alumnoData);
            // console.log('Información del alumno establecida:', alumnoData);

            // Ya no cargamos todas las sesiones al inicio
            // Las sesiones se cargarán cuando se seleccione un curso
            setSesiones([]);

            // Obtener secciones del alumno (para compatibilidad con código existente)
            console.log('Obteniendo secciones para el alumno ID:', user.alumnoId);
            const seccionesData = await getAlumnoSecciones(user.alumnoId);
            console.log('Datos de secciones recibidos:', seccionesData);

            // Asegurarse de que seccionesData sea un array
            if (Array.isArray(seccionesData)) {
              // Filtrar las secciones que pertenecen al alumno
              const secciones_alumno = seccionesData.filter((seccion) => seccion.str_idAlumno.str_idAlumno === user.alumnoId)
              setSecciones(secciones_alumno);
              console.log('setSecciones:', secciones_alumno);
            } else {
              console.error('La respuesta de secciones no es un array:', seccionesData);
              setSecciones([]);
            }

            // Obtener cursos del alumno con información detallada
            console.log('Obteniendo cursos para el alumno ID:', user.alumnoId);
            const cursosData = await getAlumnoCursos(user.alumnoId);
            console.log('Datos de cursos recibidos:', cursosData);

            if (Array.isArray(cursosData) && cursosData.length > 0) {
              setSecciones2(cursosData);
              console.log('Cursos establecidos:', cursosData.length, 'cursos');
            } else {
              console.error('No se encontraron cursos para el alumno o la respuesta no es un array:', cursosData);
              setSecciones2([]);
            }

            // Ya no cargamos todas las asistencias al inicio
            // Las asistencias se cargarán cuando se seleccione un curso
            setAsistencias([]);
          } else {
            console.error('No se encontró información del alumno');
            setError('No se encontró información del alumno');
          }
        } else {
          console.error('ID de alumno no disponible en el objeto de usuario');
          setError('No se pudo obtener el ID del alumno');
        }
      } catch (error) {
        setError('Error al obtener información');
        console.error('Error en fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Función para manejar el clic en un curso
  const handleCursoClick = (seccion) => {
    setSelectedCurso(seccion);
  };

  // Función para obtener asistencias por el curso seleccionado
  const getAsistenciasByCurso = async () => {
    if (!selectedCurso) return [];

    // Buscar la inscripción del alumno en la sección seleccionada
    const inscripcion = secciones.find(
      (s) => s.int_idSeccion === selectedCurso.int_idSeccion
    );

    if (!inscripcion) return [];

    try {
      // Obtener asistencias directamente del endpoint específico
      const asistenciasData = await getAsistenciasByAlumnoSeccion(inscripcion.int_idAlumnoSeccion);
      return asistenciasData;
    } catch (error) {
      console.error('Error al obtener asistencias del curso:', error);
      return [];
    }
  };

  // Cargar asistencias y sesiones cuando se selecciona un curso
  useEffect(() => {
    if (selectedCurso) {
      const loadData = async () => {
        try {
          // Establecer estado de carga para asistencias
          setLoadingAsistencias(true);

          // Cargar asistencias
          const asistenciasCurso = await getAsistenciasByCurso();
          setAsistencias(asistenciasCurso);

          // Cargar sesiones de clase para la sección seleccionada
          console.log(`Cargando sesiones para la sección ID: ${selectedCurso.int_idSeccion}`);
          const sesionesCurso = await getSesionesBySeccion(selectedCurso.int_idSeccion);
          setSesiones(sesionesCurso);
          console.log(`Sesiones cargadas: ${sesionesCurso.length}`);
        } catch (error) {
          console.error('Error al cargar datos del curso:', error);
        } finally {
          // Finalizar estado de carga para asistencias
          setLoadingAsistencias(false);
        }
      };

      loadData();
    }
  }, [selectedCurso]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Sistema de Asistencia</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-2 sm:mr-4 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="hidden sm:inline">Cerrar sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar - hidden on mobile unless toggled */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block md:w-64 bg-white shadow-md z-10 ${mobileMenuOpen ? 'fixed inset-0 pt-16 h-full w-full md:relative md:pt-0' : ''}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Menú Alumno</h2>
            {/* Close button - only visible on mobile when menu is open */}
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 md:hidden text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
          <nav className="mt-4">
            <ul>
              <li>
                <button
                  onClick={() => {
                    setActiveMenu('datos');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 text-left ${activeMenu === 'datos' ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  <span>Datos del Alumno</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveMenu('cursos');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 text-left ${activeMenu === 'cursos' ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <BookOpenIcon className="h-5 w-5 mr-3" />
                  <span>Mis Cursos</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-4 md:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900">
                Dashboard del Alumno
              </h1>
            </header>
            <div className="px-0 py-4 sm:py-6 sm:px-0">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600">Cargando información...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs sm:text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Datos del Alumno */}
                  {activeMenu === 'datos' && alumnoInfo && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-3 py-4 sm:px-6 sm:py-5">
                        <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
                          Información del Alumno
                        </h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl>
                          <div className="bg-gray-50 px-3 py-3 sm:px-6 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">
                              Nombre completo
                            </dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {alumnoInfo.str_nombres} {alumnoInfo.str_apellidos}
                            </dd>
                          </div>
                          <div className="bg-white px-3 py-3 sm:px-6 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">
                              Código de alumno
                            </dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {alumnoInfo.str_idAlumno}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-3 py-3 sm:px-6 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">
                              Correo electrónico
                            </dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 break-words sm:mt-0 sm:col-span-2">
                              {alumnoInfo.str_email}
                            </dd>
                          </div>
                          <div className="bg-white px-3 py-3 sm:px-6 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">
                              Fecha de nacimiento
                            </dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {new Date(alumnoInfo.dt_fecha_nacimiento).toLocaleDateString()}
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
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Mis Cursos Matriculados</h3>
                          {secciones2.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                              {secciones2.map((seccion) => (
                                <div
                                  key={seccion.int_idSeccion}
                                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
                                  onClick={() => handleCursoClick(seccion)}
                                >
                                  <div className="p-3 md:p-4 border-b border-gray-200 bg-blue-50">
                                    <h4 className="font-semibold text-base md:text-lg text-gray-800 truncate">{seccion.str_nombreCurso || seccion.str_idCurso}</h4>
                                  </div>
                                  <div className="p-3 md:p-4">
                                    <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
                                      <span className="font-medium">Código:</span> {seccion.str_idCurso}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
                                      <span className="font-medium">Sección:</span> {seccion.str_numero}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
                                      <span className="font-medium">Ciclo:</span> {seccion.str_nombreCiclo || seccion.str_idCicloAcademico}
                                    </p>
                                    {seccion.int_creditos && (
                                      <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
                                        <span className="font-medium">Créditos:</span> {seccion.int_creditos}
                                      </p>
                                    )}
                                    <div className="mt-2 md:mt-3 flex justify-end">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <AcademicCapIcon className="h-3 w-3 mr-1" />
                                        Ver asistencias
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white shadow rounded-lg p-4 sm:p-6 text-center">
                              <p className="text-xs sm:text-sm text-gray-500">No tienes cursos matriculados actualmente.</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center mb-4 md:mb-6">
                            <button
                              onClick={() => setSelectedCurso(null)}
                              className="mb-2 sm:mb-0 sm:mr-4 text-blue-600 hover:text-blue-800 flex items-center text-sm md:text-base"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                              Volver a mis cursos
                            </button>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                              {selectedCurso.str_nombreCurso || selectedCurso.str_idCurso} - Sección {selectedCurso.str_numero}
                            </h3>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-3 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row justify-between sm:items-center">
                              <div>
                                <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
                                  Asistencias
                                </h3>
                                <p className="mt-1 max-w-2xl text-xs sm:text-sm text-gray-500">
                                  Historial de asistencias registradas
                                </p>
                              </div>
                              <Link
                                to="/alumno/registrar-asistencia"
                                className="mt-3 sm:mt-0 inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Registrar Asistencia
                              </Link>
                            </div>
                            <div className="border-t border-gray-200">
                              {loadingAsistencias ? (
                                <div className="text-center py-6 sm:py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                                  <p className="mt-2 text-xs sm:text-sm text-gray-600">Cargando asistencias...</p>
                                </div>
                              ) : asistencias.length > 0 ? (
                                <div className="overflow-x-auto -mx-3 sm:mx-0">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th
                                          scope="col"
                                          className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          Curso
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          Sección
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          Sesión
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          Fecha
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          Hora
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          Estado
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {asistencias.map((asistencia) => (
                                        <tr key={asistencia.int_idAsistencia}>
                                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                            {selectedCurso.str_idCurso}
                                          </td>
                                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                            {selectedCurso.str_numero}
                                          </td>
                                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                            {asistencia.int_idSesionClase.str_tema}
                                          </td>
                                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                            {formatDate(asistencia.dt_fecha)}
                                          </td>
                                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                            {formatTime(asistencia.dt_hora_registro)}
                                          </td>
                                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <span
                                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                asistencia.str_estado == "P"
                                                  ? 'bg-green-100 text-green-800'
                                                  : 'bg-red-100 text-red-800'
                                              }`}
                                            >
                                              {asistencia.str_estado == "P" ? 'Presente' : 'Ausente'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-xs sm:text-sm text-gray-500">No hay asistencias registradas para este curso</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
