import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export interface EmptyStateProps {
  icon: LucideIcon;
  phaseBadge?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  hint?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  phaseBadge,
  title,
  description,
  action,
  secondaryAction,
  hint,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-3xl border border-dashed border-purple-200/90 bg-white/90 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] backdrop-blur-sm overflow-hidden',
        className
      )}
    >
      {/* Ambient soft purple glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Phase Badge */}
      {phaseBadge && (
        <Badge variant="purple" className="mb-5 shadow-xs">
          <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
          {phaseBadge}
        </Badge>
      )}

      {/* Icon with soft purple layered design */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-purple-50/90 border border-purple-100 flex items-center justify-center shadow-xs group">
          <Icon className="w-8 h-8 text-[#8B5CF6] transition-transform duration-300 group-hover:scale-110" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-purple-300/20 -z-10 blur-xs" />
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-bold text-[#181829] mb-2">{title}</h3>
      <p className="text-sm text-[#71758E] max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}

      {/* Bottom Hint */}
      {hint && (
        <div className="mt-8 pt-4 border-t border-slate-100 w-full max-w-sm">
          <span className="text-xs text-[#71758E] bg-slate-50/90 border border-slate-200/60 rounded-full px-3.5 py-1.5 inline-block">
            💡 {hint}
          </span>
        </div>
      )}
    </div>
  );
};
