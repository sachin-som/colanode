import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

interface BoardViewCreateInput {
  databaseId: string;
  name: string;
}

export const useBoardViewCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: BoardViewCreateInput) => {
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

      const boardViewId = NeuronId.generate(NeuronId.Type.BoardView);
      const insertBoardViewQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: boardViewId,
          type: NodeTypes.BoardView,
          parent_id: input.databaseId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertBoardViewNameQuery = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: boardViewId,
          type: AttributeTypes.Name,
          key: '1',
          text_value: input.name,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate([insertBoardViewQuery, insertBoardViewNameQuery]);
      return boardViewId;
    },
  });
};
