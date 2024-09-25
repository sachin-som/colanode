import {
  FieldDataType,
  FieldNode,
  RecordNode,
  ViewFieldFilter,
  ViewFilter,
} from '@/types/databases';
import { isStringArray } from '@/lib/utils';

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
  lightClass: string;
}

export const selectOptionColors: SelectOptionColor[] = [
  {
    label: 'Gray',
    value: 'gray',
    class: 'bg-gray-200',
    lightClass: 'bg-gray-50',
  },
  {
    label: 'Orange',
    value: 'orange',
    class: 'bg-orange-200',
    lightClass: 'bg-orange-50',
  },
  {
    label: 'Yellow',
    value: 'yellow',
    class: 'bg-yellow-200',
    lightClass: 'bg-yellow-50',
  },
  {
    label: 'Green',
    value: 'green',
    class: 'bg-green-200',
    lightClass: 'bg-green-50',
  },
  {
    label: 'Blue',
    value: 'blue',
    class: 'bg-blue-200',
    lightClass: 'bg-blue-50',
  },
  {
    label: 'Purple',
    value: 'purple',
    class: 'bg-purple-200',
    lightClass: 'bg-purple-50',
  },
  {
    label: 'Pink',
    value: 'pink',
    class: 'bg-pink-200',
    lightClass: 'bg-pink-50',
  },
  {
    label: 'Red',
    value: 'red',
    class: 'bg-red-200',
    lightClass: 'bg-red-50',
  },
];

export const getSelectOptionColorClass = (color: string): string => {
  return selectOptionColors.find((c) => c.value === color)?.class || '';
};

export const getSelectOptionLightColorClass = (color: string): string => {
  return selectOptionColors.find((c) => c.value === color)?.lightClass || '';
};

export const getRandomSelectOptionColor = (): string => {
  return selectOptionColors[
    Math.floor(Math.random() * selectOptionColors.length)
  ].value;
};

export interface FieldFilterOperator {
  label: string;
  value: string;
}

export const booleanFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is True',
    value: 'is_true',
  },
  {
    label: 'Is False',
    value: 'is_false',
  },
];

export const collaboratorFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Me',
    value: 'is_me',
  },
  {
    label: 'Is Not Me',
    value: 'is_not_me',
  },
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const createdAtFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Is on or after',
    value: 'is_on_or_after',
  },
  {
    label: 'Is on or before',
    value: 'is_on_or_before',
  },
  {
    label: 'Is After',
    value: 'is_after',
  },
  {
    label: 'Is Before',
    value: 'is_before',
  },
];

export const createdByFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Me',
    value: 'is_me',
  },
  {
    label: 'Is Not Me',
    value: 'is_not_me',
  },
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
];

export const dateFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Is on or after',
    value: 'is_on_or_after',
  },
  {
    label: 'Is on or before',
    value: 'is_on_or_before',
  },
  {
    label: 'Is After',
    value: 'is_after',
  },
  {
    label: 'Is Before',
    value: 'is_before',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const emailFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const fileFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const multiSelectFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const numberFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Is Greater Than',
    value: 'is_greater_than',
  },
  {
    label: 'Is Less Than',
    value: 'is_less_than',
  },
  {
    label: 'Is Greater Than Or Equal To',
    value: 'is_greater_than_or_equal_to',
  },
  {
    label: 'Is Less Than Or Equal To',
    value: 'is_less_than_or_equal_to',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const phoneFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
];

export const selectFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const textFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },

  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const urlFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const getFieldFilterOperators = (
  dataType: FieldDataType,
): FieldFilterOperator[] => {
  if (!dataType) return [];

  switch (dataType) {
    case 'boolean':
      return booleanFieldFilterOperators;
    case 'collaborator':
      return collaboratorFieldFilterOperators;
    case 'created_at':
      return createdAtFieldFilterOperators;
    case 'created_by':
      return createdByFieldFilterOperators;
    case 'date':
      return dateFieldFilterOperators;
    case 'email':
      return emailFieldFilterOperators;
    case 'file':
      return fileFieldFilterOperators;
    case 'multi_select':
      return multiSelectFieldFilterOperators;
    case 'number':
      return numberFieldFilterOperators;
    case 'phone':
      return phoneFieldFilterOperators;
    case 'select':
      return selectFieldFilterOperators;
    case 'text':
      return textFieldFilterOperators;
    case 'url':
      return urlFieldFilterOperators;
    default:
      return [];
  }
};

export const filterRecords = (
  records: RecordNode[],
  filter: ViewFilter,
  field: FieldNode,
  currentUserId: string,
): RecordNode[] => {
  return records.filter((record) =>
    recordMatchesFilter(record, filter, field, currentUserId),
  );
};

const recordMatchesFilter = (
  record: RecordNode,
  filter: ViewFilter,
  field: FieldNode,
  currentUserId: string,
) => {
  if (filter.type === 'group') {
    return false;
  }

  switch (field.dataType) {
    case 'boolean':
      return recordMatchesBooleanFilter(record, filter, field);
    case 'collaborator':
      return recordMatchesCollaboratorFilter(record, filter, field);
    case 'created_at':
      return recordMatchesCreatedAtFilter(record, filter);
    case 'created_by':
      return recordMatchesCreatedByFilter(record, filter, currentUserId);
    case 'date':
      return recordMatchesDateFilter(record, filter, field);
    case 'email':
      return recordMatchesEmailFilter(record, filter, field);
    case 'file':
      return recordMatchesFileFilter(record, filter, field);
    case 'multi_select':
      return recordMatchesMultiSelectFilter(record, filter, field);
    case 'number':
      return recordMatchesNumberFilter(record, filter, field);
    case 'phone':
      return recordMatchesPhoneFilter(record, filter, field);
    case 'select':
      return recordMatchesSelectFilter(record, filter, field);
    case 'text':
      return recordMatchesTextFilter(record, filter, field);
    case 'url':
      return recordMatchesUrlFilter(record, filter, field);
    default:
      return false;
  }
};

const recordMatchesBooleanFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];

  if (filter.operator === 'is_true') {
    return fieldValue === true;
  }
  if (filter.operator === 'is_false') {
    return !fieldValue || fieldValue === false;
  }

  return false;
};

const recordMatchesCollaboratorFilter = (
  record: RecordNode,
  filter: ViewFilter,
  field: FieldNode,
) => {
  return false;
};

const recordMatchesCreatedAtFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
) => {
  if (!filter.value) return false;

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterDate = new Date(filter.value);
  filterDate.setHours(0, 0, 0, 0); // Set time to midnight

  const recordDate = new Date(record.createdAt);
  recordDate.setHours(0, 0, 0, 0); // Set time to midnight

  switch (filter.operator) {
    case 'is_equal_to':
      return recordDate.getTime() === filterDate.getTime();
    case 'is_not_equal_to':
      return recordDate.getTime() !== filterDate.getTime();
    case 'is_on_or_after':
      return recordDate.getTime() >= filterDate.getTime();
    case 'is_on_or_before':
      return recordDate.getTime() <= filterDate.getTime();
    case 'is_after':
      return recordDate.getTime() > filterDate.getTime();
    case 'is_before':
      return recordDate.getTime() < filterDate.getTime();
  }

  return false;
};

const recordMatchesCreatedByFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  currentUserId: string,
) => {
  const createdBy = record.createdBy?.id;
  if (!createdBy) {
    return false;
  }

  if (filter.operator === 'is_me') {
    return createdBy === currentUserId;
  }

  if (filter.operator === 'is_not_me') {
    return createdBy !== currentUserId;
  }

  if (!isStringArray(filter.value)) {
    return true;
  }

  if (filter.operator === 'is_in') {
    return filter.value.includes(createdBy);
  }

  if (filter.operator === 'is_not_in') {
    return !filter.value.includes(createdBy);
  }

  return false;
};

const recordMatchesDateFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];
  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  const recordDate = new Date(fieldValue);
  recordDate.setHours(0, 0, 0, 0); // Set time to midnight

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterDate = new Date(filter.value);
  filterDate.setHours(0, 0, 0, 0); // Set time to midnight

  switch (filter.operator) {
    case 'is_equal_to':
      return recordDate.getTime() === filterDate.getTime();
    case 'is_not_equal_to':
      return recordDate.getTime() !== filterDate.getTime();
    case 'is_on_or_after':
      return recordDate.getTime() >= filterDate.getTime();
    case 'is_on_or_before':
      return recordDate.getTime() <= filterDate.getTime();
    case 'is_after':
      return recordDate.getTime() > filterDate.getTime();
    case 'is_before':
      return recordDate.getTime() < filterDate.getTime();
  }

  return false;
};

const recordMatchesEmailFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue === filterValue;
    case 'is_not_equal_to':
      return fieldValue !== filterValue;
    case 'contains':
      return fieldValue.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.includes(filterValue);
  }

  return false;
};

const recordMatchesFileFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  return false;
};

const recordMatchesMultiSelectFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValues = record.attributes[field.id] as string[];

  if (filter.operator === 'is_empty') {
    return fieldValues?.length === 0;
  }

  if (filter.operator === 'is_not_empty') {
    return fieldValues?.length > 0;
  }

  if (!fieldValues) {
    return false;
  }

  if (!isStringArray(filter.value)) {
    return true;
  }

  switch (filter.operator) {
    case 'is_in':
      return filter.value.some((value) => fieldValues.includes(value));
    case 'is_not_in':
      return !filter.value.some((value) => fieldValues.includes(value));
  }

  return false;
};

const recordMatchesNumberFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (typeof filter.value !== 'number') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue === filterValue;
    case 'is_not_equal_to':
      return fieldValue !== filterValue;
    case 'is_greater_than':
      return fieldValue > filterValue;
    case 'is_less_than':
      return fieldValue < filterValue;
    case 'is_greater_than_or_equal_to':
      return fieldValue >= filterValue;
    case 'is_less_than_or_equal_to':
      return fieldValue <= filterValue;
  }

  return false;
};

const recordMatchesPhoneFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue === filterValue;
    case 'is_not_equal_to':
      return fieldValue !== filterValue;
    case 'contains':
      return fieldValue.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.includes(filterValue);
  }

  return false;
};

const recordMatchesSelectFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (!isStringArray(filter.value)) {
    return true;
  }

  switch (filter.operator) {
    case 'is_in':
      return filter.value.includes(fieldValue);
    case 'is_not_in':
      return !filter.value.includes(fieldValue);
  }

  return false;
};

const recordMatchesTextFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue === filterValue;
    case 'is_not_equal_to':
      return fieldValue !== filterValue;
    case 'contains':
      return fieldValue.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.includes(filterValue);
  }

  return false;
};

const recordMatchesUrlFilter = (
  record: RecordNode,
  filter: ViewFieldFilter,
  field: FieldNode,
) => {
  const fieldValue = record.attributes[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue === filterValue;
    case 'is_not_equal_to':
      return fieldValue !== filterValue;
    case 'contains':
      return fieldValue.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.includes(filterValue);
  }

  return false;
};

export const isSortableField = (field: FieldNode) => {
  return (
    field.dataType === 'text' ||
    field.dataType === 'number' ||
    field.dataType === 'date' ||
    field.dataType === 'created_at' ||
    field.dataType === 'email' ||
    field.dataType === 'phone' ||
    field.dataType === 'select' ||
    field.dataType === 'url'
  );
};
