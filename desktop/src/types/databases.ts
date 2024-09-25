import { User } from '@/types/users';

export type DatabaseNode = {
  id: string;
  name: string;
  fields: FieldNode[];
};

export type ViewNode = TableViewNode | BoardViewNode | CalendarViewNode;

export type TableViewNode = {
  id: string;
  name: string;
  type: 'table_view';
  hiddenFields: string[];
  fieldIndexes: Record<string, string>;
  fieldWidths: Record<string, number>;
  nameWidth: number;
  versionId: string;
  filters: ViewFilter[];
  sorts: ViewSort[];
};

export type BoardViewNode = {
  id: string;
  name: string;
  type: 'board_view';
  filters: ViewFilter[];
  sorts: ViewSort[];
  groupBy: string | null;
};

export type CalendarViewNode = {
  id: string;
  name: string;
  type: 'calendar_view';
  filters: ViewFilter[];
  sorts: ViewSort[];
  groupBy: string | null;
};

export type FieldDataType =
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

export type FieldNode =
  | BooleanFieldNode
  | CollaboratorFieldNode
  | CreatedAtFieldNode
  | CreatedByFieldNode
  | DateFieldNode
  | EmailFieldNode
  | FileFieldNode
  | MultiSelectFieldNode
  | NumberFieldNode
  | PhoneFieldNode
  | SelectFieldNode
  | TextFieldNode
  | UrlFieldNode;

export type BooleanFieldNode = {
  id: string;
  dataType: 'boolean';
  name: string;
  index: string;
};

export type CollaboratorFieldNode = {
  id: string;
  dataType: 'collaborator';
  name: string;
  index: string;
};

export type CreatedAtFieldNode = {
  id: string;
  dataType: 'created_at';
  name: string;
  index: string;
};

export type CreatedByFieldNode = {
  id: string;
  dataType: 'created_by';
  name: string;
  index: string;
};

export type DateFieldNode = {
  id: string;
  dataType: 'date';
  name: string;
  index: string;
};

export type EmailFieldNode = {
  id: string;
  dataType: 'email';
  name: string;
  index: string;
};

export type FileFieldNode = {
  id: string;
  dataType: 'file';
  name: string;
  index: string;
};

export type MultiSelectFieldNode = {
  id: string;
  dataType: 'multi_select';
  name: string;
  index: string;
  options: SelectOptionNode[];
};

export type NumberFieldNode = {
  id: string;
  dataType: 'number';
  name: string;
  index: string;
};

export type PhoneFieldNode = {
  id: string;
  dataType: 'phone';
  name: string;
  index: string;
};

export type SelectFieldNode = {
  id: string;
  dataType: 'select';
  name: string;
  index: string;
  options: SelectOptionNode[];
};

export type TextFieldNode = {
  id: string;
  dataType: 'text';
  name: string;
  index: string;
};
export type UrlFieldNode = {
  id: string;
  dataType: 'url';
  name: string;
  index: string;
};

export type SelectOptionNode = {
  id: string;
  name: string;
  color: string;
};

export type RecordNode = {
  id: string;
  name: string | null;
  parentId: string;
  index: string;
  createdAt: Date;
  createdBy: User;
  versionId: string;

  attributes: any;
};

export type ViewFieldFilter = {
  id: string;
  type: 'field';
  fieldId: string;
  operator: string;
  value: string | number | boolean | string[] | number[] | null;
};

export type ViewGroupFilter = {
  id: string;
  type: 'group';
  operator: 'and' | 'or';
  filters: ViewFieldFilter[];
};

export type ViewFilter = ViewFieldFilter | ViewGroupFilter;

export type ViewSort = {
  id: string;
  fieldId: string;
  direction: 'asc' | 'desc';
};
