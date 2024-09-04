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
import { useMutation } from '@tanstack/react-query';
import { sql } from 'kysely';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';

interface TableViewProps {
  node: LocalNode;
}

interface UpdateHiddenFieldInput {
  fieldId: string;
  hide: boolean;
}

interface UpdateFieldIndexesInput {
  fieldId: string;
  index: string;
}

interface UpdateFieldWidthsInput {
  fieldId: string;
  width: number;
}

export const TableView = ({ node }: TableViewProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const attrs = node.attrs ?? {};
  const [hiddenFields, setHiddenFields] = React.useState<
    Record<string, number>
  >(attrs.hiddenFields ?? []);
  const [fieldIndexes, setFieldIndexes] = React.useState<
    Record<string, string>
  >(attrs.fieldIndexes ?? {});
  const [fieldWidths, setFieldWidths] = React.useState<Record<string, number>>(
    attrs.fieldWidths ?? {},
  );
  const [nameWidth, setNameWidth] = React.useState<number>(
    attrs.nameWidth ?? getDefaultNameWidth(),
  );

  const updateHiddenFieldMutation = useMutation({
    mutationFn: async (input: UpdateHiddenFieldInput) => {
      const { fieldId, hide } = input;

      if (hide) {
        const query = sql`
          UPDATE nodes
          SET attrs = json_set(coalesce(attrs, '{}'), '$.hiddenFields.${sql.ref(fieldId)}', 1),
              updated_at = ${new Date().toISOString()},
              updated_by = ${workspace.userId},
              version_id = ${NeuronId.generate(NeuronId.Type.Version)}
          WHERE id = ${node.id}
        `.compile(workspace.schema);

        await workspace.mutate(query);
      } else {
        const query = sql`
          UPDATE nodes
          SET attrs = json_remove(attrs, '$.hiddenFields.${sql.ref(fieldId)}'),
              updated_at = ${new Date().toISOString()},
              updated_by = ${workspace.userId},
              version_id = ${NeuronId.generate(NeuronId.Type.Version)}
          WHERE id = ${node.id} AND attrs IS NOT NULL
        `.compile(workspace.schema);

        await workspace.mutate(query);
      }
    },
  });

  const updateFieldIndexesMutation = useMutation({
    mutationFn: async (input: UpdateFieldIndexesInput) => {
      const { fieldId, index } = input;

      const query = sql`
        UPDATE nodes
        SET attrs = json_set(coalesce(attrs, '{}'), '$.fieldIndexes.${sql.ref(fieldId)}', ${index}),
            updated_at = ${new Date().toISOString()},
            updated_by = ${workspace.userId},
            version_id = ${NeuronId.generate(NeuronId.Type.Version)}
        WHERE id = ${node.id}
      `.compile(workspace.schema);

      await workspace.mutate(query);
    },
  });

  const updateFieldWidthsMutation = useMutation({
    mutationFn: async (input: UpdateFieldWidthsInput) => {
      const { fieldId, width } = input;

      const query = sql`
        UPDATE nodes
        SET attrs = json_set(coalesce(attrs, '{}'), '$.fieldWidths.${sql.ref(fieldId)}', ${width}),
            updated_at = ${new Date().toISOString()},
            updated_by = ${workspace.userId},
            version_id = ${NeuronId.generate(NeuronId.Type.Version)}
        WHERE id = ${node.id}
      `.compile(workspace.schema);

      await workspace.mutate(query);
    },
  });

  const updateNameWidthMutation = useMutation({
    mutationFn: async (width: number) => {
      const query = sql`
        UPDATE nodes
        SET attrs = json_set(coalesce(attrs, '{}'), '$.nameWidth', ${width}),
            updated_at = ${new Date().toISOString()},
            updated_by = ${workspace.userId},
            version_id = ${NeuronId.generate(NeuronId.Type.Version)}
        WHERE id = ${node.id}
      `.compile(workspace.schema);

      await workspace.mutate(query);
    },
  });

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
          .filter((field) => !hiddenFields[field.id])
          .sort((a, b) =>
            compareString(
              fieldIndexes[a.id] ?? a.index,
              fieldIndexes[b.id] ?? b.index,
            ),
          ),
        hideField: (id: string) => {
          if (hiddenFields[id]) {
            return;
          }

          setHiddenFields({ ...hiddenFields, [id]: 1 });
          updateHiddenFieldMutation.mutate({ fieldId: id, hide: true });
        },
        showField: (id: string) => {
          if (!hiddenFields[id]) {
            return;
          }

          const newHiddenFields = { ...hiddenFields };
          delete newHiddenFields[id];
          setHiddenFields(newHiddenFields);
          updateHiddenFieldMutation.mutate({ fieldId: id, hide: false });
        },
        getNameWidth: () => nameWidth,
        resizeName: (width: number) => {
          setNameWidth(width);
          updateNameWidthMutation.mutate(width);
        },
        getFieldWidth: (id: string, type: FieldType) => {
          return fieldWidths[id] ?? getDefaultFieldWidth(type);
        },
        resizeField: (id, width) => {
          setFieldWidths({ ...fieldWidths, [id]: width });
          updateFieldWidthsMutation.mutate({ fieldId: id, width });
        },
        moveField: (id, after) => {
          // const field = database.fields.find((f) => f.id === id);
          // if (!field) {
          //   return;
          // }
          // const sortedFields = [...database.fields].sort((a, b) =>
          //   compareString(
          //     fieldIndexes[a.id] ?? a.index,
          //     fieldIndexes[b.id] ?? b.index,
          //   ),
          // );
          // if (sortedFields.length <= 1) {
          //   return;
          // }
          // let beforeIndex: string | null = null;
          // let afterIndex: string | null = null;
          // if (after === 'name') {
          //   const firstField = sortedFields[0];
          //   if (firstField.id === id) {
          //     return;
          //   }
          //   afterIndex = firstField.index;
          // } else {
          //   const afterFieldArrayIndex = sortedFields.findIndex(
          //     (f) => f.id === after,
          //   );
          //   if (afterFieldArrayIndex === -1) {
          //     return;
          //   }
          //   beforeIndex = sortedFields[afterFieldArrayIndex].index;
          //   afterIndex =
          //     afterFieldArrayIndex < sortedFields.length - 1
          //       ? sortedFields[afterFieldArrayIndex + 1].index
          //       : null;
          // }
          // const newIndex = generateNodeIndex(beforeIndex, afterIndex);
          // setFieldIndexes({
          //   ...fieldIndexes,
          //   [id]: newIndex,
          // });
          // updateFieldIndexesMutation.mutate({ fieldId: id, index: newIndex });
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
