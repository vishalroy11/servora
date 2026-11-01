import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error || {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
    return Promise.reject(errorData);
  },
);
