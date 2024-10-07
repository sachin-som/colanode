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
import { getEmojiUrl } from '@/lib/emojis';
import { getIconUrl } from '@/lib/icons';
import { useAccount } from '@/renderer/contexts/account';

interface AvatarProps {
  id: string;
  name: string;
  avatar?: string;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  className?: string;
}

export const Avatar = (props: AvatarProps) => {
  const { avatar } = props;
  if (!avatar) {
    return <AvatarFallback {...props} />;
  }

  const avatarType = getIdType(avatar);
  if (avatarType === IdType.Emoji) {
    return <EmojiAvatar {...props} />;
  } else if (avatarType === IdType.Icon) {
    return <IconAvatar {...props} />;
  } else {
    return <CustomAvatar {...props} />;
  }
};

const AvatarFallback = ({ id, name, size, className }: AvatarProps) => {
  if (name) {
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

  const idType = getIdType(id);
  const icon = getDefaultNodeIcon(idType);
  return (
    <Icon name={icon} className={cn(getAvatarSizeClasses(size), className)} />
  );
};

const EmojiAvatar = ({ avatar, size, className }: AvatarProps) => {
  const url = getEmojiUrl(avatar);
  return (
    <img
      src={url}
      className={cn('rounded shadow', getAvatarSizeClasses(size), className)}
      alt={'Emoji'}
    />
  );
};

const IconAvatar = ({ avatar, size, className }: AvatarProps) => {
  const url = getIconUrl(avatar);
  return (
    <img
      src={url}
      className={cn('rounded shadow', getAvatarSizeClasses(size), className)}
      alt={'Icon'}
    />
  );
};

const CustomAvatar = ({ avatar, size, className }: AvatarProps) => {
  const server = useAccount();
  const url = getAvatarUrl(server.id, avatar);

  return (
    <img
      src={url}
      className={cn('rounded shadow', getAvatarSizeClasses(size), className)}
      alt={'Custom Avatar'}
    />
  );
};
