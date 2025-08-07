'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  userId: string
  name?: string
  email?: string
  image?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ 
  userId, 
  name, 
  email, 
  image, 
  size = 'md', 
  className = '' 
}: UserAvatarProps) {
  // Generate initials like UserMenu.tsx
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase()
    : email?.substring(0, 2).toUpperCase() || userId?.substring(0, 2).toUpperCase() || 'U'

  // Size classes
  const sizeClasses = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-xs', 
    lg: 'h-8 w-8 text-sm'
  }

  // Display name for tooltip
  const displayName = name || email || `Usuario ${userId?.slice(-4) || ''}`

  return (
    <Avatar 
      className={`${sizeClasses[size]} ${className}`}
      title={displayName}
    >
      <AvatarImage src={image || undefined} alt={displayName} />
      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}