import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost' | 'purple' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  pill?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', pill = false, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const roundedStyles = pill ? 'rounded-full' : 'rounded-xl';

    const variants = {
      primary:
        'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-sm shadow-purple-500/25 active:scale-[0.98]',
      dark:
        'bg-[#181824] hover:bg-[#28283C] text-white shadow-sm shadow-slate-900/10 active:scale-[0.98]',
      purple:
        'bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200/80 active:scale-[0.98]',
      secondary:
        'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-sm active:scale-[0.98]',
      outline:
        'border border-slate-300/80 bg-transparent hover:bg-white/80 text-slate-700 active:scale-[0.98]',
      ghost:
        'bg-transparent hover:bg-slate-200/60 text-slate-600 hover:text-slate-900',
      danger:
        'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'p-2 aspect-square',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, roundedStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
