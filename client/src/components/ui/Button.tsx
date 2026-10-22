import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-900 text-white border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:bg-blue-800 hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  secondary:
    'bg-[#fca55d] text-blue-900 border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:bg-[#fbbd85] hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  outline:
    'bg-white text-blue-900 border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:bg-blue-50 hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  ghost:
    'bg-transparent text-blue-900 border-2 border-transparent hover:bg-blue-50 hover:border-blue-900',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        font-bold transition-all duration-150 cursor-pointer
        focus:outline-none focus:ring-4 focus:ring-blue-900/20
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

