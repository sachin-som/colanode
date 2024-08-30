import React from 'react';
import { MessageEditor } from '@/components/messages/message-editor';
import { JSONContent } from '@tiptap/core';
import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { buildMessageCreateNodes } from '@/lib/messages';
import { CreateNode } from '@/data/schemas/workspace';

interface MessageCreateProps {
  conversationId: string;
}

export const MessageCreate = ({ conversationId }: MessageCreateProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (content: JSONContent) => {
      const nodesToCreate: CreateNode[] = [];

      buildMessageCreateNodes(
        nodesToCreate,
        workspace.userId,
        workspace.id,
        conversationId,
        content,
      );

      const query = workspace.schema
        .insertInto('nodes')
        .values(nodesToCreate)
        .compile();

      await workspace.mutate(query);
    },
  });

  return (
    <div className="container mt-1 px-10">
      <div className="flex flex-col">
        <MessageEditor
          conversationId={conversationId}
          onSubmit={mutate}
          loading={isPending}
          canEdit={true}
          canSubmit={true}
        />
      </div>
      <div className="flex h-8 min-h-8 items-center text-xs text-muted-foreground"></div>
    </div>
  );
};
