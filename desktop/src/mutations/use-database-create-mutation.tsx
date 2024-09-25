import { useWorkspace } from '@/contexts/workspace';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildNodeInsertMutation, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

interface DatabaseCreateMutationInput {
  spaceId: string;
  name: string;
}

export const useDatabaseCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: DatabaseCreateMutationInput) => {
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

      const databaseId = NeuronId.generate(NeuronId.Type.Database);
      const tableViewId = NeuronId.generate(NeuronId.Type.TableView);
      const fieldId = NeuronId.generate(NeuronId.Type.Field);

      const query = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        [
          {
            id: databaseId,
            attributes: {
              type: NodeTypes.Database,
              parentId: input.spaceId,
              index: generateNodeIndex(maxIndex, null),
              name: input.name,
            },
          },
          {
            id: tableViewId,
            attributes: {
              type: NodeTypes.TableView,
              parentId: databaseId,
              index: generateNodeIndex(null, null),
              name: 'Default',
            },
          },
          {
            id: fieldId,
            attributes: {
              type: NodeTypes.Field,
              parentId: databaseId,
              index: generateNodeIndex(null, null),
              name: 'Comment',
              dataType: 'text',
            },
          },
        ],
      );

      await workspace.mutate(query);
      return databaseId;
    },
  });
};
