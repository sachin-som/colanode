import React from 'react';
import { TableViewHeader } from '@/components/databases/tables/table-view-header';
import { TableViewBody } from '@/components/databases/tables/table-view-body';
import { TableViewRecordCreateRow } from '@/components/databases/tables/table-view-record-create-row';
import { TableViewContext } from '@/contexts/table-view';
import { useDatabase } from '@/contexts/database';
import { compareString } from '@/lib/utils';
import { FieldDataType, TableViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { TableViewSettingsPopover } from '@/components/databases/tables/table-view-settings-popover';
import { getDefaultFieldWidth, getDefaultNameWidth } from '@/lib/databases';
import { generateNodeIndex } from '@/lib/nodes';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { AttributeTypes } from '@/lib/constants';
import { ViewSortsAndFilters } from '@/components/databases/view-sorts-and-filters';
import { ViewFilterButton } from '@/components/databases/filters/view-filter.button';
import { ViewSortButton } from '@/components/databases/sorts/view-sort-button';

interface TableViewProps {
  node: TableViewNode;
}

export const TableView = ({ node }: TableViewProps) => {
  const database = useDatabase();

  const { mutate: upsertAttribute } = useNodeAttributeUpsertMutation();
  const { mutate: deleteAttribute } = useNodeAttributeDeleteMutation();

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

  const [openSortsAndFilters, setOpenSortsAndFilters] = React.useState(false);

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
        filters: node.filters,
        sorts: node.sorts,
        hideField: (id: string) => {
          if (hiddenFields.includes(id)) {
            return;
          }

          setHiddenFields([...hiddenFields, id]);
          upsertAttribute({
            nodeId: node.id,
            type: AttributeTypes.HiddenField,
            key: id,
            textValue: id,
            numberValue: null,
            foreignNodeId: id,
          });
        },
        showField: (id: string) => {
          if (!hiddenFields.includes(id)) {
            return;
          }

          setHiddenFields((prev) => prev.filter((f) => f !== id));
          deleteAttribute({
            nodeId: node.id,
            type: AttributeTypes.HiddenField,
            key: id,
          });
        },
        isHiddenField: (id: string) => hiddenFields.includes(id),
        getNameWidth: () => nameWidth,
        resizeName: (width: number) => {
          setNameWidth(width);
          upsertAttribute({
            nodeId: node.id,
            type: AttributeTypes.NameWidth,
            key: '1',
            numberValue: width,
            foreignNodeId: null,
            textValue: null,
          });
        },
        getFieldWidth: (id: string, type: FieldDataType) => {
          return fieldWidths[id] ?? getDefaultFieldWidth(type);
        },
        resizeField: (id, width) => {
          setFieldWidths({ ...fieldWidths, [id]: width });
          upsertAttribute({
            nodeId: node.id,
            type: AttributeTypes.FieldWidth,
            key: id,
            numberValue: width,
            foreignNodeId: id,
            textValue: null,
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
          upsertAttribute({
            nodeId: node.id,
            type: AttributeTypes.FieldIndex,
            key: id,
            textValue: newIndex,
            foreignNodeId: id,
            numberValue: null,
          });
        },
      }}
    >
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <TableViewSettingsPopover />
          <ViewSortButton
            viewId={node.id}
            sorts={node.sorts}
            open={openSortsAndFilters}
            setOpen={setOpenSortsAndFilters}
          />
          <ViewFilterButton
            viewId={node.id}
            filters={node.filters}
            open={openSortsAndFilters}
            setOpen={setOpenSortsAndFilters}
          />
        </div>
      </div>
      {openSortsAndFilters && (
        <ViewSortsAndFilters
          viewId={node.id}
          filters={node.filters}
          sorts={node.sorts}
        />
      )}
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <TableViewHeader />
        <TableViewBody />
        <TableViewRecordCreateRow />
      </div>
    </TableViewContext.Provider>
  );
};
