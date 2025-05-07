import axios from 'axios';

// In production, use relative URLs to avoid mixed content issues
// In development, use the configured server URL or fallback to localhost
const isProduction = import.meta.env.PROD;
let baseApiUrl;

if (isProduction) {
  // In production, we use relative URLs that work with our nginx configuration
  // We don't add '/api' here because most endpoint calls already include it
  baseApiUrl = '';
} else {
  // In development, use the configured server URL or fallback
  baseApiUrl = import.meta.env.VITE_APP_SERVER_URL ?? 'http://localhost:9002';
}

// Create a custom axios instance
const api = axios.create({
  baseURL: baseApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a reasonable timeout to prevent hanging requests
  timeout: 300000, // 30 seconds
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle unauthorized responses
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Handle request timeout
    if (error.code === 'ECONNABORTED') {
      console.error('API request timed out');
      error.message = 'Request timed out. Please try again.';
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error occurred');
      error.message = 'Network error. Please check your connection and try again.';
    }
    
    // Handle unauthorized responses
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized request - redirecting to login');
      // Unauthorized - clear localStorage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log all API errors
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

export default api; 