import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: number | string;
  statusText: string;
  icon: LucideIcon;
  badge?: string;
  hint?: string;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  statusText,
  icon: Icon,
  badge,
  hint,
  highlight,
}) => {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 border-slate-100/90 bg-white shadow-[0_8px_25px_-4px_rgba(112,118,150,0.06)] hover:shadow-[0_12px_32px_-4px_rgba(139,92,246,0.12)] hover:-translate-y-0.5',
        highlight && 'border-purple-200/90 ring-1 ring-purple-100'
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71758E]">
              {title}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-[#181829] tracking-tight font-mono">
                {value}
              </span>
              {badge && (
                <Badge variant="purple" className="text-[10px] py-0 px-2 font-mono">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#71758E] mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
              {statusText}
            </p>
          </div>

          <div
            className={cn(
              'p-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 shadow-xs',
              highlight && 'text-[#8B5CF6] border-purple-100 bg-purple-50/80'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {hint && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#71758E]">
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
