'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const routeMap: Record<string, BreadcrumbItem[]> = {
  '/': [
    { label: 'Home', href: '/', icon: Home },
  ],
  '/reports': [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Reports', href: '/reports' },
  ],
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = routeMap[pathname] || [
    { label: 'Home', href: '/', icon: Home },
  ];

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1" />
            )}
            {isLast ? (
              <span className="flex items-center gap-1 font-medium text-foreground">
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}