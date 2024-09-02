import { FieldType } from '@/types/databases';

export const getFieldIcon = (type?: FieldType): string => {
  if (!type) return '';

  switch (type) {
    case 'name':
      return 'text';
    case 'autonumber':
      return 'hashtag';
    case 'boolean':
      return 'checkbox-line';
    case 'button':
      return 'focus-line';
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
    case 'formula':
      return 'functions';
    case 'multi_select':
      return 'list-check';
    case 'number':
      return 'hashtag';
    case 'phone':
      return 'smartphone-line';
    case 'relation':
      return 'mind-map';
    case 'rollup':
      return 'magic-line';
    case 'select':
      return 'radio-button-line';
    case 'text':
      return 'text';
    case 'updated_at':
      return 'calendar-event-line';
    case 'updated_by':
      return 'user-received-line';
    case 'url':
      return 'link';
    default:
      return 'close-line';
  }
};

export const getDefaultFieldWidth = (type: FieldType): number => {
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
