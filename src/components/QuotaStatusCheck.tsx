import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { checkOpenAIQuotaStatus } from '../utils/api';

interface QuotaStatusCheckProps {
  onQuotaExceeded: () => void;
  onQuotaAvailable: () => void;
  children: React.ReactNode;
}

/**
 * Component that checks OpenAI quota status before rendering its children
 * If quota is exceeded, it displays an error and calls onQuotaExceeded
 * If quota is available, it calls onQuotaAvailable and renders children
 */
const QuotaStatusCheck: React.FC<QuotaStatusCheckProps> = ({
  onQuotaExceeded,
  onQuotaAvailable,
  children
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    const checkQuota = async () => {
      setIsLoading(true);
      try {
        const { isQuotaExceeded, message } = await checkOpenAIQuotaStatus();
        setIsQuotaExceeded(isQuotaExceeded);
        setQuotaMessage(message);
        
        if (isQuotaExceeded) {
          onQuotaExceeded();
          showNotification(
            'error',
            'AI Service Temporarily Unavailable',
            message,
            false, // Don't auto close
            0 // Duration doesn't matter since auto close is false
          );
        } else {
          onQuotaAvailable();
        }
      } catch (error) {
        console.error('Failed to check quota status:', error);
        // Assume the worst - quota might be exceeded
        setIsQuotaExceeded(true);
        setQuotaMessage('Unable to verify AI service availability');
        onQuotaExceeded();
      } finally {
        setIsLoading(false);
      }
    };

    checkQuota();
  }, [onQuotaExceeded, onQuotaAvailable, showNotification]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="w-8 h-8 border-4 border-cosmic-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Checking AI service status...</span>
      </div>
    );
  }

  if (isQuotaExceeded) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">AI Service Temporarily Unavailable</h3>
            <p className="text-red-300 mb-4">{quotaMessage}</p>
            <p className="text-white">
              We're unable to process payments or generate content at this time because our AI service quota has been exceeded.
              Please try again later. We apologize for the inconvenience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If quota is available, render children
  return <>{children}</>;
};

export default QuotaStatusCheck; 