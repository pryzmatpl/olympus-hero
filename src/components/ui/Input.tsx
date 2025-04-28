import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helpText, 
    fullWidth = false, 
    leftIcon,
    rightIcon,
    className = '',
    ...props 
  }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label 
            htmlFor={props.id} 
            className="block mb-2 text-sm font-medium text-white"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              w-full bg-mystic-800 border ${error ? 'border-red-500' : 'border-mystic-600'} 
              rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-cosmic-500 focus:border-transparent
              placeholder:text-gray-400 transition-all
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 inset-y-0 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-400">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;