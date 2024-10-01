import { useWorkspace } from '@/contexts/workspace';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildNodeInsertMutation } from '@/lib/nodes';
import { useMutation } from '@tanstack/react-query';

interface CreateChatInput {
  userId: string;
}

export const useChatCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: CreateChatInput) => {
      const existingChats = workspace.schema
        .selectFrom('nodes')
        .where('type', '=', NodeTypes.Chat)
        .where(
          'id',
          'in',
          workspace.schema
            .selectFrom('node_collaborators')
            .select('node_id')
            .where('collaborator_id', 'in', [workspace.userId, input.userId])
            .groupBy('node_id')
            .having(workspace.schema.fn.count('collaborator_id'), '=', 2),
        )
        .selectAll()
        .compile();

      const result = await workspace.query(existingChats);
      if (result.rows.length > 0) {
        const chat = result.rows[0];
        return chat.id;
      }

      const id = NeuronId.generate(NeuronId.Type.Chat);
      const insertChatQuery = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        {
          id: id,
          attributes: {
            type: NodeTypes.Chat,
          },
        },
      );

      const insertCollaboratorsQuery = workspace.schema
        .insertInto('node_collaborators')
        .values([
          {
            node_id: id,
            collaborator_id: workspace.userId,
            role: 'owner',
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: id,
            collaborator_id: input.userId,
            role: 'owner',
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();

      await workspace.mutate([insertChatQuery, insertCollaboratorsQuery]);
      return id;
    },
  });
};
