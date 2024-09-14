import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface CreateViewSortInput {
  viewId: string;
  fieldId: string;
  direction: string;
}

export const useViewSortCreateMutation = () => {
  const workspace = useWorkspace();
  return useMutation({
    mutationFn: async (input: CreateViewSortInput) => {
      const lastViewSortQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and({
            parent_id: input.viewId,
            type: NodeTypes.ViewSort,
          }),
        )
        .selectAll()
        .orderBy('index', 'desc')
        .limit(1)
        .compile();

      const result = await workspace.query(lastViewSortQuery);
      const lastViewSort =
        result.rows && result.rows.length > 0 ? result.rows[0] : null;
      const maxIndex = lastViewSort?.index ? lastViewSort.index : null;

      const viewSortId = NeuronId.generate(NeuronId.Type.ViewSort);
      const insertViewSortQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: viewSortId,
          type: NodeTypes.ViewSort,
          parent_id: input.viewId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertViewSortAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: viewSortId,
            type: AttributeTypes.FieldId,
            key: '1',
            foreign_node_id: input.fieldId,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: viewSortId,
            type: AttributeTypes.Direction,
            key: '1',
            text_value: input.direction,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([
        insertViewSortQuery,
        insertViewSortAttributesQuery,
      ]);
      return viewSortId;
    },
  });
};
