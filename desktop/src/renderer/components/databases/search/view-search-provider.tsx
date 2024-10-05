import React from 'react';
import { ViewSearchContext } from '@/renderer/contexts/view-search';
import { ViewFieldFilter, ViewFilter, ViewSort } from '@/types/databases';
import { useDatabase } from '@/renderer/contexts/database';
import { generateId, IdType } from '@/lib/id';
import { getFieldFilterOperators } from '@/lib/databases';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface ViewSearchProviderProps {
  id: string;
  filters: ViewFilter[];
  sorts: ViewSort[];
  children: React.ReactNode;
}

export const ViewSearchProvider = ({
  id,
  filters,
  sorts,
  children,
}: ViewSearchProviderProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useMutation();

  const [isSearchBarOpened, setIsSearchBarOpened] = React.useState(false);
  const [isSortsOpened, setIsSortsOpened] = React.useState(false);
  const [openedFieldFilters, setOpenedFieldFilters] = React.useState<string[]>(
    [],
  );

  return (
    <ViewSearchContext.Provider
      value={{
        id,
        filters: filters,
        sorts: sorts,
        isSaving: isPending,
        isSearchBarOpened: isSearchBarOpened,
        isSortsOpened: isSortsOpened,
        isFieldFilterOpened: (fieldId: string) =>
          openedFieldFilters.includes(fieldId),
        initFieldFilter: (fieldId: string) => {
          const field = database.fields.find((field) => field.id === fieldId);
          if (!field) {
            return;
          }

          const existingFieldFilter = filters.find(
            (filter) => filter.type === 'field' && filter.fieldId === fieldId,
          );

          if (existingFieldFilter) {
            if (!openedFieldFilters.includes(fieldId)) {
              setOpenedFieldFilters((prev) => [...prev, fieldId]);
            }
            return;
          }

          const operators = getFieldFilterOperators(field.dataType);
          const filter: ViewFieldFilter = {
            type: 'field',
            id: generateId(IdType.ViewFilter),
            fieldId,
            operator: operators[0].value,
            value: null,
          };

          const newFilters = [...filters, filter];
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: id,
              attribute: 'filters',
              value: newFilters,
              userId: workspace.userId,
            },
            onSuccess() {
              setOpenedFieldFilters((prev) => [...prev, filter.id]);
              setIsSearchBarOpened(true);
            },
          });
        },
        updateFilter: (filterId: string, newFilter: ViewFieldFilter) => {
          const newFilters = filters.map((filter) =>
            filter.type === 'field' && filter.id === filterId
              ? newFilter
              : filter,
          );

          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: id,
              attribute: 'filters',
              value: newFilters,
              userId: workspace.userId,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
            },
          });
        },
        removeFilter: (filterId: string) => {
          const newFilters = filters.filter((filter) => filter.id !== filterId);
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: id,
              attribute: 'filters',
              value: newFilters,
              userId: workspace.userId,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
            },
          });
        },
        initFieldSort: (fieldId: string) => {
          const field = database.fields.find((field) => field.id === fieldId);
          if (!field) {
            return;
          }

          const existingFieldSort = sorts.find(
            (sort) => sort.fieldId === fieldId,
          );

          if (existingFieldSort) {
            if (!isSortsOpened) {
              setIsSortsOpened(true);
              setIsSearchBarOpened(true);
            }
            return;
          }

          const sort: ViewSort = {
            id: generateId(IdType.ViewFilter),
            fieldId,
            direction: 'asc',
          };

          const newSorts = [...sorts, sort];
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: id,
              attribute: 'sorts',
              value: newSorts,
              userId: workspace.userId,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
              setIsSortsOpened(true);
            },
          });
        },
        updateSort: (sortId: string, newSort: ViewSort) => {
          const newSorts = sorts.map((sort) =>
            sort.id === sortId ? newSort : sort,
          );

          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: id,
              attribute: 'sorts',
              value: newSorts,
              userId: workspace.userId,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
              setIsSortsOpened(true);
            },
          });
        },
        removeSort: (sortId: string) => {
          const newSorts = sorts.filter((sort) => sort.id !== sortId);

          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: id,
              attribute: 'sorts',
              value: newSorts,
              userId: workspace.userId,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
            },
          });
        },
        openSearchBar: () => setIsSearchBarOpened(true),
        closeSearchBar: () => setIsSearchBarOpened(false),
        openSorts: () => setIsSortsOpened(true),
        closeSorts: () => setIsSortsOpened(false),
        openFieldFilter: (fieldId: string) =>
          setOpenedFieldFilters((prev) => [...prev, fieldId]),
        closeFieldFilter: (fieldId: string) =>
          setOpenedFieldFilters((prev) => prev.filter((id) => id !== fieldId)),
      }}
    >
      {children}
    </ViewSearchContext.Provider>
  );
};
