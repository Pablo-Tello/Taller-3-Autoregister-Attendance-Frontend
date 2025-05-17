import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones y el encabezado ngrok-skip-browser-warning
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Agregar encabezado ngrok-skip-browser-warning para evitar la advertencia de ngrok
    // config.headers['ngrok-skip-browser-warning'] = 'p';

    console.log('Request URL:', config.baseURL + config.url);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de token expirado
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (Unauthorized) y no es un intento de refresh token
    if (error.response && error.response.status === 401 && !originalRequest._retry &&
        !originalRequest.url.includes('refresh-token') && !originalRequest.url.includes('login')) {

      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // Si no hay refresh token, redirigir al login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}api/usuarios/refresh-token/`, {
          refresh_token: refreshToken
        });

        // Guardar el nuevo token de acceso
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        // Actualizar el token en la solicitud original y reintentarla
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Error al refrescar el token:', refreshError);
        // Si falla el refresh, limpiar tokens y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    console.log(`Intentando login con email: ${email}`);

    const response = await api.post('api/usuarios/login/', {
      str_email: email,
      password: password
    });

    console.log('Respuesta del login:', response.data);

    // Verificar que la respuesta contenga los campos necesarios
    if (!response.data.access_token || !response.data.refresh_token) {
      console.error('La respuesta no contiene los tokens necesarios:', response.data);
      throw new Error('Respuesta de login inválida: no se recibieron los tokens');
    }

    // Guardar tokens en localStorage
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);

    // Transform the response to match our app's expected format
    const userData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      user_id: response.data.user_id,
      email: response.data.email,
      role: response.data.is_docente ? 'docente' : response.data.is_alumno ? 'alumno' : 'unknown',
      docente_id: response.data.docente_id || null,
      alumno_id: response.data.alumno_id || null,
      is_docente: response.data.is_docente || false,
      is_alumno: response.data.is_alumno || false
    };

    console.log('Datos de usuario procesados:', userData);
    return userData;
  } catch (error) {
    console.error('Error en login:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Llamar al endpoint de logout
    const response = await api.post('api/usuarios/logout/');

    // Eliminar tokens del localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    return response.data;
  } catch (error) {
    console.error('Error en logout:', error);

    // Aún si hay error, eliminar tokens del localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    throw error;
  }
};

// Función para refrescar el token de acceso
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No hay token de refresco disponible');
    }

    const response = await api.post('api/usuarios/refresh-token/', {
      refresh_token: refreshToken
    });

    if (response.data && response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      return response.data.access_token;
    } else {
      throw new Error('Respuesta inválida al refrescar token');
    }
  } catch (error) {
    console.error('Error al refrescar token:', error);
    throw error;
  }
};

export const getDocenteInfo = async (docenteId) => {
  try {
    console.log(`getDocenteInfo: Consultando información del docente con ID: ${docenteId}`);
    if (!docenteId) {
      console.error('getDocenteInfo: docenteId es undefined o null');
      return [];
    }
    const response = await api.get(`api/usuarios/docentes/${docenteId}/`);
    console.log('Respuesta de getDocenteInfo:', response.data);
    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data) {
      console.log(`getDocenteInfo: Se encontró información del docente`);
      return response.data;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getDocenteInfo: Se encontró información del docente (formato array)`);
      return response.data;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getDocenteInfo: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getDocenteInfo:', error);
    return [];
  }
};

export const getAlumnoInfo = async (alumnoId) => {
  try {
    if (!alumnoId) {
      console.error('getAlumnoInfo: alumnoId es undefined o null');
      return [];
    }

    const response = await api.get(`api/usuarios/alumnos/${alumnoId}/`);

    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data) {
      console.log(`getAlumnoInfo: Se encontró información del alumno`);
      return response.data;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getAlumnoInfo: Se encontró información del alumno (formato array)`);
      return response.data;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getAlumnoInfo: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getAlumnoInfo:', error);
    return [];
  }
};

export const getDocenteSecciones = async (docenteId) => {
  try {
    if (!docenteId) {
      console.error('getDocenteSecciones: docenteId es undefined o null');
      return [];
    }

    const response = await api.get(`api/inscripciones/docentes-secciones/`);
    console.log('Respuesta de getDocenteSecciones:', response.data);
    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data.results && Array.isArray(response.data.results)) {
      console.log(`getDocenteSecciones: Se encontraron ${response.data.results.length} secciones`);
      return response.data.results;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data.results)) {
      console.log(`getDocenteSecciones: Se encontraron ${response.data-results.length} secciones (formato array)`);
      return response.data.results;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getDocenteSecciones: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getDocenteSecciones:', error);
    return [];
  }
};

export const getAlumnoSecciones = async (alumnoId) => {
  try {
    if (!alumnoId) {
      console.error('getAlumnoSecciones: alumnoId es undefined o null');
      return [];
    }

    const response = await api.get(`api/inscripciones/alumnos-secciones/`);

    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`getAlumnoSecciones: Se encontraron ${response.data.results.length} secciones`);
      return response.data.results;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getAlumnoSecciones: Se encontraron ${response.data.length} secciones (formato array)`);
      return response.data;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getAlumnoSecciones: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getAlumnoSecciones:', error);
    return [];
  }
};

export const getSesionesClase = async (horarioId) => {
  try {
    const response = await api.get(`api/academico/sesiones/`);

    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`getSesionesClase: Se encontraron ${response.data.results.length} sesiones`);
      return response.data.results;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getSesionesClase: Se encontraron ${response.data.length} sesiones (formato array)`);
      return response.data;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getSesionesClase: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getSesionesClase:', error);
    return [];
  }
};

