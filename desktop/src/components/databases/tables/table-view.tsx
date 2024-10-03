import React from 'react';
import { TableViewHeader } from '@/components/databases/tables/table-view-header';
import { TableViewBody } from '@/components/databases/tables/table-view-body';
import { TableViewRecordCreateRow } from '@/components/databases/tables/table-view-record-create-row';
import { TableViewContext } from '@/renderer/contexts/table-view';
import { useDatabase } from '@/renderer/contexts/database';
import { compareString } from '@/lib/utils';
import { FieldDataType, TableViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { TableViewSettingsPopover } from '@/components/databases/tables/table-view-settings-popover';
import { getDefaultFieldWidth, getDefaultNameWidth } from '@/lib/databases';
import { generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { ViewSearchBar } from '@/components/databases/search/view-search-bar';
import { ViewFilterButton } from '@/components/databases/search/view-filter-button';
import { ViewSortButton } from '@/components/databases/search/view-sort-button';
import { ViewSearchProvider } from '@/components/databases/search/view-search-provider';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface TableViewProps {
  node: TableViewNode;
}

export const TableView = ({ node }: TableViewProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate } = useMutation();

  const [hiddenFields, setHiddenFields] = React.useState<string[]>(
    node.hiddenFields ?? [],
  );
  const [fieldIndexes, setFieldIndexes] = React.useState<
    Record<string, string>
  >(node.fieldIndexes ?? {});
  const [fieldWidths, setFieldWidths] = React.useState<Record<string, number>>(
    node.fieldWidths ?? {},
  );
  const [nameWidth, setNameWidth] = React.useState<number>(
    node.nameWidth ?? getDefaultNameWidth(),
  );

  React.useEffect(() => {
    setHiddenFields(node.hiddenFields ?? []);
    setFieldIndexes(node.fieldIndexes ?? {});
    setFieldWidths(node.fieldWidths ?? {});
    setNameWidth(node.nameWidth ?? getDefaultNameWidth());
  }, [node.hiddenFields, node.fieldIndexes, node.fieldWidths, node.nameWidth]);

  const fields = React.useMemo(() => {
    return database.fields
      .filter((field) => !hiddenFields.includes(field.id))
      .sort((a, b) =>
        compareString(
          fieldIndexes[a.id] ?? a.index,
          fieldIndexes[b.id] ?? b.index,
        ),
      );
  }, [database.fields, hiddenFields, fieldIndexes]);

  return (
    <TableViewContext.Provider
      value={{
        id: node.id,
        name: node.name,
        fields,
        hideField: (id: string) => {
          if (hiddenFields.includes(id)) {
            return;
          }

          const newHiddenFields = [...hiddenFields, id];
          setHiddenFields(newHiddenFields);
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: node.id,
              attribute: 'hiddenFields',
              value: newHiddenFields,
              userId: workspace.userId,
            },
          });
        },
        showField: (id: string) => {
          if (!hiddenFields.includes(id)) {
            return;
          }

          const newHiddenFields = hiddenFields.filter((f) => f !== id);
          setHiddenFields(newHiddenFields);
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: node.id,
              attribute: 'hiddenFields',
              value: newHiddenFields,
              userId: workspace.userId,
            },
          });
        },
        isHiddenField: (id: string) => hiddenFields.includes(id),
        getNameWidth: () => nameWidth,
        resizeName: (width: number) => {
          setNameWidth(width);
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: node.id,
              attribute: 'nameWidth',
              value: width,
              userId: workspace.userId,
            },
          });
        },
        getFieldWidth: (id: string, type: FieldDataType) => {
          return fieldWidths[id] ?? getDefaultFieldWidth(type);
        },
        resizeField: (id, width) => {
          setFieldWidths({ ...fieldWidths, [id]: width });
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: node.id,
              attribute: 'fieldWidths',
              value: { ...fieldWidths, [id]: width },
              userId: workspace.userId,
            },
          });
        },
        moveField: (id, after) => {
          const field = database.fields.find((f) => f.id === id);
          if (!field) {
            return;
          }

          if (database.fields.length <= 1) {
            return;
          }

          const mergedIndexes = database.fields
            .map((f) => {
              return {
                id: f.id,
                databaseIndex: f.index,
                viewIndex: fieldIndexes[f.id],
              };
            })
            .sort((a, b) =>
              compareString(
                a.viewIndex ?? a.databaseIndex,
                b.viewIndex ?? b.databaseIndex,
              ),
            );

          let previousIndex: string | null = null;
          let nextIndex: string | null = null;
          if (after === 'name') {
            const lowestIndex = mergedIndexes[0];
            nextIndex = lowestIndex.viewIndex ?? lowestIndex.databaseIndex;
          } else {
            const afterFieldArrayIndex = mergedIndexes.findIndex(
              (f) => f.id === after,
            );
            if (afterFieldArrayIndex === -1) {
              return;
            }

            previousIndex =
              mergedIndexes[afterFieldArrayIndex].viewIndex ??
              mergedIndexes[afterFieldArrayIndex].databaseIndex;

            if (afterFieldArrayIndex < mergedIndexes.length) {
              nextIndex =
                mergedIndexes[afterFieldArrayIndex + 1].viewIndex ??
                mergedIndexes[afterFieldArrayIndex + 1].databaseIndex;
            }
          }

          let newIndex = generateNodeIndex(previousIndex, nextIndex);

          const lastDatabaseField = mergedIndexes.sort((a, b) =>
            compareString(a.databaseIndex, b.databaseIndex),
          )[mergedIndexes.length - 1];

          const newPotentialFieldIndex = generateNodeIndex(
            lastDatabaseField.databaseIndex,
            null,
          );

          if (newPotentialFieldIndex === newIndex) {
            newIndex = generateNodeIndex(previousIndex, newPotentialFieldIndex);
          }

          setFieldIndexes({
            ...fieldIndexes,
            [id]: newIndex,
          });
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: node.id,
              attribute: 'fieldIndexes',
              value: { ...fieldIndexes, [id]: newIndex },
              userId: workspace.userId,
            },
          });
        },
      }}
    >
      <ViewSearchProvider
        id={node.id}
        filters={node.filters}
        sorts={node.sorts}
      >
        <div className="mt-2 flex flex-row justify-between border-b">
          <ViewTabs />
          <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
            <TableViewSettingsPopover />
            <ViewSortButton />
            <ViewFilterButton />
          </div>
        </div>
        <ViewSearchBar />
        <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
          <TableViewHeader />
          <TableViewBody />
          <TableViewRecordCreateRow />
        </div>
      </ViewSearchProvider>
    </TableViewContext.Provider>
  );
};
