"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle admin routes
    if (segments[0] === '(admin)') {
      segments.shift(); // Remove (admin) from path
    }
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Buscar', href: '/buscar' }
    ];
    
    if (segments.length === 0) {
      return breadcrumbs;
    }
    
    // Map route segments to breadcrumb items
    const routeMap: Record<string, BreadcrumbItem> = {
      'reports': { label: 'Reports', href: '/reports' },
      'profile': { label: 'Profile', href: '/profile' },
      'settings': { label: 'Settings' },
      'analytics': { label: 'Analytics', href: '/analytics' }
    };
    
    segments.forEach((segment, index) => {
      const mappedRoute = routeMap[segment];
      
      if (mappedRoute) {
        // Don't add href for the last segment (current page)
        const isLastSegment = index === segments.length - 1;
        breadcrumbs.push({
          label: mappedRoute.label,
          href: isLastSegment ? undefined : mappedRoute.href
        });
      }
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}