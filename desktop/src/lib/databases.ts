import { FieldDataType } from '@/types/databases';

export const getFieldIcon = (type?: FieldDataType): string => {
  if (!type) return '';

  switch (type) {
    case 'boolean':
      return 'checkbox-line';
    case 'collaborator':
      return 'user-line';
    case 'created_at':
      return 'calendar-event-line';
    case 'created_by':
      return 'user-received-line';
    case 'date':
      return 'calendar-event-line';
    case 'email':
      return 'mail-line';
    case 'file':
      return 'file-line';
    case 'multi_select':
      return 'list-check';
    case 'number':
      return 'hashtag';
    case 'phone':
      return 'smartphone-line';
    case 'select':
      return 'radio-button-line';
    case 'text':
      return 'text';
    case 'url':
      return 'link';
    default:
      return 'close-line';
  }
};

export const getDefaultFieldWidth = (type: FieldDataType): number => {
  if (!type) return 0;

  switch (type.toLowerCase()) {
    case 'name':
      return 200;
    case 'autonumber':
      return 150;
    case 'boolean':
      return 100;
    case 'button':
      return 100;
    case 'collaborator':
      return 200;
    case 'created_at':
      return 200;
    case 'created_by':
      return 200;
    case 'date':
      return 200;
    case 'email':
      return 200;
    case 'file':
      return 200;
    case 'formula':
      return 200;
    case 'multi_select':
      return 200;
    case 'number':
      return 150;
    case 'phone':
      return 200;
    case 'relation':
      return 200;
    case 'rollup':
      return 200;
    case 'select':
      return 200;
    case 'text':
      return 200;
    case 'updated_at':
      return 200;
    case 'updated_by':
      return 200;
    case 'url':
      return 200;
    default:
      return 200;
  }
};

export const getDefaultNameWidth = (): number => {
  return 300;
};

interface SelectOptionColor {
  label: string;
  value: string;
  class: string;
}

export const selectOptionColors: SelectOptionColor[] = [
  {
    label: 'Gray',
    value: 'gray',
    class: 'bg-gray-200',
  },
  {
    label: 'Orange',
    value: 'orange',
    class: 'bg-orange-200',
  },
  {
    label: 'Yellow',
    value: 'yellow',
    class: 'bg-yellow-200',
  },
  {
    label: 'Green',
    value: 'green',
    class: 'bg-green-200',
  },
  {
    label: 'Blue',
    value: 'blue',
    class: 'bg-blue-200',
  },
  {
    label: 'Purple',
    value: 'purple',
    class: 'bg-purple-200',
  },
  {
    label: 'Pink',
    value: 'pink',
    class: 'bg-pink-200',
  },
  {
    label: 'Red',
    value: 'red',
    class: 'bg-red-200',
  },
];

export const getSelectOptionColorClass = (color: string): string => {
  return selectOptionColors.find((c) => c.value === color)?.class || '';
};

export const getRandomSelectOptionColor = (): string => {
  return selectOptionColors[
    Math.floor(Math.random() * selectOptionColors.length)
  ].value;
};
