import React from 'react';
import { ViewFilterNode } from '@/types/databases';
import { useDatabase } from '@/contexts/database';
import { ViewTextFieldFilter } from '@/components/databases/filters/view-text-field-filter';
import { ViewAddFilterButton } from '@/components/databases/filters/view-filter-add-button';
import { ViewNumberFieldFilter } from '@/components/databases/filters/view-number-field-filter';
import { ViewEmailFieldFilter } from '@/components/databases/filters/view-email-field-filter';
import { ViewUrlFieldFilter } from '@/components/databases/filters/view-url-field-filter';
import { ViewPhoneFieldFilter } from '@/components/databases/filters/view-phone-field-filter';

interface ViewFiltersProps {
  viewId: string;
  filters: ViewFilterNode[];
}

export const ViewFilters = ({ viewId, filters }: ViewFiltersProps) => {
  const database = useDatabase();

  return (
    <div className="mt-3 flex flex-row items-center gap-2">
      {filters &&
        filters.map((filter) => {
          const field = database.fields.find(
            (field) => field.id === filter.fieldId,
          );

          if (!field) {
            return null;
          }

          switch (field.dataType) {
            case 'boolean':
              return null;
            case 'collaborator':
              return null;
            case 'created_at':
              return null;
            case 'created_by':
              return null;
            case 'date':
              return null;
            case 'email':
              return (
                <ViewEmailFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'file':
              return null;
            case 'multi_select':
              return null;
            case 'number':
              return (
                <ViewNumberFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'phone':
              return (
                <ViewPhoneFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'select':
              return null;
            case 'text':
              return (
                <ViewTextFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );

            case 'url':
              return (
                <ViewUrlFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );

            default:
              return null;
          }
        })}
      <ViewAddFilterButton viewId={viewId} existingFilters={filters} />
    </div>
  );
};
