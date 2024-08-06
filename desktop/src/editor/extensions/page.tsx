import { Node } from '@tiptap/core';

export const PageNode = Node.create({
  name: 'page',
  topNode: true,
  content: 'block+',
});
