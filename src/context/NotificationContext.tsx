import React, { createContext, useState, useContext, useCallback } from 'react';
import Notification, { NotificationType } from '../components/ui/Notification';

interface NotificationContextProps {
  showNotification: (type: NotificationType, title: string, message: string, autoClose?: boolean, duration?: number) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  showNotification: () => {},
  hideNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<{
    type: NotificationType;
    title: string;
    message: string;
    isVisible: boolean;
    autoClose: boolean;
    duration: number;
  }>({
    type: 'info',
    title: '',
    message: '',
    isVisible: false,
    autoClose: true,
    duration: 5000,
  });

  const showNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      autoClose = true,
      duration = 5000
    ) => {
      setNotification({
        type,
        title,
        message,
        isVisible: true,
        autoClose,
        duration,
      });
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        autoClose={notification.autoClose}
        duration={notification.duration}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 