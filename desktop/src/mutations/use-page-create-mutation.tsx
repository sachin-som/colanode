import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

interface PageCreateMutationInput {
  spaceId: string;
  name: string;
}

export const usePageCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: PageCreateMutationInput) => {
      const siblingsQuery = workspace.schema
        .selectFrom('nodes')
        .where('parent_id', '=', input.spaceId)
        .selectAll()
        .compile();

      const result = await workspace.query(siblingsQuery);
      const siblings = result.rows;
      const maxIndex =
        siblings.length > 0
          ? siblings.sort((a, b) => compareString(a.index, b.index))[
              siblings.length - 1
            ].index
          : null;

      const id = NeuronId.generate(NeuronId.Type.Page);
      const index = generateNodeIndex(maxIndex, null);
      const insertPageQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id,
          type: NodeTypes.Page,
          parent_id: input.spaceId,
          index,
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertPageAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: id,
            type: AttributeTypes.Name,
            key: '1',
            text_value: input.name,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([insertPageQuery, insertPageAttributesQuery]);
      return id;
    },
  });
};
