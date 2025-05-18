import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  getDocenteInfo,
  getDocenteCursos,
  getSesionesBySeccion,
  generarCodigoQRJWT,
  getAlumnosBySeccion,
  getAsistenciasBySesion
} from '../services/api';
import { createQrWebSocket } from '../services/websocket';
import { UserIcon, BookOpenIcon, QrCodeIcon, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export const DocenteDashboard = () => {
  const { user, logout } = useAuth();
  const [docenteInfo, setDocenteInfo] = useState(null);
  const [secciones, setSecciones] = useState([]);
  const [sesionesClase, setSesionesClase] = useState([]);
  const [selectedSeccion, setSelectedSeccion] = useState(null);
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [codigoQR, setCodigoQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false); // Loading state specifically for the attendance table
  const [qrLoading, setQRLoading] = useState(false); // Loading state specifically for QR code generation
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState('datos'); // 'datos' o 'cursos'
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [alumnosSeccion, setAlumnosSeccion] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const qrRefreshInterval = useRef(null);
  const websocketRef = useRef(null);

  // Variable (no State) para saber si el modal esta abierto o cerrado
  let isModalOpen = false;

  // Effect for component initialization and cleanup
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

    // Global cleanup function for component unmount
    return () => {
      // Clean up any WebSocket connections
      if (websocketRef.current) {
        websocketRef.current.cleanup();
        websocketRef.current = null;
      }

      // Clean up any intervals
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
        qrRefreshInterval.current = null;
      }
    };
  }, [user]);

  // Cargar sesiones de clase cuando se selecciona una sección
  useEffect(() => {
    const fetchSesiones = async () => {
      if (selectedSeccion) {
        try {
          setLoading(true);
          // Obtener sesiones de la sección seleccionada
          const seccionId = selectedSeccion.int_idSeccion;
          const sesionesData = await getSesionesBySeccion(seccionId);
          setSesionesClase(sesionesData);

          // Cargar alumnos de la sección
          const alumnosData = await getAlumnosBySeccion(seccionId);
          setAlumnosSeccion(alumnosData);
          console.log('Alumnos de la sección:', alumnosData);

          // Limpiar la sesión seleccionada y las asistencias
          setSelectedSesion(null);
          setAsistencias([]);
          setCodigoQR(null);
        } catch (error) {
          setError('Error al obtener datos de la sección');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSesiones();
  }, [selectedSeccion]);

  const fetchAsistencias = async () => {
    if (selectedSesion) {
      try {
        setTableLoading(true);
        const asistenciasData = await getAsistenciasBySesion(selectedSesion.int_idSesionClase);
        setAsistencias(asistenciasData);
        setCodigoQR(null);
        console.log(`Asistencias actualizadas: ${asistenciasData.length} de ${alumnosSeccion.length} alumnos presentes`);
      } catch (error) {
        setError('Error al obtener asistencias');
        console.error(error);
      } finally {
        setTableLoading(false);
      }
    }
  };
  const fetchAsistenciasWS = async () => {
    if (selectedSesion) {
      try {
        const asistenciasData = await getAsistenciasBySesion(selectedSesion.int_idSesionClase);
        setAsistencias(asistenciasData)
        console.log(`Asistencias actualizadas: ${asistenciasData.length} de ${alumnosSeccion.length} alumnos presentes`);
      } catch (error) {
        setError('Error al obtener asistencias');
        console.error(error);
      }
    }
  };

  // Cargar asistencias cuando se selecciona una sesión
  useEffect(() => {
    fetchAsistencias();
    // Setup WebSocket connection when a session is selected
    if (selectedSesion) {
      // Clean up any existing WebSocket connection
      if (websocketRef.current) {
        websocketRef.current.cleanup();
        websocketRef.current = null;
      }

      // Create a new WebSocket connection
      websocketRef.current = createQrWebSocket(
        selectedSesion.int_idSesionClase,
        // Handle QR verification events
        (data) => {
          console.log('QR code verified:', data);
          // Refresh attendance data to update both the table and the chart
          if (data.type && data.type === 'qr_verified') {
            fetchAsistenciasWS();
            wsGenerarQR();
            // Mostrar notificación con iziToast cuando un alumno registra asistencia
            iziToast.success({
              title: 'Asistencia Registrada',
              message: `${data.student_name} ha registrado su asistencia`,
              position: 'topRight',
              timeout: 5000,
              closeOnClick: true,
              progressBar: true,
              icon: 'fas fa-check-circle'
            });
          }
          console.log('Show QR Modal:', showQRModal);
          // If QR modal is open, refresh the QR code
          // if (isModalOpen) {
          //   handleGenerarQR();
          // }
        },
        // Handle connection established
        () => {
          console.log('WebSocket connection established for session', selectedSesion.int_idSesionClase);
        },
        // Handle errors
        (error) => {
          console.error('WebSocket error:', error);
        }
      );
    }

    // Cleanup function
    return () => {
      if (websocketRef.current) {
        websocketRef.current.cleanup();
        websocketRef.current = null;
      }
    };
  }, [selectedSesion]);

  const handleSesionChange = (sesion) => {
    setSelectedSesion(sesion);
    setCodigoQR(null);
  };

  const wsGenerarQR = async () => {
    if (!selectedSesion || !user?.docenteId) {
      setError('Debe seleccionar una sesión de clase y tener un ID de docente válido');
      return;
    }
    console.log('Show QR Modal:', showQRModal);
    console.log('isModalOpen:', isModalOpen);
    if (!isModalOpen){
      setQRLoading(true);
    }

    try {
      setError('');
      console.log('Generando código QR con JWT');
      const data = await generarCodigoQRJWT(
        selectedSesion.int_idSesionClase,
        user.docenteId
      );
      setCodigoQR(data.qr_code);
      // Reset countdown when a new QR code is generated
      setCountdown(30);
    } catch (error) {
      setError('Error al generar código QR');
      console.error(error);
    } finally {
      setQRLoading(false);
    }
  };

  const handleGenerarQR = async () => {
    if (!selectedSesion || !user?.docenteId) {
      setError('Debe seleccionar una sesión de clase y tener un ID de docente válido');
      return;
    }

    // Show the modal first with loading state if it's not already shown
    if (!showQRModal) {
      setShowQRModal(true);
      isModalOpen = true;
    }

    setQRLoading(true);

    try {
      setError('');
      console.log('Generando código QR con JWT');
      const data = await generarCodigoQRJWT(
        selectedSesion.int_idSesionClase,
        user.docenteId
      );
      setCodigoQR(data.qr_code);
      // Reset countdown when a new QR code is generated
      setCountdown(30);
    } catch (error) {
      setError('Error al generar código QR');
      console.error(error);
    } finally {
      setQRLoading(false);
    }
  };

  const toggleQRModal = () => {
    if (showQRModal) {
      // Si estamos cerrando el modal, limpiar el intervalo
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
        qrRefreshInterval.current = null;
      }

      // Actualizar las asistencias al cerrar el modal para refrescar la tabla y el gráfico
      if (selectedSesion) {
        fetchAsistenciasWS();
      }
    }
    console.log('Show QR Modal Toggled:', showQRModal);
    console.log('Codigo QR:', codigoQR);
    // setShowQRModal(!showQRModal);
    if (showQRModal) {
      setCodigoQR(null);
      setShowQRModal(false);
      isModalOpen = false;
    }
  };

  // Effect to handle QR code refresh every 30 seconds
  useEffect(() => {
    if (showQRModal && selectedSesion && user?.docenteId) {
      // Reset countdown when modal is opened
      setCountdown(30);

      // Set up countdown timer
      const countdownTimer = setInterval(() => {
        setCountdown(prevCount => {
          if (prevCount <= 1) {
            // When countdown reaches 0, refresh the QR code
            handleGenerarQR();
            return 30; // Reset countdown
          }
          return prevCount - 1;
        });
      }, 1000);

      // Store the interval reference
      qrRefreshInterval.current = countdownTimer;

      // Clean up on unmount or when modal closes
      return () => {
        clearInterval(countdownTimer);
        qrRefreshInterval.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRModal, selectedSesion, user?.docenteId]);

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
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 md:hidden hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-uni-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex-shrink-0 flex items-center">
                <img
                  src="https://www.uni.edu.pe/images/logos/logo_uni_2016.png"
                  alt="UNI Logo"
                  className="h-6 w-auto sm:h-8 mr-2 sm:mr-3"
                />
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 hidden xs:block">Sistema de Asistencia</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-gray-700 text-xs sm:text-sm truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-none">
                {user?.email}
              </span>
              <button
                onClick={logout}
                disabled={loading}
                className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-uni-600 hover:bg-uni-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uni-500 transition-colors duration-200 disabled:bg-uni-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">Cerrando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Cerrar sesión</span>
                    <span className="sm:hidden">Salir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar - hidden on mobile unless toggled */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block md:w-64 bg-white shadow-md z-20 ${mobileMenuOpen ? 'fixed inset-0 pt-16 h-full w-full md:relative md:pt-0' : ''}`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Menú Docente</h2>
            {/* Close button - only visible on mobile when menu is open */}
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-uni-500 p-1 rounded-md"
                aria-label="Cerrar menú"
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
                  className={`flex items-center w-full px-4 py-3 text-left ${activeMenu === 'datos' ? 'bg-uni-100 text-uni-700 border-l-4 border-uni-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  <span>Datos del Docente</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveMenu('cursos');
                    setMobileMenuOpen(false);
                  }}
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
        <div className="flex-1 py-4 md:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900">
                Dashboard del Docente
              </h1>
            </header>

            <main>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-uni-600 mx-auto"></div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600">Cargando información...</p>
                </div>
              ) : (
                <>
                  {/* Datos del Docente */}
                  {activeMenu === 'datos' && docenteInfo && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-3 py-4 sm:px-6 sm:py-5">
                        <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
                          Información del Docente
                        </h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl>
                          <div className="bg-gray-50 px-3 py-3 sm:px-6 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">
                              Nombre completo
                            </dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {docenteInfo.str_nombres} {docenteInfo.str_apellidos}
                            </dd>
                          </div>
                          <div className="bg-white px-3 py-3 sm:px-6 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">
                              Correo electrónico
                            </dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                              {docenteInfo.str_email}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-3 py-3 sm:px-6 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">
                              Especialidad
                            </dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 sm:mt-0 sm:col-span-2">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                              {secciones.map((seccion) => (
                                <div
                                  key={seccion.int_idSeccion}
                                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
                                  onClick={() => handleCursoClick(seccion)}
                                >
                                  <div className="p-3 md:p-4 border-b border-gray-200 bg-uni-50">
                                    <h4 className="font-semibold text-base md:text-lg text-gray-800 truncate">{seccion.str_nombreCurso || "No disponible"}</h4>
                                  </div>
                                  <div className="p-3 md:p-4">
                                    <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
                                      <span className="font-medium">Código:</span> {seccion.str_idCurso || "No disponible"}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
                                      <span className="font-medium">Sección:</span> {seccion.str_numero || "No disponible"}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
                                      <span className="font-medium">Horario:</span> {seccion.str_horario || "No disponible"}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-600">
                                      <span className="font-medium">Aula:</span> {seccion.str_aula || "No disponible"}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-uni-100 text-uni-800">
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
                          <div className="flex flex-col sm:flex-row sm:items-center mb-4 md:mb-6">
                            <button
                              onClick={() => setSelectedCurso(null)}
                              className="mb-2 sm:mb-0 sm:mr-4 text-uni-600 hover:text-uni-800 flex items-center text-sm md:text-base"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                              Volver a mis cursos
                            </button>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                              Sección {selectedCurso.str_numero} - {selectedCurso.str_nombreCurso || "Curso"}
                            </h3>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-3 py-4 sm:px-6 sm:py-5">
                              <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
                                Asistencia de Alumnos
                              </h3>
                              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-gray-500">
                                Selecciona una sesión de clase para ver la asistencia de los alumnos.
                              </p>
                            </div>
                            <div className="border-t border-gray-200 px-3 py-4 sm:px-6 sm:py-5">
                              {error && (
                                <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-red-600">{error}</div>
                              )}

                              <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                                <div className="mb-4 md:w-1/2">
                                  <label htmlFor="sesion" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Sesión de Clase
                                  </label>
                                  <select
                                    id="sesion"
                                    name="sesion"
                                    className="mt-1 block w-full pl-2 sm:pl-3 pr-8 sm:pr-10 py-1 sm:py-2 text-sm border-gray-300 focus:outline-none focus:ring-uni-500 focus:border-uni-500 rounded-md"
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

                                {/* Gráfico circular de asistencia */}
                                {selectedSesion && (
                                  <div className="mb-4 md:w-1/2 flex flex-col items-center">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Porcentaje de Asistencia
                                    </h4>
                                    <div className="h-32 w-32 sm:h-40 sm:w-40">
                                      <Doughnut
                                        data={{
                                          labels: ['Presentes', 'Ausentes'],
                                          datasets: [
                                            {
                                              data: [
                                                asistencias.length,
                                                alumnosSeccion.length - asistencias.length
                                              ],
                                              backgroundColor: [
                                                'rgba(34, 197, 94, 0.7)', // Verde para presentes
                                                'rgba(239, 68, 68, 0.7)'  // Rojo para ausentes
                                              ],
                                              borderColor: [
                                                'rgba(34, 197, 94, 1)',
                                                'rgba(239, 68, 68, 1)'
                                              ],
                                              borderWidth: 1,
                                            },
                                          ],
                                        }}
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: true,
                                          plugins: {
                                            legend: {
                                              position: 'bottom',
                                              labels: {
                                                font: {
                                                  size: 12
                                                }
                                              }
                                            },
                                            tooltip: {
                                              callbacks: {
                                                label: function(context) {
                                                  const label = context.label || '';
                                                  const value = context.raw || 0;
                                                  const total = alumnosSeccion.length;
                                                  const percentage = Math.round((value / total) * 100);
                                                  return `${label}: ${value} (${percentage}%)`;
                                                }
                                              }
                                            }
                                          },
                                        }}
                                      />
                                    </div>
                                    <div className="text-center mt-2">
                                      <p className="text-xs sm:text-sm font-medium">
                                        {asistencias.length} de {alumnosSeccion.length} alumnos presentes
                                        <br />
                                        ({Math.round((asistencias.length / (alumnosSeccion.length || 1)) * 100)}%)
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={handleGenerarQR}
                                disabled={qrLoading || !selectedSesion}
                                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-uni-600 hover:bg-uni-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uni-500 disabled:bg-uni-300 disabled:cursor-not-allowed transition-colors duration-200 mb-4 sm:mb-6"
                              >
                                {qrLoading ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="hidden xs:inline">Generando...</span>
                                    <span className="xs:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <QrCodeIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" />
                                    <span className="hidden xs:inline">Generar Código QR (JWT)</span>
                                    <span className="xs:hidden">Generar QR</span>
                                  </>
                                )}
                              </button>

                              {selectedSesion && (
                                <div className="mt-4">
                                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">
                                    Lista de Alumnos
                                  </h4>

                                  {tableLoading ? (
                                    <div className="text-center py-6 sm:py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-uni-600 mx-auto"></div>
                                      <p className="mt-2 text-xs sm:text-sm text-gray-600">Cargando asistencias...</p>
                                    </div>
                                  ) : alumnosSeccion.length > 0 ? (
                                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Código
                                            </th>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Nombre
                                            </th>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Asistencia
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                          {alumnosSeccion.map((alumnoSeccion) => {
                                            // Buscar si el alumno tiene registro de asistencia para esta sesión
                                            const asistencia = asistencias.find(
                                              a => a.int_idAlumnoSeccion === alumnoSeccion.int_idAlumnoSeccion
                                            );

                                            return (
                                              <tr key={alumnoSeccion.int_idAlumnoSeccion}>
                                                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                                  {typeof alumnoSeccion.str_idAlumno === 'object'
                                                    ? alumnoSeccion.str_idAlumno.str_idAlumno
                                                    : alumnoSeccion.str_idAlumno}
                                                </td>
                                                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                  {typeof alumnoSeccion.str_idAlumno === 'object'
                                                    ? `${alumnoSeccion.str_idAlumno.str_nombres} ${alumnoSeccion.str_idAlumno.str_apellidos}`
                                                    : ''}
                                                </td>
                                                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                                  {asistencia ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                      Presente
                                                    </span>
                                                  ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                      Ausente
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-xs sm:text-sm text-gray-500">
                                      No hay alumnos matriculados en esta sección.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Modal para mostrar el código QR */}
                          {showQRModal && (
                            <div className="fixed inset-0 z-30 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={toggleQRModal}></div>

                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-xs sm:max-w-lg w-full">
                                  <div className="bg-white px-3 sm:px-4 pt-4 sm:pt-5 pb-3 sm:pb-4 sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                      <div className="mt-2 sm:mt-0 sm:ml-4 text-center sm:text-left w-full">
                                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                                          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            Código QR de Asistencia
                                          </h3>
                                          <button
                                            onClick={toggleQRModal}
                                            className="text-gray-400 hover:text-gray-500"
                                          >
                                            <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6" />
                                          </button>
                                        </div>

                                        {qrLoading ? (
                                          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                                            <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-t-2 border-b-2 border-uni-600"></div>
                                            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">Generando código QR...</p>
                                          </div>
                                        ) : codigoQR ? (
                                          <>
                                            <div className="flex justify-center">
                                              <img
                                                src={codigoQR}
                                                alt="Código QR"
                                                className="h-48 w-48 sm:h-64 sm:w-64"
                                              />
                                            </div>
                                            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 text-center">
                                              Este código QR tiene un tiempo limitado de validez.
                                              <br />
                                              <span className="font-medium text-uni-600">
                                                Se actualizará en: {countdown} segundos
                                              </span>
                                              <br />
                                              Los alumnos deben escanearlo para registrar su asistencia.
                                              <br />
                                              <span className="font-medium text-uni-600">
                                                Usando JWT (sin almacenamiento en base de datos)
                                              </span>
                                            </p>
                                          </>
                                        ) : (
                                          <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-red-600">
                                            <p>Error al generar el código QR. Por favor, intente nuevamente.</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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
