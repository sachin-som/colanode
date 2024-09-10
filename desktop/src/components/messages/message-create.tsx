import React from 'react';
import { MessageEditor } from '@/components/messages/message-editor';
import { useMessageCreateMutation } from '@/mutations/use-message-create-mutation';

interface MessageCreateProps {
  conversationId: string;
}

export const MessageCreate = ({ conversationId }: MessageCreateProps) => {
  const { mutate, isPending } = useMessageCreateMutation();

  return (
    <div className="container mt-1 px-10">
      <div className="flex flex-col">
        <MessageEditor
          conversationId={conversationId}
          onSubmit={(content) => mutate({ conversationId, content })}
          loading={isPending}
          canEdit={true}
          canSubmit={true}
        />
      </div>
      <div className="flex h-8 min-h-8 items-center text-xs text-muted-foreground"></div>
    </div>
  );
};
