import React, { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { apiEvents, API_ERROR_EVENTS } from '../utils/api';
import { io } from 'socket.io-client';

/**
 * Component to handle API errors and display notifications
 * This component doesn't render anything, it just sets up event listeners
 */
const ApiErrorHandler: React.FC = () => {
  const { showNotification } = useNotification();

  useEffect(() => {
    // Handler for OpenAI quota exceeded errors
    const handleOpenAIQuotaExceeded = (errorData: any) => {
      showNotification(
        'error',
        'OpenAI API Quota Exceeded',
        errorData.message || 'The AI service is currently unavailable due to quota limits. Please try again later.',
        true,
        10000 // Show for 10 seconds
      );
    };

    // Add event listener for API quota errors
    apiEvents.on(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handleOpenAIQuotaExceeded);

    // Clean up event listener
    return () => {
      apiEvents.off(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handleOpenAIQuotaExceeded);
    };
  }, [showNotification]);

  // Listen for socket.io errors related to OpenAI quota
  useEffect(() => {
    // Get the server URL from the environment or use a default
    const serverUrl = import.meta.env.VITE_APP_SERVER_URL || 'http://localhost:9002';
    
    // Initialize socket with the server URL
    const socketIo = io(serverUrl, {
      withCredentials: true, // Enable if your server requires credentials
      autoConnect: true,
      reconnection: true,
    });

    // Listen for API errors from socket.io
    socketIo.on('api_error', (error) => {
      if (error.errorType === 'quota_exceeded') {
        showNotification(
          'error',
          'OpenAI API Quota Exceeded',
          error.message || 'The AI service is currently unavailable due to quota limits. Please try again later.',
          true,
          10000
        );
      }
    });

    // Clean up socket connection
    return () => {
      socketIo.disconnect();
    };
  }, [showNotification]);

  // This component doesn't render anything
  return null;
};

export default ApiErrorHandler; 