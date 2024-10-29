import React from 'react';
import {
  MessageEditor,
  MessageEditorRefProps,
} from '@/renderer/components/messages/message-editor';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { MessageNode } from '@/types/messages';
import { CircleX } from 'lucide-react';
import { editorHasContent } from '@/lib/editor';

interface MessageCreateProps {
  conversationId: string;
}

export interface MessageCreateRefProps {
  setReplyTo: (replyTo: MessageNode | null) => void;
}

export const MessageCreate = React.forwardRef<
  MessageCreateRefProps,
  MessageCreateProps
>(({ conversationId }, ref) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [hasContent, setHasContent] = React.useState<boolean>(false);
  const messageEditorRef = React.useRef<MessageEditorRefProps>(null);
  const [replyTo, setReplyTo] = React.useState<MessageNode | null>(null);

  React.useImperativeHandle(ref, () => ({
    setReplyTo: (replyTo) => {
      setReplyTo(replyTo);
      if (messageEditorRef.current) {
        messageEditorRef.current.focus();
      }
    },
  }));

  return (
    <div className="container mt-1 px-10">
      <div className="flex flex-col">
        {replyTo && (
          <div className="flex flex-row items-center justify-between rounded-t-lg border-b-2 bg-gray-100 p-2 text-foreground">
            <p className="text-sm">
              Replying to{' '}
              <span className="font-semibold">{replyTo.author.name}</span>
            </p>
            <button
              className="cursor-pointer"
              onClick={() => {
                setReplyTo(null);
              }}
            >
              <CircleX className="size-4" />
            </button>
          </div>
        )}
        <MessageEditor
          ref={messageEditorRef}
          conversationId={conversationId}
          onChange={(content) => {
            setHasContent(editorHasContent(content));
          }}
          onSubmit={(content) => {
            if (!editorHasContent(content)) {
              return;
            }

            const messageContent = content;
            if (replyTo) {
              messageContent.content.unshift({
                type: 'messageReference',
                attrs: {
                  id: replyTo.id,
                  name: replyTo.author.name,
                },
                content: replyTo.content,
              });
            }
            mutate({
              input: {
                type: 'message_create',
                conversationId: conversationId,
                content: messageContent,
                userId: workspace.userId,
              },
              onSuccess: () => {
                setReplyTo(null);
                if (messageEditorRef.current) {
                  messageEditorRef.current.focus();
                }
              },
            });
          }}
          loading={isPending}
          canEdit={true}
          canSubmit={hasContent}
        />
      </div>
      <div className="flex h-8 min-h-8 items-center text-xs text-muted-foreground"></div>
    </div>
  );
});
