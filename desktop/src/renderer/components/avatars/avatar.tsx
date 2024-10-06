import React from 'react';
import { cn } from '@/lib/utils';
import {
  getAvatarSizeClasses,
  getAvatarUrl,
  getColorForId,
  getDefaultNodeIcon,
} from '@/lib/avatars';
import { getIdType, IdType } from '@/lib/id';
import { Icon } from '@/renderer/components/ui/icon';

interface AvatarProps {
  id: string;
  name: string;
  avatar?: string;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  className?: string;
}

export const Avatar = ({ id, name, avatar, size, className }: AvatarProps) => {
  if (avatar) {
    const url = getAvatarUrl(avatar);
    return (
      <img
        src={url}
        className={cn('rounded shadow', getAvatarSizeClasses(size), className)}
        alt={name}
      />
    );
  }

  const idType = getIdType(id);
  if (idType === IdType.User && name) {
    const color = getColorForId(id);
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded text-white shadow',
          getAvatarSizeClasses(size),
          className,
        )}
        style={{ backgroundColor: color }}
      >
        <span className="font-medium">{name[0]?.toLocaleUpperCase()}</span>
      </div>
    );
  }

  const icon = getDefaultNodeIcon(idType);
  return (
    <Icon name={icon} className={cn(getAvatarSizeClasses(size), className)} />
  );
};
