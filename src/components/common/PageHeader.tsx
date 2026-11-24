import React from 'react';
import { BreadcrumbItem } from '../../types/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-5 mb-5 border-b border-slate-200/80">
      {/* Breadcrumb row */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-[#71758E]">
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-[#8B5CF6] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {item.href && !item.isCurrent ? (
                <Link
                  to={item.href}
                  className="hover:text-[#8B5CF6] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#181829] font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#181829] flex items-center gap-2.5">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#71758E] mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
