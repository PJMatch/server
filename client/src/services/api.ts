import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow sending HttpOnly cookies for session management
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // TODO: Add any specific logic before request is sent
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Return a successful response directly
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

export default api;