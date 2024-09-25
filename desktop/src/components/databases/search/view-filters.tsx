import React from 'react';
import { useDatabase } from '@/contexts/database';
import { ViewTextFieldFilter } from '@/components/databases/search/view-text-field-filter';
import { ViewNumberFieldFilter } from '@/components/databases/search/view-number-field-filter';
import { ViewEmailFieldFilter } from '@/components/databases/search/view-email-field-filter';
import { ViewUrlFieldFilter } from '@/components/databases/search/view-url-field-filter';
import { ViewPhoneFieldFilter } from '@/components/databases/search/view-phone-field-filter';
import { ViewBooleanFieldFilter } from '@/components/databases/search/view-boolean-field-filter';
import { ViewSelectFieldFilter } from '@/components/databases/search/view-select-field-filter';
import { ViewMultiSelectFieldFilter } from '@/components/databases/search/view-multi-select-field-filter';
import { ViewDateFieldFilter } from '@/components/databases/search/view-date-field-filter';
import { ViewCreatedAtFieldFilter } from '@/components/databases/search/view-created-at-field-fitler';
import { ViewFilterAddPopover } from '@/components/databases/search/view-filter-add-popover';
import { Icon } from '@/components/ui/icon';
import { useViewSearch } from '@/contexts/view-search';

export const ViewFilters = () => {
  const database = useDatabase();
  const viewSearch = useViewSearch();

  return (
    <div className="flex flex-row items-center gap-2">
      {viewSearch.filters &&
        viewSearch.filters.map((filter) => {
          if (filter.type === 'group') {
            return null;
          }

          const field = database.fields.find(
            (field) => field.id === filter.fieldId,
          );

          if (!field) {
            return null;
          }

          switch (field.dataType) {
            case 'boolean':
              return (
                <ViewBooleanFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'collaborator':
              return null;
            case 'created_at':
              return (
                <ViewCreatedAtFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'created_by':
              return null;
            case 'date':
              return (
                <ViewDateFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
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
              return (
                <ViewMultiSelectFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
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
              return (
                <ViewSelectFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
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
      <ViewFilterAddPopover>
        <button className="flex cursor-pointer flex-row items-center gap-1 rounded-lg p-1 text-sm text-muted-foreground hover:bg-gray-50">
          <Icon name="add-line" />
          Add filter
        </button>
      </ViewFilterAddPopover>
    </div>
  );
};
