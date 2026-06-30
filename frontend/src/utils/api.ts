import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const baseURL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// We rely on HttpOnly cookies rather than Bearer tokens,
// so no request interceptor is needed to append Authorization headers.
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 Unauthorized, and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept refresh/login/logout endpoints to avoid infinite loops
      if (
        originalRequest.url.includes('/auth/refresh') ||
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/logout')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, wait for the refresh to finish
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Ping the refresh endpoint to obtain new cookies
        await api.post('/auth/refresh');
        
        processQueue(null);
        isRefreshing = false;

        // Replay the original request with the new HttpOnly cookies automatically attached
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear user state on fatal refresh failure (e.g. refresh token expired or tampered)
        const logout = useAuthStore.getState().logout;
        if (logout) {
          logout();
        }
        
        return Promise.reject(refreshError);
      }
    }

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
