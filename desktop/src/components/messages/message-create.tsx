import React from 'react';
import { MessageEditor } from '@/components/messages/message-editor';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '@/contexts/workspace';
import { JSONContent } from '@tiptap/core';
import { Node } from '@/types/nodes';
import { NeuronId } from '@/lib/id';
import { NodeTypes } from '@/lib/constants';
import { buildNodes } from '@/editor/utils';

interface MessageCreateProps {
  nodeId: string;
}

export const MessageCreate = observer(({ nodeId }: MessageCreateProps) => {
  const workspace = useWorkspace();

  const handleSubmit = async (content: JSONContent) => {
    // Create a new message
    const message: Node = {
      id: NeuronId.generate(NeuronId.Type.Message),
      parentId: nodeId,
      type: NodeTypes.Message,
      content: [],
      workspaceId: workspace.id,
      attrs: {},
      createdAt: new Date(),
      createdBy: workspace.userNodeId,
      versionId: NeuronId.generate(NeuronId.Type.Version),
    };

    const childNodes = buildNodes(workspace, message, content.content, []);

    const newNodes = [message, ...childNodes];
    await workspace.addNodes(newNodes);
  };

  return (
    <div className="mt-1 px-10">
      <div className="flex flex-col">
        {/*{replyTo && conversationId !== user.id && (*/}
        {/*  <div className="flex flex-row items-center justify-between rounded-t-lg border-b-2 bg-gray-100 p-2 text-foreground">*/}
        {/*    <p className="text-sm">*/}
        {/*      Replying to{' '}*/}
        {/*      <span className="font-semibold">{replyTo.actor.name}</span>*/}
        {/*    </p>*/}
        {/*    <button*/}
        {/*      className="cursor-pointer"*/}
        {/*      onClick={() => {*/}
        {/*        setReplyTo(null);*/}
        {/*        if (messageEditorRef.current) {*/}
        {/*          messageEditorRef.current.focus();*/}
        {/*        }*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      <Icon name="close-circle-line" />*/}
        {/*    </button>*/}
        {/*  </div>*/}
        {/*)}*/}

        <MessageEditor
          nodeId={nodeId}
          onSubmit={handleSubmit}
          canEdit={true}
          canSubmit={true}
        />
      </div>
      <div className="flex h-8 min-h-8 items-center text-xs text-muted-foreground"></div>
    </div>
  );
});
