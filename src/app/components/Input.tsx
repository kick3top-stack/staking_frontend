import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-sm">{label}</label>}
        <input
          ref={ref}
          className={`px-4 py-3 rounded-lg bg-surface border ${
            error ? 'border-error' : 'border-border'
          } focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
