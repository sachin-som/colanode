import React from 'react';
import { TableViewHeader } from '@/components/databases/tables/table-view-header';
import { TableViewBody } from '@/components/databases/tables/table-view-body';
import { TableViewRecordCreateRow } from '@/components/databases/tables/table-view-record-create-row';
import { TableViewContext } from '@/contexts/table-view';
import { useDatabase } from '@/contexts/database';
import { compareString } from '@/lib/utils';
import { FieldDataType, TableViewNode } from '@/types/databases';
import { getDefaultFieldWidth, getDefaultNameWidth } from '@/lib/databases';
import { generateNodeIndex } from '@/lib/nodes';
import { useUpdateViewFieldIndexMutation } from '@/mutations/use-update-view-field-index-mutation';
import { useUpdateViewNameWidthMutation } from '@/mutations/use-update-view-name-width-mutation';
import { useUpdateViewFieldWidthMutation } from '@/mutations/use-update-view-field-width-mutation';
import { useUpdateViewHiddenFieldMutation } from '@/mutations/use-update-hidden-field-mutation';

interface TableViewProps {
  node: TableViewNode;
}

export const TableView = ({ node }: TableViewProps) => {
  const database = useDatabase();

  const updateHiddenFieldMutation = useUpdateViewHiddenFieldMutation();
  const updateNameWidthMutation = useUpdateViewNameWidthMutation();
  const updateFieldWidthMutation = useUpdateViewFieldWidthMutation();
  const updateFieldIndexMutation = useUpdateViewFieldIndexMutation();

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
  }, [node.versionId]);

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
        fields,
        hideField: (id: string) => {
          if (hiddenFields.includes(id)) {
            return;
          }

          setHiddenFields([...hiddenFields, id]);
          updateHiddenFieldMutation.mutate({
            viewId: node.id,
            fieldId: id,
            hide: true,
          });
        },
        showField: (id: string) => {
          if (!hiddenFields.includes(id)) {
            return;
          }

          const newHiddenFields = hiddenFields.filter((f) => f !== id);
          setHiddenFields(newHiddenFields);
          updateHiddenFieldMutation.mutate({
            viewId: node.id,
            fieldId: id,
            hide: false,
          });
        },
        getNameWidth: () => nameWidth,
        resizeName: (width: number) => {
          setNameWidth(width);
          updateNameWidthMutation.mutate({ viewId: node.id, width });
        },
        getFieldWidth: (id: string, type: FieldDataType) => {
          return fieldWidths[id] ?? getDefaultFieldWidth(type);
        },
        resizeField: (id, width) => {
          setFieldWidths({ ...fieldWidths, [id]: width });
          updateFieldWidthMutation.mutate({
            viewId: node.id,
            fieldId: id,
            width,
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
          updateFieldIndexMutation.mutate({
            viewId: node.id,
            fieldId: id,
            index: newIndex,
          });
        },
      }}
    >
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <TableViewHeader />
        <TableViewBody />
        <TableViewRecordCreateRow />
      </div>
    </TableViewContext.Provider>
  );
};
