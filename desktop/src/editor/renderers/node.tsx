import React, { ReactElement } from 'react';
import { BlockquoteRenderer } from '@/editor/renderers/blockquote';
import { BulletListRenderer } from '@/editor/renderers/bullet-list';
import { CodeBLockRenderer } from '@/editor/renderers/code-block';
import { DocumentRenderer } from '@/editor/renderers/document';
import { HeadingRenderer } from '@/editor/renderers/heading';
import { ListItemRenderer } from '@/editor/renderers/list-item';
import { MessageRenderer } from '@/editor/renderers/message';
import { OrderedListRenderer } from '@/editor/renderers/ordered-list';
import { ParagraphRenderer } from '@/editor/renderers/paragraph';
import { TaskItemRenderer } from '@/editor/renderers/task-item';
import { TaskListRenderer } from '@/editor/renderers/task-list';
import { TextRenderer } from '@/editor/renderers/text';
import { NodeWithChildren } from '@/types/nodes';
import { match } from 'ts-pattern';

interface NodeRendererProps {
  node: NodeWithChildren;
  keyPrefix: string | null;
}

export const NodeRenderer = ({
  node,
  keyPrefix,
}: NodeRendererProps): ReactElement => {
  return match(node.type)
    .with('message', () => (
      <MessageRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('doc', () => <DocumentRenderer node={node} keyPrefix={keyPrefix} />)
    .with('text', () => <TextRenderer node={node} />)
    .with('paragraph', () => (
      <ParagraphRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('heading', () => (
      <HeadingRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('blockquote', () => (
      <BlockquoteRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('bulletList', () => (
      <BulletListRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('orderedList', () => (
      <OrderedListRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('listItem', () => (
      <ListItemRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('taskList', () => (
      <TaskListRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('taskItem', () => (
      <TaskItemRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('codeBlock', () => (
      <CodeBLockRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .otherwise(null);
};
