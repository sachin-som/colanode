import {
  FieldAttributes,
  FieldType,
  EntryRole,
  SelectOptionAttributes,
  ViewAttributes,
} from '@colanode/core';
import { createContext, useContext } from 'react';

interface DatabaseContext {
  id: string;
  name: string;
  fields: FieldAttributes[];
  views: ViewAttributes[];
  canEdit: boolean;
  canCreateRecord: boolean;
  role: EntryRole;
  createField: (type: FieldType, name: string) => void;
  renameField: (id: string, name: string) => void;
  deleteField: (id: string) => void;
  createSelectOption: (fieldId: string, name: string, color: string) => void;
  updateSelectOption: (
    fieldId: string,
    attributes: SelectOptionAttributes
  ) => void;
  deleteSelectOption: (fieldId: string, optionId: string) => void;
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext
);

export const useDatabase = () => useContext(DatabaseContext);
