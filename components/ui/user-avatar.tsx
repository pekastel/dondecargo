'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  userId: string;
  userName: string;
  userImage?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeVariants = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

export function UserAvatar({ 
  userId, 
  userName, 
  userImage,
  className, 
  size = 'md' 
}: UserAvatarProps) {
  // Generate initials from user name
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color based on user ID
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-cyan-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Avatar
      className={cn(
        sizeVariants[size],
        className
      )}
      title={userName}
    >
      <AvatarImage src={userImage || undefined} alt={userName} />
      <AvatarFallback
        className={cn(
          'text-white font-medium',
          getAvatarColor(userId)
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}