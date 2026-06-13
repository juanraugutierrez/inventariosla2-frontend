// src/api/apiClient.js
import axios from 'axios';

// Crea una instancia de Axios con la URL base de tu backend
const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api', // Asegúrate de que esta URL sea correcta
  headers: {
    'Content-Type': 'application/json',
  },
});

// Este interceptor se ejecuta antes de cada petición
apiClient.interceptors.request.use(
  (config) => {
    // Obtiene el token del almacenamiento local
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    // Si existe un token, lo adjunta al encabezado de autorización
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
