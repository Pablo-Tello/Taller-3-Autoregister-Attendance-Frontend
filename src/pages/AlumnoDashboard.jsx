import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAlumnoInfo, getAlumnoSecciones, getAsistencias } from '../services/api';
import { Link } from 'react-router-dom';

export const AlumnoDashboard = () => {
  const { user, logout } = useAuth();
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [secciones, setSecciones] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            console.log('Información del alumno establecida:', alumnoData);

            // Obtener secciones del alumno
            console.log('Obteniendo secciones para el alumno ID:', user.alumnoId);
            const seccionesData = await getAlumnoSecciones(user.alumnoId);
            console.log('Datos de secciones recibidos:', seccionesData);

            // Asegurarse de que seccionesData sea un array
            if (Array.isArray(seccionesData)) {
              setSecciones(seccionesData.filter((seccion) => seccion.str_idAlumno === user.alumnoId));
              console.log('Secciones establecidas:', seccionesData.filter((seccion) => seccion.str_idAlumno === user.alumnoId).length, 'secciones');
            } else {
              console.error('La respuesta de secciones no es un array:', seccionesData);
              setSecciones([]);
            }

            // Obtener asistencias del alumno
            console.log('Obteniendo asistencias para el alumno ID:', user.alumnoId);
            const asistenciasData = await getAsistencias();
            console.log('Datos de asistencias recibidos:', asistenciasData);

            // Asegurarse de que asistenciasData sea un array
            if (Array.isArray(asistenciasData)) {
              const secciones_alumno = seccionesData.filter((seccion) => seccion.str_idAlumno === user.alumnoId)
              const idAlumnoSeccion = secciones_alumno[0].int_idAlumnoSeccion
              console.log("-- Asistencia Data")
              console.log(secciones_alumno[0])
              console.log(idAlumnoSeccion)
              console.log(asistenciasData)
              console.log(asistenciasData.filter((asistencia) => asistencia.int_idAlumnoSeccion === idAlumnoSeccion))
              setAsistencias(asistenciasData.filter((asistencia) => asistencia.int_idAlumnoSeccion === idAlumnoSeccion));
              console.log('Asistencias establecidas:', asistenciasData.filter((asistencia) => asistencia.int_idAlumnoSeccion === idAlumnoSeccion).length, 'asistencias');
            } else {
              console.error('La respuesta de asistencias no es un array:', asistenciasData);
              setAsistencias([]);
            }
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Sistema de Asistencia</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Dashboard del Alumno
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando información...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
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
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {alumnoInfo && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Información del Alumno
                        </h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Nombre completo
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {alumnoInfo.str_nombres} {alumnoInfo.str_apellidos}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Código de alumno
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {alumnoInfo.str_idAlumno}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Correo electrónico
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {alumnoInfo.str_email}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Fecha de nacimiento
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {new Date(alumnoInfo.dt_fecha_nacimiento).toLocaleDateString()}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Secciones inscritas
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {secciones.length > 0 ? (
                                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                  {secciones.map((seccion) => (
                                    <li
                                      key={seccion.int_idAlumnoSeccion}
                                      className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                                    >
                                      <div className="w-0 flex-1 flex items-center">
                                        <span className="ml-2 flex-1 w-0 truncate">
                                          Sección {seccion.int_idSeccion}
                                        </span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500">No hay secciones inscritas</p>
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Asistencias
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Historial de asistencias registradas
                        </p>
                      </div>
                      <Link
                        to="/alumno/registrar-asistencia"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Registrar Asistencia
                      </Link>
                    </div>
                    <div className="border-t border-gray-200">
                      {asistencias.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Curso
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Fecha
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Hora
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Estado
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {asistencias.map((asistencia) => (
                                <tr key={asistencia.int_idAsistencia}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {/* Aquí deberíamos obtener el nombre del curso a partir de la sección */}
                                    Sección {asistencia.int_idAlumnoSeccion}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(asistencia.dt_fecha_registro).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(asistencia.dt_fecha_registro).toLocaleTimeString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        asistencia.bool_asistio
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {asistencia.bool_asistio ? 'Presente' : 'Ausente'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No hay asistencias registradas</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
