import {
  FieldDataType,
  FieldNode,
  RecordNode,
  ViewFilterNode,
} from '@/types/databases';

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
  filter: ViewFilterNode,
  field: FieldNode,
  currentUserId: string,
): RecordNode[] => {
  return records.filter((record) =>
    recordMatchesFilter(record, filter, field, currentUserId),
  );
};

const recordMatchesFilter = (
  record: RecordNode,
  filter: ViewFilterNode,
  field: FieldNode,
  currentUserId: string,
) => {
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
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.numberValue;

  if (filter.operator === 'is_true') {
    return fieldValue === 1;
  }
  if (filter.operator === 'is_false') {
    return !fieldValue || fieldValue === 0;
  }

  return false;
};

const recordMatchesCollaboratorFilter = (
  record: RecordNode,
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  return false;
};

const recordMatchesCreatedAtFilter = (
  record: RecordNode,
  filter: ViewFilterNode,
) => {
  if (filter.values.length === 0) return false;

  const filterValue = filter.values[0].textValue;
  const filterDate = new Date(filterValue);
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
  filter: ViewFilterNode,
  currentUserId: string,
) => {
  const createdBy = record.createdBy?.id;
  if (!createdBy) {
    return false;
  }

  const filterValues = filter.values.map((value) => value.foreignNodeId);
  if (filterValues.length === 0) {
    return true;
  }

  switch (filter.operator) {
    case 'is_me':
      return createdBy === currentUserId;
    case 'is_not_me':
      return createdBy !== currentUserId;
    case 'is_in':
      return filterValues.includes(createdBy);
    case 'is_not_in':
      return !filterValues.includes(createdBy);
    default:
      return false;
  }
};

const recordMatchesDateFilter = (
  record: RecordNode,
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.textValue;

  if (!fieldValue) {
    return false;
  }

  const recordDate = new Date(fieldValue);
  recordDate.setHours(0, 0, 0, 0); // Set time to midnight

  if (filter.values.length === 0) {
    return true;
  }

  const filterValue = filter.values[0].textValue;
  if (!filterValue) {
    return true;
  }

  const filterDate = new Date(filterValue);
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
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.textValue;

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (filter.values.length === 0) {
    return true;
  }

  const filterValue = filter.values[0].textValue;
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
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  return false;
};

const recordMatchesMultiSelectFilter = (
  record: RecordNode,
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValues = record.attributes
    .filter((attribute) => attribute.type === field.id)
    ?.map((attribute) => attribute.foreignNodeId);

  if (filter.operator === 'is_empty') {
    return fieldValues?.length === 0;
  }

  if (filter.operator === 'is_not_empty') {
    return fieldValues?.length > 0;
  }

  if (!fieldValues) {
    return false;
  }

  const selectOptionIds = filter.values.map((value) => value.foreignNodeId);
  if (selectOptionIds.length === 0) {
    return true;
  }

  switch (filter.operator) {
    case 'is_in':
      return fieldValues.some((value) => selectOptionIds.includes(value));
    case 'is_not_in':
      return !fieldValues.some((value) => selectOptionIds.includes(value));
  }

  return false;
};

const recordMatchesNumberFilter = (
  record: RecordNode,
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.numberValue;

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (filter.values.length === 0) {
    return true;
  }

  const filterValue = filter.values[0].numberValue;
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
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.textValue;

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (filter.values.length === 0) {
    return true;
  }

  const filterValue = filter.values[0].textValue;
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
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.foreignNodeId;

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (filter.values.length === 0) {
    return true;
  }

  const selectOptionIds = filter.values.map((value) => value.foreignNodeId);
  if (selectOptionIds.length === 0) {
    return true;
  }

  switch (filter.operator) {
    case 'is_in':
      return selectOptionIds.includes(fieldValue);
    case 'is_not_in':
      return !selectOptionIds.includes(fieldValue);
  }

  return false;
};

const recordMatchesTextFilter = (
  record: RecordNode,
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.textValue;

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (filter.values.length === 0) {
    return true;
  }

  const filterValue = filter.values[0].textValue;
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
  filter: ViewFilterNode,
  field: FieldNode,
) => {
  const fieldValue = record.attributes.find(
    (attribute) => attribute.type === field.id,
  )?.textValue;

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue) {
    return false;
  }

  if (filter.values.length === 0) {
    return true;
  }

  const filterValue = filter.values[0].textValue;
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
