import React from 'react';
import { MessageEditor } from '@/components/messages/message-editor';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

interface MessageCreateProps {
  conversationId: string;
}

export const MessageCreate = ({ conversationId }: MessageCreateProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <div className="container mt-1 px-10">
      <div className="flex flex-col">
        <MessageEditor
          conversationId={conversationId}
          onSubmit={(content) => {
            mutate({
              input: {
                type: 'message_create',
                conversationId: conversationId,
                content: content,
                userId: workspace.userId,
              },
            });
          }}
          loading={isPending}
          canEdit={true}
          canSubmit={true}
        />
      </div>
      <div className="flex h-8 min-h-8 items-center text-xs text-muted-foreground"></div>
    </div>
  );
};
