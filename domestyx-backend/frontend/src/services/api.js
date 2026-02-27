import axios from 'axios';
import { normalizeRole, roleLoginPath } from '@/lib/roles';

// ✅ Base URL from your .env (points to port 8002)
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle 401 errors (expired tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      let loginPath = '/worker/login';
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        loginPath = roleLoginPath(normalizeRole(storedUser?.role));
      } catch (_) {
        loginPath = '/worker/login';
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  }
);

export default api;
