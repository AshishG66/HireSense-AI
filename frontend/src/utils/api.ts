import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const baseURL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization Bearer tokens
api.interceptors.request.use(
  (config) => {
    // Retrieves token from state or browser storage
    const state = useAuthStore.getState() as any;
    const token = state.token || localStorage.getItem('token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for unified client-side error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred while processing your request';
    const errors = error.response?.data?.errors;

    return Promise.reject({
      message,
      status: error.response?.status,
      errors,
    });
  },
);

export default api;
