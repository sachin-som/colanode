import { hashCode } from '@/lib/utils';
import { getEmojiUrl } from '@/lib/emojis';
import { getIconUrl } from '@/lib/icons';
import { getIdType, IdType } from '@/lib/id';

export const getAvatarSizeClasses = (size?: string) => {
  if (size === 'small') {
    return 'w-5 h-5';
  }
  if (size === 'medium') {
    return 'w-9 h-9';
  }
  if (size === 'large') {
    return 'w-12 h-12';
  }
  if (size === 'extra-large') {
    return 'w-16 h-16';
  }

  return 'w-9 h-9';
};

const colors = [
  'rgb(248 113 113)',
  'rgb(74 222 128)',
  'rgb(96 165 250)',
  'rgb(251 146 60)',
  'rgb(244 114 182)',
  'rgb(250 204 21)',
  'rgb(129 140 248)',
  'rgb(192 132 252)',
  'rgb(45 212 191)',
  'rgb(156 163 175)',
];

export const getColorForId = (id: string) => {
  const index = Math.abs(hashCode(id)) % colors.length;
  return colors[index];
};

export const getAvatarUrl = (accountId: string, avatar: string): string => {
  return `avatar://${accountId}/${avatar}`;
};

export const getDefaultNodeIcon = (type: IdType): string => {
  if (type === IdType.Channel) {
    return 'discuss-line';
  }

  if (type === IdType.Page) {
    return 'book-line';
  }

  if (type === IdType.Database) {
    return 'database-2-line';
  }

  if (type === IdType.Record) {
    return 'article-line';
  }

  if (type === IdType.Folder) {
    return 'folder-open-line';
  }

  if (type === IdType.Space) {
    return 'team-line';
  }

  return 'file-unknown-line';
};
