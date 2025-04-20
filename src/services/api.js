import axios from 'axios';

const API_URL = 'http://52.90.98.67:8000/';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
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

export const login = async (email, password) => {
  try {
    console.log(`Intentando login con email: ${email}`);

    const response = await api.post('api/usuarios/login/', {
      str_email: email,
      password: password
    });

    console.log('Respuesta del login:', response.data);

    // Verificar que la respuesta contenga los campos necesarios
    if (!response.data.token) {
      console.error('La respuesta no contiene un token:', response.data);
      throw new Error('Respuesta de login inválida: no se recibió token');
    }

    // Transform the response to match our app's expected format
    const userData = {
      token: response.data.token,
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
    const response = await api.post('api/usuarios/logout/');
    return response.data;
  } catch (error) {
    console.error('Error en logout:', error);
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
    if (!horarioId) {
      console.error('getSesionesClase: horarioId es undefined o null');
      return [];
    }

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

export const verificarCodigoQR = async (codigo, alumnoId) => {
  try {
    const response = await api.post('api/asistencia/codigos-qr/verificar/', {
      str_codigo: codigo,
      str_idAlumno: alumnoId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAsistencias = async (sesionClaseId) => {
  try {
    const url = `api/asistencia/asistencias/`;
    console.log(`getAsistencias: Consultando URL: ${url}`);

    const response = await api.get(url);

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

export default api;
