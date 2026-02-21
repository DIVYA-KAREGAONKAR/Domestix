import axios from 'axios';

// ✅ Base URL — change this if your backend is on another host
const API_URL = 'http://localhost:8000/api';

// ✅ Create Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Intercept request to add JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // your JWT token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Intercept response errors if you want (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid — optional: auto-logout or refresh logic
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login'; // redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;
