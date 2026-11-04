interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'success' | 'danger';
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  showPercent?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'h-2 rounded-md',
  md: 'h-4 rounded-lg',
  lg: 'h-6 rounded-xl',
};

const sizeClassesVertical: Record<string, string> = {
  sm: 'w-2.5 rounded-md',
  md: 'w-4.5 rounded-lg',
  lg: 'w-6 rounded-xl',
};

const colorClasses: Record<string, string> = {
  primary: 'bg-blue-900',
  accent: 'bg-[#fca55d]',
  success: 'bg-green-600',
  danger: 'bg-red-600',
};

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  orientation = 'horizontal',
  label,
  showPercent = false,
  className = '',
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col items-center h-full ${className}`}>
        {(label || showPercent) && (
          <div className="flex flex-col items-center mb-1 flex-shrink-0">
            {showPercent && (
              <span className="text-xs font-bold text-blue-900">
                {Math.round(percent)}%
              </span>
            )}
            {label && (
              <span className="text-xs font-bold text-blue-900">{label}</span>
            )}
          </div>
        )}
        <div
          className={`
            h-full bg-blue-100 border-2 border-blue-900 overflow-hidden flex flex-col justify-end
            ${sizeClassesVertical[size]}
          `}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          <div
            className={`
              w-full transition-all duration-300 ease-out
              ${colorClasses[color]}
            `}
            style={{ height: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-bold text-blue-900">{label}</span>
          )}
          {showPercent && (
            <span className="text-sm font-bold text-blue-900">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`
          w-full bg-blue-100 border-2 border-blue-900 overflow-hidden
          ${sizeClasses[size]}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`
            h-full transition-all duration-300 ease-out
            ${sizeClasses[size]}
            ${colorClasses[color]}
          `}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

