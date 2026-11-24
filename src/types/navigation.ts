import { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

