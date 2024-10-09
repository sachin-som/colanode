import { hashCode } from '@/lib/utils';
import { IdType } from '@/lib/id';

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

export const getDefaultNodeAvatar = (type: IdType): string => {
  if (type === IdType.Channel) {
    return '01h37jbxq11hpcnw1mdfgmm70cem';
  }

  if (type === IdType.Page) {
    return '01h37jbxqc5srhy96v34dxaa2aem';
  }

  if (type === IdType.Database) {
    return '01h37jbxqc5srhy96v34dxaa25em';
  }

  if (type === IdType.Record) {
    return '01h37jbxqc5srhy96v34dxaa2dem';
  }

  if (type === IdType.Folder) {
    return '01h37jbxqc5srhy96v34dxaa36em';
  }

  if (type === IdType.Space) {
    return '01h37jbxq7628n8m2bwdandtbxem';
  }

  return null;
};
