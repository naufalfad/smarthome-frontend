import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'purple' | 'success' | 'warning' | 'danger' | 'outline' | 'slate' | 'dark';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  pulse = false,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/80',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    purple: 'bg-purple-50 text-[#7C3AED] border-purple-200/80',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-600 border-rose-200',
    outline: 'bg-white text-slate-700 border-slate-200 shadow-xs',
    dark: 'bg-[#181824] text-white border-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              variant === 'success' && 'bg-emerald-400',
              variant === 'purple' && 'bg-purple-400',
              variant === 'warning' && 'bg-amber-400',
              variant === 'danger' && 'bg-rose-400'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              variant === 'success' && 'bg-emerald-500',
              variant === 'purple' && 'bg-[#8B5CF6]',
              variant === 'warning' && 'bg-amber-500',
              variant === 'danger' && 'bg-rose-500'
            )}
          />
        </span>
      )}
      {children}
    </div>
  );
};
