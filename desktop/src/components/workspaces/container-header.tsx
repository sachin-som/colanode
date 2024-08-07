import React from 'react';
import { Node } from '@/types/nodes';
import { Avatar } from '@/components/ui/avatar';
import { observer } from 'mobx-react-lite';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NodeTypes } from '@/lib/constants';
import { useWorkspace } from '@/contexts/workspace';
import { cn } from '@/lib/utils';

interface ContainerHeaderProps {
  node: Node;
  breadcrumbNodes: Node[];
}

const BreadcrumbNode = observer(({ node }: { node: Node }) => {
  const workspace = useWorkspace();
  const name = node.attrs.name ?? 'Untitled';
  const avatar = node.attrs.avatar;
  const isClickable = node.type !== NodeTypes.Space;

  return (
    <React.Fragment>
      <BreadcrumbItem
        className={cn(
          'flex items-center space-x-1',
          isClickable && 'hover:cursor-pointer hover:text-foreground',
        )}
        onClick={() => {
          if (isClickable) {
            workspace.navigateToNode(node.id);
          }
        }}
      >
        {avatar && (
          <Avatar size="small" id={node.id} name={name} avatar={avatar} />
        )}
        <span>{name}</span>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
    </React.Fragment>
  );
});

const DropdownNode = observer(({ node }: { node: Node }) => {
  const workspace = useWorkspace();
  const name = node.attrs.name ?? 'Untitled';

  return (
    <DropdownMenuItem
      onClick={() => {
        workspace.navigateToNode(node.id);
      }}
    >
      {name}
    </DropdownMenuItem>
  );
});

export const ContainerHeader = observer(
  ({ node, breadcrumbNodes }: ContainerHeaderProps) => {
    const nodeName = node.attrs.name ?? 'Untitled';
    const nodeAvatar = node.attrs.avatar;

    const showEllipsis = breadcrumbNodes.length > 2;
    const firstNodes = showEllipsis
      ? breadcrumbNodes.slice(0, 1)
      : breadcrumbNodes;
    const ellipsisNodes = showEllipsis ? breadcrumbNodes.slice(1, -1) : [];
    const lastNodes = showEllipsis ? breadcrumbNodes.slice(-1) : [];

    return (
      <Breadcrumb className="mx-1 flex h-12 items-center justify-between border-b-2 border-gray-100 p-2 text-foreground/80">
        <BreadcrumbList>
          {firstNodes.map((breadcrumbNode) => (
            <BreadcrumbNode key={breadcrumbNode.id} node={breadcrumbNode} />
          ))}
          {showEllipsis && (
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {ellipsisNodes.map((breadcrumbNode) => (
                    <DropdownNode
                      key={breadcrumbNode.id}
                      node={breadcrumbNode}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          )}
          {showEllipsis &&
            lastNodes.length > 0 &&
            lastNodes.map((breadcrumbNode) => (
              <BreadcrumbNode key={breadcrumbNode.id} node={breadcrumbNode} />
            ))}
          <BreadcrumbItem>
            {nodeAvatar && (
              <Avatar
                size="small"
                id={node.id}
                name={nodeName}
                avatar={nodeAvatar}
              />
            )}
            <span>{nodeName}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
);
