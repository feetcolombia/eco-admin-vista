import axios from 'axios';
import { setLogoutCallback } from './api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to get the auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to create authenticated headers
export const getAuthHeaders = () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Callback para logout quando token expirar - inicializado pelo AuthContext
let logoutCallback: (() => void) | null = null;

export const setFetchLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
  // Também define no api.ts para manter compatibilidade
  setLogoutCallback(callback);
};

// Função fetch wrapper que trata automaticamente erros 401
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  // Adiciona o token de autorização aos headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se receber 401, tenta fazer logout apropriado
  if (response.status === 401) {
    console.log('Erro 401 detectado em fetch manual para:', url);
    
    // Limpar dados de autenticação
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_credentials');
    
    // Usar callback se disponível
    if (logoutCallback) {
      logoutCallback();
    } else {
      window.location.href = '/login';
    }
    
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }

  return response;
};
