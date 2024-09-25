import { useWorkspace } from '@/contexts/workspace';
import { NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildNodeInsertMutation, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

interface TableViewCreateInput {
  databaseId: string;
  name: string;
}

export const useTableViewCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: TableViewCreateInput) => {
      const siblingsQuery = workspace.schema
        .selectFrom('nodes')
        .where((eb) =>
          eb.and([
            eb('parent_id', '=', input.databaseId),
            eb('type', 'in', ViewNodeTypes),
          ]),
        )
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

      const id = NeuronId.generate(NeuronId.Type.TableView);
      const query = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        {
          id: id,
          attributes: {
            type: NodeTypes.TableView,
            parentId: input.databaseId,
            index: generateNodeIndex(maxIndex, null),
            name: input.name,
          },
        },
      );

      await workspace.mutate(query);
      return id;
    },
  });
};
