'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/authClient';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  requireAuth?: boolean;
}

export function FooterLink({ href, children, className, requireAuth = false }: FooterLinkProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleClick = (e: React.MouseEvent) => {
    if (requireAuth && !session?.user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}