import axios from 'axios';
import { User, Project, ProjectIteration, Asset, AppSpecification } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  verify: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
};

// AI API
export const aiApi = {
  generate: async (prompt: string) => {
    const response = await api.post('/ai/generate', { prompt });
    return response.data;
  },

  iterate: async (originalSpec: AppSpecification, modificationPrompt: string) => {
    const response = await api.post('/ai/iterate', {
      originalSpec,
      modificationPrompt,
    });
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`/projects?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData: {
    name: string;
    description?: string;
    originalPrompt: string;
    appSpecification: AppSpecification;
  }) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  update: async (id: string, updates: { name?: string; description?: string }) => {
    const response = await api.put(`/projects/${id}`, updates);
    return response.data;
  },

  iterate: async (id: string, data: {
    modificationPrompt: string;
    appSpecification: AppSpecification;
  }) => {
    const response = await api.post(`/projects/${id}/iterate`, data);
    return response.data;
  },

  download: async (id: string) => {
    const response = await api.get(`/projects/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  getIterations: async (id: string) => {
    const response = await api.get(`/projects/${id}/iterations`);
    return response.data;
  },
};

// Assets API
export const assetsApi = {
  upload: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('asset', file);

    const response = await api.post(`/assets/upload/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByProject: async (projectId: string) => {
    const response = await api.get(`/assets/project/${projectId}`);
    return response.data;
  },

  delete: async (assetId: string) => {
    const response = await api.delete(`/assets/${assetId}`);
    return response.data;
  },

  getById: async (assetId: string) => {
    const response = await api.get(`/assets/${assetId}`);
    return response.data;
  },
};

export default api;