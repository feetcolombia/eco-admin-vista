
import axios from 'axios';

export const API_BASE_URL = 'https://stg.feetcolombia.com';

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
