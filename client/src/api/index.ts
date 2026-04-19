import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const adminApi = axios.create({
  baseURL: '/api/admin',
  headers: { 'Content-Type': 'application/json' },
});

export const lojistaApi = axios.create({
  baseURL: '/api/lojista',
  headers: { 'Content-Type': 'application/json' },
});

export const publicApi = axios.create({
  baseURL: '/api/public',
  headers: { 'Content-Type': 'application/json' },
});

function attachToken(config: any) {
  const token = localStorage.getItem('vc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}

function handle401(err: any) {
  if (err.response?.status === 401) {
    localStorage.removeItem('vc_token');
    window.location.href = '/admin/login';
  }
  return Promise.reject(err);
}

adminApi.interceptors.request.use(attachToken);
adminApi.interceptors.response.use((r) => r, handle401);

lojistaApi.interceptors.request.use(attachToken);
lojistaApi.interceptors.response.use((r) => r, handle401);
