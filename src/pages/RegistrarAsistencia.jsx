import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsQR from 'jsqr';
import { registrarAsistenciaJWT, getAlumnoInfo } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const RegistrarAsistencia = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(onScanSuccess, onScanError);

    function onScanSuccess(decodedText) {
      scanner.clear();
      setScanResult(decodedText);
      handleRegistrarAsistencia(decodedText);
    }

    function onScanError(err) {
      console.warn(err);
    }

    return () => {
      scanner.clear();
    };
  }, []);

  const [alumnoInfo, setAlumnoInfo] = useState(null);

  // Obtener información del alumno al cargar el componente
  useEffect(() => {
    const fetchAlumnoInfo = async () => {
      try {
        if (user?.alumnoId) {
          const alumnoData = await getAlumnoInfo(user.alumnoId);
          setAlumnoInfo(alumnoData);
        }
      } catch (error) {
        setError('Error al obtener información del alumno');
        console.error(error);
      }
    };

    fetchAlumnoInfo();
  }, [user]);

  const handleRegistrarAsistencia = async (token) => {
    if (!alumnoInfo) {
      setError('No se pudo obtener la información del alumno');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verificar el token JWT del QR y registrar asistencia
      await registrarAsistenciaJWT(token, alumnoInfo.str_idAlumno);
      setSuccess(true);

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        navigate('/alumno/dashboard');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Error al registrar asistencia. El código QR puede haber expirado.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Registrar Asistencia
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Escanear Código QR
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Escanea el código QR JWT generado por el docente para registrar tu asistencia.
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5">
                  {loading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Registrando asistencia...</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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
                  )}

                  {success ? (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-green-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Asistencia registrada correctamente. Redirigiendo al dashboard...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Escanear con cámara</h4>
                        <div id="reader" className="w-full"></div>
                      </div>

                      <div className="mt-8">
                        <h4 className="text-md font-medium text-gray-900 mb-2">O sube una imagen del código QR</h4>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            {imagePreview ? (
                              <div className="relative">
                                <img
                                  src={imagePreview}
                                  alt="Vista previa"
                                  className="mx-auto h-48 object-contain rounded-md"
                                />
                                {processingImage && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                    <p className="text-white ml-3">Procesando imagen...</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                              >
                                <path
                                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>{imagePreview ? 'Cambiar imagen' : 'Sube una imagen'}</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setError('');
                                      setProcessingImage(true);

                                      // Mostrar vista previa de la imagen
                                      const previewReader = new FileReader();
                                      previewReader.onload = (e) => {
                                        setImagePreview(e.target.result);
                                      };
                                      previewReader.readAsDataURL(file);

                                      // Procesar la imagen para detectar el código QR
                                      const reader = new FileReader();
                                      reader.onload = async (event) => {
                                        try {
                                          const imageData = event.target.result;
                                          const img = new Image();
                                          img.onload = () => {
                                            // Crear un canvas para procesar la imagen
                                            const canvas = document.createElement('canvas');
                                            const context = canvas.getContext('2d');
                                            canvas.width = img.width;
                                            canvas.height = img.height;
                                            context.drawImage(img, 0, 0, img.width, img.height);

                                            // Obtener los datos de la imagen
                                            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                                            // Escanear el código QR
                                            const code = jsQR(imageData.data, imageData.width, imageData.height);

                                            if (code) {
                                              console.log('Código QR detectado:', code.data);
                                              setScanResult(code.data);
                                              setProcessingImage(false);
                                              setLoading(true);
                                              handleRegistrarAsistencia(code.data);
                                            } else {
                                              setError('No se pudo detectar un código QR en la imagen');
                                              setProcessingImage(false);
                                            }
                                          };
                                          img.src = imageData;
                                        } catch (error) {
                                          console.error('Error al procesar la imagen:', error);
                                          setError('Error al procesar la imagen: ' + error.message);
                                          setProcessingImage(false);
                                        }
                                      };
                                      reader.onerror = (error) => {
                                        console.error('Error al leer el archivo:', error);
                                        setError('Error al leer el archivo: ' + error.message);
                                        setProcessingImage(false);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              <p className="pl-1">o arrastra y suelta</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-between">
                    {imagePreview && !loading && !success && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setError('');
                          setProcessingImage(false);
                          setScanResult(null);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Reiniciar escaneo
                      </button>
                    )}
                    <div className={imagePreview && !loading && !success ? '' : 'ml-auto'}>
                      <button
                        type="button"
                        onClick={() => navigate('/alumno/dashboard')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Volver al Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
