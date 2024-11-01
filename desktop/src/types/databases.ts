import { FieldAttributes, ViewFieldAttributes } from '@/registry';

export type ViewField = {
  field: FieldAttributes;
  display: boolean;
  index: string;
  width: number;
};
