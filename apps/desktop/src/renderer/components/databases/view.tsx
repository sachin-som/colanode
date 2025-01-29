import {
  compareString,
  SortDirection,
  ViewAttributes,
  ViewFieldFilterAttributes,
  ViewFilterAttributes,
  ViewSortAttributes,
} from '@colanode/core';
import React from 'react';
import { match } from 'ts-pattern';

import { BoardView } from '@/renderer/components/databases/boards/board-view';
import { CalendarView } from '@/renderer/components/databases/calendars/calendar-view';
import { TableView } from '@/renderer/components/databases/tables/table-view';
import { useDatabase } from '@/renderer/contexts/database';
import { ViewContext } from '@/renderer/contexts/view';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useLayout } from '@/renderer/contexts/layout';
import {
  generateFieldValuesFromFilters,
  generateViewFieldIndex,
  getDefaultFieldWidth,
  getDefaultNameWidth,
  getDefaultViewFieldDisplay,
  getFieldFilterOperators,
} from '@/shared/lib/databases';
import { ViewField } from '@/shared/types/databases';
import { toast } from '@/renderer/hooks/use-toast';

interface ViewProps {
  view: ViewAttributes;
}

export const View = ({ view }: ViewProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const layout = useLayout();

  const fields: ViewField[] = React.useMemo(() => {
    return database.fields
      .map((field) => {
        const viewField = view.fields?.[field.id];

        return {
          field,
          display: viewField?.display ?? getDefaultViewFieldDisplay(view.type),
          index: viewField?.index ?? field.index,
          width: viewField?.width ?? getDefaultFieldWidth(field.type),
        };
      })
      .filter((field) => field.display)
      .sort((a, b) => compareString(a.index, b.index));
  }, [view.id, database.fields, view.fields]);

  const [isSearchBarOpened, setIsSearchBarOpened] = React.useState(false);
  const [isSortsOpened, setIsSortsOpened] = React.useState(false);
  const [openedFieldFilters, setOpenedFieldFilters] = React.useState<string[]>(
    []
  );

  return (
    <ViewContext.Provider
      value={{
        id: view.id,
        name: view.name,
        avatar: view.avatar,
        type: view.type,
        fields,
        filters: Object.values(view.filters ?? {}),
        sorts: Object.values(view.sorts ?? {}),
        groupBy: view.groupBy,
        nameWidth: view.nameWidth ?? getDefaultNameWidth(),
        isSearchBarOpened,
        isSortsOpened,
        rename: async (name: string) => {
          if (!database.canEdit) return;

          const viewCopy = { ...view };
          viewCopy.name = name;

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
        updateAvatar: async (avatar: string) => {
          if (!database.canEdit) return;

          const viewCopy = { ...view };
          viewCopy.avatar = avatar;

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
        setFieldDisplay: async (id: string, display: boolean) => {
          if (!database.canEdit) return;

          const viewField = view.fields?.[id];
          if (viewField && viewField.display === display) return;

          const viewCopy = { ...view };
          viewCopy.fields = viewCopy.fields ?? {};
          if (!viewCopy.fields[id]) {
            viewCopy.fields[id] = {
              id: id,
              display: display,
            };
          } else {
            viewCopy.fields[id].display = display;
          }

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
        resizeField: async (id: string, width: number) => {
          if (!database.canEdit) {
            return;
          }

          const viewField = view.fields?.[id];
          if (viewField && viewField.width === width) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.fields = viewCopy.fields ?? {};
          if (!viewCopy.fields[id]) {
            viewCopy.fields[id] = {
              id: id,
              width: width,
            };
          } else {
            viewCopy.fields[id].width = width;
          }

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
        resizeName: async (width: number) => {
          if (!database.canEdit) {
            return;
          }

          if (view.nameWidth === width) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.nameWidth = width;

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
        moveField: async (id: string, after: string) => {
          if (!database.canEdit) {
            return;
          }

          const newIndex = generateViewFieldIndex(
            database.fields,
            Object.values(view.fields ?? {}),
            id,
            after
          );
          if (newIndex === null) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.fields = viewCopy.fields ?? {};
          if (!viewCopy.fields[id]) {
            viewCopy.fields[id] = {
              id: id,
              index: newIndex,
            };
          } else {
            viewCopy.fields[id].index = newIndex;
          }

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          }
        },
        isFieldFilterOpened: (fieldId: string) =>
          openedFieldFilters.includes(fieldId),
        initFieldFilter: async (fieldId: string) => {
          if (!database.canEdit) {
            return;
          }

          if (view.filters?.[fieldId]) {
            setOpenedFieldFilters((prev) => [...prev, fieldId]);
            return;
          }

          const field = database.fields.find((f) => f.id === fieldId);
          if (!field) {
            return;
          }

          const operators = getFieldFilterOperators(field.type);
          const filter: ViewFieldFilterAttributes = {
            type: 'field',
            id: fieldId,
            fieldId,
            operator: operators[0]?.value ?? '',
          };

          const viewCopy = { ...view };
          viewCopy.filters = viewCopy.filters ?? {};
          viewCopy.filters[fieldId] = filter;

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          } else {
            setOpenedFieldFilters((prev) => [...prev, fieldId]);
          }
        },
        updateFilter: async (id: string, filter: ViewFilterAttributes) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.filters?.[id]) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.filters = viewCopy.filters ?? {};
          viewCopy.filters[id] = filter;

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          } else {
            setIsSearchBarOpened(true);
          }
        },
        removeFilter: async (id: string) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.filters?.[id]) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.filters = viewCopy.filters ?? {};
          delete viewCopy.filters[id];

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          } else {
            setIsSearchBarOpened(true);
          }
        },
        initFieldSort: async (fieldId: string, direction: SortDirection) => {
          if (!database.canEdit) {
            return;
          }

          const existingSort = view.sorts?.[fieldId];
          if (existingSort && existingSort.direction === direction) {
            return;
          }

          const field = database.fields.find((f) => f.id === fieldId);
          if (!field) {
            return;
          }

          const sort: ViewSortAttributes = {
            id: fieldId,
            fieldId,
            direction,
          };

          const viewCopy = { ...view };
          viewCopy.sorts = viewCopy.sorts ?? {};
          viewCopy.sorts[fieldId] = sort;

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          } else {
            setIsSearchBarOpened(true);
            setIsSortsOpened(true);
          }
        },
        updateSort: async (id: string, sort: ViewSortAttributes) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.sorts?.[id]) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.sorts = viewCopy.sorts ?? {};
          viewCopy.sorts[id] = sort;

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          } else {
            setIsSearchBarOpened(true);
            setIsSortsOpened(true);
          }
        },
        removeSort: async (id: string) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.sorts?.[id]) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.sorts = viewCopy.sorts ?? {};
          delete viewCopy.sorts[id];

          const result = await window.colanode.executeMutation({
            type: 'view_update',
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            databaseId: database.id,
            view: viewCopy,
          });

          if (!result.success) {
            toast({
              title: 'Failed to update view',
              description: result.error.message,
              variant: 'destructive',
            });
          } else {
            setIsSearchBarOpened(true);
            setIsSortsOpened(true);
          }
        },
        openSearchBar: () => {
          setIsSearchBarOpened(true);
        },
        closeSearchBar: () => {
          setIsSearchBarOpened(false);
        },
        openSorts: () => {
          setIsSortsOpened(true);
        },
        closeSorts: () => {
          setIsSortsOpened(false);
        },
        openFieldFilter: (fieldId: string) => {
          setOpenedFieldFilters((prev) => [...prev, fieldId]);
        },
        closeFieldFilter: (fieldId: string) => {
          setOpenedFieldFilters((prev) => prev.filter((id) => id !== fieldId));
        },
        createRecord: async (filters?: ViewFilterAttributes[]) => {
          const viewFilters = Object.values(view.filters ?? {}) ?? [];
          const extraFilters = filters ?? [];

          const allFilters = [...viewFilters, ...extraFilters];
          const fields = generateFieldValuesFromFilters(
            database.fields,
            allFilters,
            workspace.userId
          );

          const result = await window.colanode.executeMutation({
            type: 'record_create',
            databaseId: database.id,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            fields,
          });

          if (!result.success) {
            toast({
              title: 'Failed to create record',
              description: result.error.message,
              variant: 'destructive',
            });
          } else {
            layout.previewLeft(result.output.id, true);
          }
        },
      }}
    >
      {match(view.type)
        .with('table', () => <TableView />)
        .with('board', () => <BoardView />)
        .with('calendar', () => <CalendarView />)
        .exhaustive()}
    </ViewContext.Provider>
  );
};
