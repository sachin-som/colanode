import { useWorkspace } from '@/contexts/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
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
      const insertNodesQuery = workspace.schema
        .insertInto('nodes')
        .values([
          {
            id: databaseId,
            type: NodeTypes.Database,
            parent_id: input.spaceId,
            index: generateNodeIndex(maxIndex, null),
            content: null,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            id: tableViewId,
            type: NodeTypes.TableView,
            parent_id: databaseId,
            index: generateNodeIndex(null, null),
            content: null,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            id: fieldId,
            type: NodeTypes.Field,
            parent_id: databaseId,
            index: generateNodeIndex(null, null),
            content: null,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      const insertAttributesQuery = workspace.schema
        .insertInto('node_attributes')
        .values([
          {
            node_id: databaseId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: input.name,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: tableViewId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: 'Default',
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: fieldId,
            type: AttributeTypes.Name,
            key: '1',
            text_value: 'Comment',
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: fieldId,
            type: AttributeTypes.DataType,
            key: '1',
            text_value: 'text',
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([insertNodesQuery, insertAttributesQuery]);
      return databaseId;
    },
  });
};
