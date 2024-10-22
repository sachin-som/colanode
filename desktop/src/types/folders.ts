export type FolderLayoutType = 'grid' | 'list' | 'gallery';

export type FolderLayout = {
  value: FolderLayoutType;
  name: string;
  description: string;
  icon: string;
};

export const folderLayouts: FolderLayout[] = [
  {
    name: 'Grid',
    value: 'grid',
    description: 'Show files in grid layout',
    icon: 'layout-grid-line',
  },
  {
    name: 'List',
    value: 'list',
    description: 'Show files in list layout',
    icon: 'list-indefinite',
  },
  {
    name: 'Gallery',
    value: 'gallery',
    description: 'Show files in gallery layout',
    icon: 'layout-bottom-line',
  },
];
