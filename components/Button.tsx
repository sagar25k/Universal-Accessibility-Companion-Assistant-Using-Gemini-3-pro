import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  loading = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 border text-base font-bold rounded-lg focus:outline-none transition-colors duration-200 min-h-[48px]";
  
  const variants = {
    primary: "border-transparent text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-400",
    secondary: "border-transparent text-blue-900 bg-blue-100 hover:bg-blue-200 focus:ring-4 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-400",
    outline: "border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-4 focus:ring-slate-200"
  };

  const widthClass = fullWidth ? "w-full" : "";
  const loadingClass = loading ? "cursor-wait opacity-80" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${loadingClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
};