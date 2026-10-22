import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...rest }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-blue-900"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-900/50 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full border-2 rounded-xl p-4 font-medium
              bg-white text-blue-900 placeholder:text-blue-900/40
              transition-all duration-150
              focus:outline-none focus:ring-4 focus:ring-blue-900/20
              ${icon ? 'pl-12' : ''}
              ${error
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-blue-900 focus:border-blue-700'
              }
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            {...rest}
          />
        </div>
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="text-sm font-semibold text-red-500 flex items-center gap-1.5"
            role="alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

