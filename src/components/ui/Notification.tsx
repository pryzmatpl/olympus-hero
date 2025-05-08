import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCheck, AlertCircle } from 'lucide-react';

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000, // 5 seconds default
}) => {
  // Auto-close notification after duration if autoClose is true
  useEffect(() => {
    if (isVisible && autoClose) {
      const timeout = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timeout);
    }
  }, [isVisible, autoClose, duration, onClose]);
  
  // Set appropriate colors and icons based on notification type
  const getTypeStyles = (): { bgColor: string; borderColor: string; icon: JSX.Element } => {
    switch (type) {
      case 'error':
        return {
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-800',
          icon: <AlertTriangle className="w-6 h-6 text-red-400" />
        };
      case 'warning':
        return {
          bgColor: 'bg-amber-900/20',
          borderColor: 'border-amber-800',
          icon: <AlertCircle className="w-6 h-6 text-amber-400" />
        };
      case 'success':
        return {
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-800',
          icon: <CheckCheck className="w-6 h-6 text-green-400" />
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-800',
          icon: <AlertCircle className="w-6 h-6 text-blue-400" />
        };
    }
  };
  
  const { bgColor, borderColor, icon } = getTypeStyles();
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${bgColor} border ${borderColor} max-w-md`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{title}</h3>
              <p className="text-sm text-gray-300 mt-1">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-1 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification; 