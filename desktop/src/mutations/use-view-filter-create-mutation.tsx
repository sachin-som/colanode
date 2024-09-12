import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface CreateViewFilterInput {
  viewId: string;
  fieldId: string;
  operator: string;
}

export const useViewFilterCreateMutation = () => {
  const workspace = useWorkspace();
  return useMutation({
    mutationFn: async (input: CreateViewFilterInput) => {
      const lastChildQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and({
            parent_id: input.viewId,
            type: NodeTypes.ViewFilter,
          }),
        )
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastChildQuery);
      const lastChild =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastChild?.index ? lastChild.index : null;

      const viewFilterId = NeuronId.generate(NeuronId.Type.ViewFilter);
      const insertViewFilterQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: viewFilterId,
          type: NodeTypes.ViewFilter,
          parent_id: input.viewId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertViewFilterAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: viewFilterId,
            type: AttributeTypes.FieldId,
            key: '1',
            foreign_node_id: input.fieldId,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: viewFilterId,
            type: AttributeTypes.Operator,
            key: '1',
            text_value: input.operator,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([
        insertViewFilterQuery,
        insertViewFilterAttributesQuery,
      ]);
      return viewFilterId;
    },
  });
};
