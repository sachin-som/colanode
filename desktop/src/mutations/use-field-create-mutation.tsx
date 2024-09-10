import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface FieldCreateMutationInput {
  databaseId: string;
  name: string;
  dataType: string;
}

export const useFieldCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (values: FieldCreateMutationInput) => {
      const lastFieldQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and({
            parent_id: values.databaseId,
            type: NodeTypes.Field,
          }),
        )
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastFieldQuery);
      const lastChild =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastChild?.index ? lastChild.index : null;

      const fieldId = NeuronId.generate(NeuronId.Type.Field);
      const insertFieldQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: fieldId,
          type: NodeTypes.Field,
          parent_id: values.databaseId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertFieldAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: fieldId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: values.name,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: fieldId,
            type: AttributeTypes.DataType,
            key: '1',
            text_value: values.dataType,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([insertFieldQuery, insertFieldAttributesQuery]);
    },
  });
};