export const getSesionesClaseByID = async (id) => {
  try {
    if (!id) {
      console.error('getSesionesClaseByID: id es undefined o null');
      return null;
    }

    console.log(`getSesionesClaseByID: Consultando sesión con ID: ${id}`);
    const response = await api.get(`api/academico/sesiones/${id}/`);

    // Verificar si la respuesta contiene un objeto de sesión
    if (response.data && response.data.int_idSesionClase) {
      console.log(`getSesionesClaseByID: Se encontró la sesión con ID: ${id}`);
      return response.data;
    }
    // Verificar si la respuesta tiene la estructura de paginación
    else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`getSesionesClaseByID: Se encontraron ${response.data.results.length} sesiones`);
      return response.data.results[0] || null;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getSesionesClaseByID: Se encontraron ${response.data.length} sesiones (formato array)`);
      return response.data[0] || null;
    }
    // Si no es ninguno de los anteriores, devolver null
    else {
      console.error('getSesionesClaseByID: Formato de respuesta no reconocido:', response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error en getSesionesClaseByID para ID ${id}:`, error);
    return null;
  }
};

export const generarCodigoQR = async (sesionClaseId, docenteId) => {
  try {
    if (!sesionClaseId || !docenteId) {
      console.error(`generarCodigoQR: Parámetros inválidos - sesionClaseId: ${sesionClaseId}, docenteId: ${docenteId}`);
      throw new Error('Parámetros inválidos para generar código QR');
    }

    console.log(`Generando QR para sesionClaseId: ${sesionClaseId}, docenteId: ${docenteId}`);

    const response = await api.post('api/asistencia/codigos-qr/generar/', {
      int_idSesionClase: sesionClaseId,
      str_idDocente: docenteId,
      formato: 'base64'
    });

    // Verificar si la respuesta tiene la estructura esperada
    if (response.data && response.data.qr_code) {
      return response.data;
    } else {
      console.error('generarCodigoQR: Respuesta inválida', response.data);
      throw new Error('Respuesta inválida al generar código QR');
    }
  } catch (error) {
    console.error('Error en generarCodigoQR:', error);
    throw error;
  }
};

export const registrarAsistencia = async (codigo, alumnoId) => {
  try {
    if (!codigo || !alumnoId) {
      console.error(`verificarCodigoQR: Parámetros inválidos - codigo: ${codigo}, alumnoId: ${alumnoId}`);
      throw new Error('Parámetros inválidos para verificar código QR');
    }

    console.log(`verificarCodigoQR: Verificando código QR ${codigo} para alumno ${alumnoId}`);

    const response = await api.post('api/asistencia/codigos-qr/verificar/', {
      str_codigo: codigo,
      str_idAlumno: alumnoId
    });

    // Verificar si la respuesta tiene la estructura esperada
    if (response.data && response.data.int_idAsistencia) {
      console.log(`verificarCodigoQR: Asistencia registrada con ID: ${response.data.int_idAsistencia}`);
      return response.data;
    } else {
      console.error('verificarCodigoQR: Respuesta inválida', response.data);
      throw new Error('Respuesta inválida al verificar código QR');
    }
  } catch (error) {
    console.error('Error en verificarCodigoQR:', error);
    throw error;
  }
};

export const getAsistencias = async () => {
  try {
    const url = `api/asistencia/asistencias/`;
    console.log(`getAsistencias: Consultando URL: ${url}`);

    const response = await api.get(url);
    console.log('Respuesta de getAsistencias:', response.data);

    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`getAsistencias: Se encontraron ${response.data.results.length} asistencias`);
      return response.data.results;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getAsistencias: Se encontraron ${response.data.length} asistencias (formato array)`);
      return response.data;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getAsistencias: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getAsistencias:', error);
    return [];
  }
};

export const getCodigosQR = async (params = {}) => {
  try {
    const { sesionClaseId, docenteId, activo } = params;
    let url = 'api/asistencia/codigos-qr/';

    const queryParams = [];
    if (sesionClaseId) queryParams.push(`sesion_clase_id=${sesionClaseId}`);
    if (docenteId) queryParams.push(`docente_id=${docenteId}`);
    if (activo !== undefined) queryParams.push(`activo=${activo}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    console.log(`getCodigosQR: Consultando URL: ${url}`);
    const response = await api.get(url);

    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`getCodigosQR: Se encontraron ${response.data.results.length} códigos QR`);
      return response.data.results;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getCodigosQR: Se encontraron ${response.data.length} códigos QR (formato array)`);
      return response.data;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getCodigosQR: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getCodigosQR:', error);
    return [];
  }
};

export const getSecciones = async () => {
  try {
    const url = 'api/academico/secciones/';
    console.log(`getSecciones: Consultando URL: ${url}`);

    const response = await api.get(url);

    // Verificar si la respuesta tiene la estructura de paginación
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`getSecciones: Se encontraron ${response.data.results.length} secciones`);
      return response.data.results;
    }
    // Si no tiene estructura de paginación, verificar si es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`getSecciones: Se encontraron ${response.data.length} secciones (formato array)`);
      return response.data;
    }
    // Si no es ninguno de los anteriores, devolver array vacío
    else {
      console.error('getSecciones: Formato de respuesta no reconocido:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error en getSecciones:', error);
    return [];
  }
};

export default api;
