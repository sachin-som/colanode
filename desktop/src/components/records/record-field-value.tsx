import React from 'react';
import { FieldNode, RecordNode } from '@/types/databases';
import { RecordTextValue } from '@/components/records/values/record-text-value';
import { RecordNumberValue } from '@/components/records/values/record-number-value';
import { RecordBooleanValue } from '@/components/records/values/record-boolean-value';
import { RecordCreatedAtValue } from '@/components/records/values/record-created-at-value';
import { RecordCreatedByValue } from '@/components/records/values/record-created-by-value';
import { RecordSelectValue } from '@/components/records/values/record-select-value';
import { RecordPhoneValue } from '@/components/records/values/record-phone-value';
import { RecordEmailValue } from '@/components/records/values/record-email-value';
import { RecordUrlValue } from '@/components/records/values/record-url-value';
import { RecordMultiSelectValue } from '@/components/records/values/record-multi-select-value';

interface RecordFieldValueProps {
  record: RecordNode;
  field: FieldNode;
}

export const RecordFieldValue = ({ record, field }: RecordFieldValueProps) => {
  switch (field.dataType) {
    case 'text':
      return <RecordTextValue record={record} field={field} />;
    case 'number':
      return <RecordNumberValue record={record} field={field} />;
    case 'boolean':
      return <RecordBooleanValue record={record} field={field} />;
    case 'created_at':
      return <RecordCreatedAtValue record={record} field={field} />;
    case 'created_by':
      return <RecordCreatedByValue record={record} field={field} />;
    case 'select':
      return <RecordSelectValue record={record} field={field} />;
    case 'phone':
      return <RecordPhoneValue record={record} field={field} />;
    case 'email':
      return <RecordEmailValue record={record} field={field} />;
    case 'url':
      return <RecordUrlValue record={record} field={field} />;
    case 'multi_select':
      return <RecordMultiSelectValue record={record} field={field} />;
  }
};
