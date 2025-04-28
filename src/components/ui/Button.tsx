import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mystic-500';
  
  const variants = {
    primary: 'bg-gradient-to-r from-mystic-700 to-mystic-600 hover:from-mystic-600 hover:to-mystic-500 text-white shadow-mystic',
    secondary: 'bg-gradient-to-r from-cosmic-500 to-cosmic-400 hover:from-cosmic-400 hover:to-cosmic-300 text-mystic-900 shadow-cosmic',
    outline: 'border-2 border-mystic-600 text-white hover:bg-mystic-800',
    ghost: 'text-white hover:bg-mystic-800'
  };
  
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-6 py-3'
  };
  
  const disabledStyles = isLoading || disabled 
    ? 'opacity-70 cursor-not-allowed pointer-events-none' 
    : '';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${widthClass} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </motion.button>
  );
};

export default Button;