import React, { ReactElement } from 'react';
import { BlockquoteRenderer } from '@/editor/renderers/blockquote';
import { BulletListRenderer } from '@/editor/renderers/bullet-list';
import { CodeBlockRenderer } from '@/editor/renderers/code-block';
import { DocumentRenderer } from '@/editor/renderers/document';
import { Heading1Renderer } from '@/editor/renderers/heading1';
import { Heading2Renderer } from '@/editor/renderers/heading2';
import { Heading3Renderer } from '@/editor/renderers/heading3';
import { ListItemRenderer } from '@/editor/renderers/list-item';
import { MessageRenderer } from '@/editor/renderers/message';
import { OrderedListRenderer } from '@/editor/renderers/ordered-list';
import { ParagraphRenderer } from '@/editor/renderers/paragraph';
import { TaskItemRenderer } from '@/editor/renderers/task-item';
import { TaskListRenderer } from '@/editor/renderers/task-list';
import { TextRenderer } from '@/editor/renderers/text';
import { LocalNodeWithChildren } from '@/types/nodes';
import { match } from 'ts-pattern';

interface NodeRendererProps {
  node: LocalNodeWithChildren;
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
    .with('heading1', () => (
      <Heading1Renderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('heading2', () => (
      <Heading2Renderer node={node} keyPrefix={keyPrefix} />
    ))
    .with('heading3', () => (
      <Heading3Renderer node={node} keyPrefix={keyPrefix} />
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
      <CodeBlockRenderer node={node} keyPrefix={keyPrefix} />
    ))
    .otherwise(null);
};
