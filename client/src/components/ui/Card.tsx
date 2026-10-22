import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'flat';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  noPadding?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'border-4 border-blue-900 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]',
  elevated:
    'border-4 border-blue-900 shadow-[12px_12px_0px_0px_rgba(30,58,138,1)]',
  flat:
    'border-4 border-blue-900 shadow-[8px_8px_0px_0px_rgba(30,58,138,0.1)]',
};

export default function Card({
  children,
  variant = 'default',
  noPadding = false,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl
        ${noPadding ? '' : 'p-8'}
        ${variantClasses[variant]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}

