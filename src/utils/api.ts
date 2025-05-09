import axios from 'axios';

// Simple browser-compatible event emitter implementation
class SimpleEventEmitter {
  private events: Record<string, Array<(data?: any) => void>> = {};

  on(event: string, listener: (data?: any) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: (data?: any) => void): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, data?: any): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

// Create an event emitter for API events
export const apiEvents = new SimpleEventEmitter();

// API Error events
export const API_ERROR_EVENTS = {
  OPENAI_QUOTA_EXCEEDED: 'OPENAI_QUOTA_EXCEEDED'
};

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

// Socket.io URL helper - explicitly use HTTPS in production
export const getSocketUrl = (): string => {
  if (isProduction) {
    // In production, use the same host with HTTPS protocol
    const host = window.location.host;
    return `https://${host}`;
  } else {
    // In development, use the same base URL as the API
    return baseApiUrl;
  }
};

// Create a custom axios instance
const api = axios.create({
  baseURL: baseApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a reasonable timeout to prevent hanging requests
  timeout: 300000, // 30 seconds
});

// Check if an API error is an OpenAI quota exceeded error
const isOpenAIQuotaError = (error: any): boolean => {
  if (!error.response || !error.response.data) return false;
  
  const data = error.response.data;
  
  // Check for the errorType field we added in the server
  if (data.errorType === 'quota_exceeded') return true;
  
  // Check the status code
  if (error.response.status === 429) {
    // Check if the error message contains keywords related to quota
    if (data.error && (
      data.error.includes('quota') || 
      data.error.includes('exceeded') ||
      data.error.includes('limit')
    )) {
      return true;
    }
  }
  
  return false;
};

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
    
    // Handle OpenAI quota exceeded errors
    if (isOpenAIQuotaError(error)) {
      console.error('OpenAI quota exceeded');
      
      // Emit a quota exceeded event
      apiEvents.emit(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, {
        message: error.response?.data?.message || 'OpenAI API quota exceeded. Please try again later or contact support.',
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Add a custom field to the error for easy identification
      error.isOpenAIQuotaExceeded = true;
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

// Add a function to check OpenAI quota status
export const checkOpenAIQuotaStatus = async (): Promise<{
  isQuotaExceeded: boolean;
  message: string;
}> => {
  try {
    const response = await api.get('/api/status/openai-quota');
    
    // If we get a 200 response, quota is available
    return {
      isQuotaExceeded: false,
      message: response.data.message
    };
  } catch (error) {
    // If we get a 429 response, quota is exceeded
    if (error.response && error.response.status === 429) {
      return {
        isQuotaExceeded: true,
        message: error.response.data?.message || 'OpenAI API quota exceeded. Please try again later.'
      };
    }
    
    // For other errors, assume quota might be exceeded to be safe
    console.error('Error checking OpenAI quota status:', error);
    return {
      isQuotaExceeded: true, 
      message: 'Unable to verify AI service availability. Please try again later.'
    };
  }
};

export default api; 