import { useWorkspace } from '@/contexts/workspace';
import { CreateNode, CreateNodeAttribute } from '@/data/schemas/workspace';
import { mapContentsToEditorNodes } from '@/editor/mappers';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { LocalNodeWithAttributes } from '@/types/nodes';
import { useMutation } from '@tanstack/react-query';
import { JSONContent } from '@tiptap/core';
import { CompiledQuery } from 'kysely';

interface MessageCreateMutationInput {
  conversationId: string;
  content: JSONContent;
}

export const useMessageCreateMutation = () => {
  const workspace = useWorkspace();
  return useMutation({
    mutationFn: async (input: MessageCreateMutationInput) => {
      const messageId = NeuronId.generate(NeuronId.Type.Message);
      const editorNodes = mapContentsToEditorNodes(
        input.content.content,
        messageId,
        new Map<string, LocalNodeWithAttributes>(),
      );

      if (editorNodes.length === 0) {
        return;
      }

      const nodesToCreate: CreateNode[] = [
        {
          id: messageId,
          type: NodeTypes.Message,
          parent_id: input.conversationId,
          index: null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        },
      ];
      const nodeAttributesToCreate: CreateNodeAttribute[] = [];

      for (const node of editorNodes) {
        nodesToCreate.push({
          id: node.id,
          type: node.type,
          parent_id: node.parentId,
          index: node.index,
          content: node.content != null ? JSON.stringify(node.content) : null,
          created_at: new Date().toISOString(),
          created_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        });

        for (const attribute of node.attributes) {
          nodeAttributesToCreate.push({
            node_id: node.id,
            type: attribute.type,
            key: attribute.key,
            text_value: attribute.textValue,
            number_value: attribute.numberValue,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          });
        }
      }

      const queries: CompiledQuery[] = [
        workspace.schema.insertInto('nodes').values(nodesToCreate).compile(),
      ];

      if (nodeAttributesToCreate.length > 0) {
        queries.push(
          workspace.schema
            .insertInto('node_attributes')
            .values(nodeAttributesToCreate)
            .compile(),
        );
      }

      await workspace.mutate(queries);
    },
  });
};
