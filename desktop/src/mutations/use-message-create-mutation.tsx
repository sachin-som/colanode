import { useWorkspace } from '@/contexts/workspace';
import { mapContentsToEditorNodes } from '@/editor/mappers';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';
import { JSONContent } from '@tiptap/core';
import { LocalNode, NodeInsertInput } from '@/types/nodes';
import { buildNodeInsertMutation } from '@/lib/nodes';

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
        new Map<string, LocalNode>(),
      );

      if (editorNodes.length === 0) {
        return;
      }

      const nodeInsertInputs: NodeInsertInput[] = [
        {
          id: messageId,
          attributes: {
            type: NodeTypes.Message,
            parentId: input.conversationId,
            index: null,
          },
        },
      ];

      for (const node of editorNodes) {
        nodeInsertInputs.push({
          id: node.id,
          attributes: node.attributes,
        });
      }

      const query = buildNodeInsertMutation(
        workspace.schema,
        workspace.userId,
        nodeInsertInputs,
      );

      await workspace.mutate(query);
    },
  });
};
