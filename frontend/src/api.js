/**
 * api.js — Axios instance with JWT auth header injection
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bpe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear storage and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bpe_token');
      localStorage.removeItem('bpe_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

