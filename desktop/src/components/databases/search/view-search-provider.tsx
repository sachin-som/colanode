import React from 'react';
import { ViewSearchContext } from '@/contexts/view-search';
import { ViewFieldFilter, ViewFilter, ViewSort } from '@/types/databases';
import { useDatabase } from '@/contexts/database';
import { NeuronId } from '@/lib/id';
import { getFieldFilterOperators } from '@/lib/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';

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
  const database = useDatabase();
  const { mutate: setNodeAttribute, isPending: isSetingNodeAttribute } =
    useNodeAttributeSetMutation();

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
        isSaving: isSetingNodeAttribute,
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
            id: NeuronId.generate(NeuronId.Type.ViewFilter),
            fieldId,
            operator: operators[0].value,
            value: null,
          };

          const newFilters = [...filters, filter];
          setNodeAttribute(
            {
              nodeId: id,
              key: 'filters',
              value: newFilters,
            },
            {
              onSuccess: () => {
                setOpenedFieldFilters((prev) => [...prev, filter.id]);
                setIsSearchBarOpened(true);
              },
            },
          );
        },
        updateFilter: (filterId: string, newFilter: ViewFieldFilter) => {
          const newFilters = filters.map((filter) =>
            filter.type === 'field' && filter.id === filterId
              ? newFilter
              : filter,
          );

          setNodeAttribute(
            {
              nodeId: id,
              key: 'filters',
              value: newFilters,
            },
            {
              onSuccess: () => {
                setIsSearchBarOpened(true);
              },
            },
          );
        },
        removeFilter: (filterId: string) => {
          const newFilters = filters.filter((filter) => filter.id !== filterId);

          setNodeAttribute(
            {
              nodeId: id,
              key: 'filters',
              value: newFilters,
            },
            {
              onSuccess: () => {
                setOpenedFieldFilters((prev) =>
                  prev.filter((id) => id !== filterId),
                );
                setIsSearchBarOpened(true);
              },
            },
          );
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
            id: NeuronId.generate(NeuronId.Type.ViewFilter),
            fieldId,
            direction: 'asc',
          };

          const newSorts = [...sorts, sort];
          setNodeAttribute(
            {
              nodeId: id,
              key: 'sorts',
              value: newSorts,
            },
            {
              onSuccess: () => {
                setIsSearchBarOpened(true);
                setIsSortsOpened(true);
              },
            },
          );
        },
        updateSort: (sortId: string, newSort: ViewSort) => {
          const newSorts = sorts.map((sort) =>
            sort.id === sortId ? newSort : sort,
          );

          setNodeAttribute(
            {
              nodeId: id,
              key: 'sorts',
              value: newSorts,
            },
            {
              onSuccess: () => {
                setIsSortsOpened(true);
                setIsSearchBarOpened(true);
              },
            },
          );
        },
        removeSort: (sortId: string) => {
          const newSorts = sorts.filter((sort) => sort.id !== sortId);

          setNodeAttribute(
            {
              nodeId: id,
              key: 'sorts',
              value: newSorts,
            },
            {
              onSuccess: () => {
                setIsSearchBarOpened(true);
              },
            },
          );
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
