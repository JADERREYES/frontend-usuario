import axios from 'axios';
import { apiConfig, clearAuthSession, getAuthToken } from '../config/api';

const api = axios.create({
  baseURL: apiConfig.baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  },
);

export default api;
