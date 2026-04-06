import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', disabled, ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover disabled:hover:bg-accent',
    secondary: 'border-2 border-border bg-transparent hover:border-accent hover:text-accent',
    danger: 'bg-error text-white hover:bg-red-600'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
