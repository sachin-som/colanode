import { useWorkspace } from '@/contexts/workspace';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildNodeInsertMutation, generateNodeIndex } from '@/lib/nodes';
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
      const query = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        {
          id: id,
          attributes: {
            type: NodeTypes.Page,
            parentId: input.spaceId,
            index: index,
            name: input.name,
          },
        },
      );

      await workspace.mutate(query);
      return id;
    },
  });
};
