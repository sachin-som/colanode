import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MessageReferenceNodeView } from '@/renderer/editor/views/message-reference';

export const MessageReferenceNode = Node.create({
  name: 'messageReference',
  topNode: true,
  content: 'block+',
  addAttributes() {
    return {
      id: {
        default: null,
      },
      messageId: {
        default: null,
      },
      name: {
        default: null,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['messageReference', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MessageReferenceNodeView, {
      as: 'messageReference',
    });
  },
});
