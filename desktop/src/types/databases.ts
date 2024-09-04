import { User } from '@/types/users';

export type FieldType =
  | 'boolean'
  | 'collaborator'
  | 'created_at'
  | 'created_by'
  | 'date'
  | 'email'
  | 'file'
  | 'multi_select'
  | 'number'
  | 'phone'
  | 'select'
  | 'text'
  | 'url';

export type Field =
  | BooleanField
  | CollaboratorField
  | CreatedAtField
  | CreatedByField
  | DateField
  | EmailField
  | FileField
  | MultiSelectField
  | NumberField
  | PhoneField
  | SelectField
  | TextField
  | UrlField;

export type BooleanField = {
  id: string;
  type: 'boolean';
  name: string;
  index: string;
};

export type CollaboratorField = {
  id: string;
  type: 'collaborator';
  name: string;
  index: string;
};

export type CreatedAtField = {
  id: string;
  type: 'created_at';
  name: string;
  index: string;
};

export type CreatedByField = {
  id: string;
  type: 'created_by';
  name: string;
  index: string;
};

export type DateField = {
  id: string;
  type: 'date';
  name: string;
  index: string;
};

export type EmailField = {
  id: string;
  type: 'email';
  name: string;
  index: string;
};

export type FileField = {
  id: string;
  type: 'file';
  name: string;
  index: string;
};

export type MultiSelectField = {
  id: string;
  type: 'multi_select';
  name: string;
  index: string;
  options: SelectOption[];
};

export type NumberField = {
  id: string;
  type: 'number';
  name: string;
  index: string;
};

export type PhoneField = {
  id: string;
  type: 'phone';
  name: string;
  index: string;
};

export type SelectField = {
  id: string;
  type: 'select';
  name: string;
  index: string;
  options: SelectOption[];
};

export type TextField = {
  id: string;
  type: 'text';
  name: string;
  index: string;
};
export type UrlField = {
  id: string;
  type: 'url';
  name: string;
  index: string;
};

export type SelectOption = {
  id: string;
  name: string;
  color: string;
};

export type RecordNode = {
  id: string;
  parentId: string;
  index: string;
  attrs: Record<string, any>;
  createdAt: Date;
  createdBy: User;
  versionId: string;
};
