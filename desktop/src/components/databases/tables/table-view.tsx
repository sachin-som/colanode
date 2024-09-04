import React from 'react';
import { LocalNode } from '@/types/nodes';
import { TableViewHeader } from '@/components/databases/tables/table-view-header';
import { TableViewBody } from '@/components/databases/tables/table-view-body';
import { TableViewRecordCreateRow } from '@/components/databases/tables/table-view-record-create-row';
import { TableViewContext } from '@/contexts/table-view';
import { useDatabase } from '@/contexts/database';
import { compareString } from '@/lib/utils';
import { FieldType } from '@/types/databases';
import { getDefaultFieldWidth, getDefaultNameWidth } from '@/lib/databases';

interface TableViewProps {
  node: LocalNode;
}

export const TableView = ({ node }: TableViewProps) => {
  const database = useDatabase();

  const attrs = node.attrs ?? {};
  const [hiddenFields, setHiddenFields] = React.useState<string[]>(
    attrs.hiddenFields ?? [],
  );
  const [fieldIndexes, setFieldIndexes] = React.useState<
    Record<string, string>
  >(attrs.fieldIndexes ?? {});
  const [fieldWidths, setFieldWidths] = React.useState<Record<string, number>>(
    attrs.fieldWidths ?? {},
  );
  const [nameWidth, setNameWidth] = React.useState<number>(
    attrs.nameWidth ?? getDefaultNameWidth(),
  );

  React.useEffect(() => {
    const attrs = node.attrs ?? {};
    setHiddenFields(attrs.hiddenFields ?? []);
    setFieldIndexes(attrs.fieldIndexes ?? {});
    setFieldWidths(attrs.fieldWidths ?? {});
    setNameWidth(attrs.nameWidth ?? getDefaultNameWidth());
  }, [node.versionId]);

  return (
    <TableViewContext.Provider
      value={{
        id: node.id,
        fields: database.fields
          .filter((field) => !hiddenFields.includes(field.id))
          .sort((a, b) =>
            compareString(
              fieldIndexes[a.id] ?? a.index,
              fieldIndexes[b.id] ?? b.index,
            ),
          ),
        hideField: (id: string) => {
          if (hiddenFields.includes(id)) {
            return;
          }

          setHiddenFields([...hiddenFields, id]);
        },
        showField: (id: string) => {
          if (!hiddenFields.includes(id)) {
            return;
          }

          setHiddenFields(hiddenFields.filter((fieldId) => fieldId !== id));
        },
        getNameWidth: () => nameWidth,
        resizeName: (width: number) => {
          setNameWidth(width);
        },
        getFieldWidth: (id: string, type: FieldType) => {
          return fieldWidths[id] ?? getDefaultFieldWidth(type);
        },
        resizeField: (id, width) => {
          setFieldWidths({ ...fieldWidths, [id]: width });
        },
        moveField: (id, after) => {
          setFieldIndexes({
            ...fieldIndexes,
            [id]: fieldIndexes[after],
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
