import { FieldAttributes } from '@colanode/core';
import { RecordTextValue } from '@/renderer/components/records/values/record-text-value';
import { RecordNumberValue } from '@/renderer/components/records/values/record-number-value';
import { RecordBooleanValue } from '@/renderer/components/records/values/record-boolean-value';
import { RecordCreatedAtValue } from '@/renderer/components/records/values/record-created-at-value';
import { RecordCreatedByValue } from '@/renderer/components/records/values/record-created-by-value';
import { RecordSelectValue } from '@/renderer/components/records/values/record-select-value';
import { RecordPhoneValue } from '@/renderer/components/records/values/record-phone-value';
import { RecordEmailValue } from '@/renderer/components/records/values/record-email-value';
import { RecordUrlValue } from '@/renderer/components/records/values/record-url-value';
import { RecordMultiSelectValue } from '@/renderer/components/records/values/record-multi-select-value';

interface RecordFieldValueProps {
  field: FieldAttributes;
}

export const RecordFieldValue = ({ field }: RecordFieldValueProps) => {
  switch (field.type) {
    case 'text':
      return <RecordTextValue field={field} />;
    case 'number':
      return <RecordNumberValue field={field} />;
    case 'boolean':
      return <RecordBooleanValue field={field} />;
    case 'createdAt':
      return <RecordCreatedAtValue field={field} />;
    case 'createdBy':
      return <RecordCreatedByValue field={field} />;
    case 'select':
      return <RecordSelectValue field={field} />;
    case 'phone':
      return <RecordPhoneValue field={field} />;
    case 'email':
      return <RecordEmailValue field={field} />;
    case 'url':
      return <RecordUrlValue field={field} />;
    case 'multiSelect':
      return <RecordMultiSelectValue field={field} />;
    default:
      return null;
  }
};
