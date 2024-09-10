import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
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

      const tableViewId = NeuronId.generate(NeuronId.Type.TableView);
      const insertTableViewQuery = workspace.schema
        .insertInto('nodes')
        .values({
          id: tableViewId,
          type: NodeTypes.TableView,
          parent_id: input.databaseId,
          index: generateNodeIndex(maxIndex, null),
          content: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      const insertTableViewNameQuery = workspace.schema
        .insertInto('node_attributes')
        .values({
          node_id: tableViewId,
          type: AttributeTypes.Name,
          key: '1',
          text_value: input.name,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .compile();

      await workspace.mutate([insertTableViewQuery, insertTableViewNameQuery]);
      return tableViewId;
    },
  });
};
