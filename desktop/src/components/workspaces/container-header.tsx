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

interface BreadcrumbNodeProps {
  node: Node;
  className?: string;
}

const BreadcrumbNode = observer(({ node, className }: BreadcrumbNodeProps) => {
  const name = node.attrs.name ?? 'Untitled';
  const avatar = node.attrs.avatar;

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {avatar && (
        <Avatar size="small" id={node.id} name={name} avatar={avatar} />
      )}
      <span>{name}</span>
    </div>
  );
});

interface ContainerHeaderProps {
  node: Node;
  breadcrumbNodes: Node[];
}

export const ContainerHeader = observer(
  ({ node, breadcrumbNodes }: ContainerHeaderProps) => {
    const workspace = useWorkspace();

    const showEllipsis = breadcrumbNodes.length > 2;
    const firstNodes = showEllipsis
      ? breadcrumbNodes.slice(0, 1)
      : breadcrumbNodes;
    const ellipsisNodes = showEllipsis ? breadcrumbNodes.slice(1, -1) : [];
    const lastNodes = showEllipsis ? breadcrumbNodes.slice(-1) : [];

    const isClickable = (node: Node) => node.type !== NodeTypes.Space;

    return (
      <Breadcrumb className="mx-1 flex h-12 items-center justify-between border-b-2 border-gray-100 p-2 text-foreground/80">
        <BreadcrumbList>
          {firstNodes.map((breadcrumbNode) => {
            return (
              <React.Fragment>
                <BreadcrumbItem
                  onClick={() => {
                    if (isClickable(breadcrumbNode)) {
                      workspace.navigateToNode(breadcrumbNode.id);
                    }
                  }}
                >
                  <BreadcrumbNode
                    key={breadcrumbNode.id}
                    node={breadcrumbNode}
                    className={
                      isClickable(breadcrumbNode)
                        ? 'hover:cursor-pointer hover:text-foreground'
                        : ''
                    }
                  />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            );
          })}
          {showEllipsis && (
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {ellipsisNodes.map((breadcrumbNode) => {
                    return (
                      <DropdownMenuItem
                        onClick={() => {
                          if (isClickable(breadcrumbNode)) {
                            workspace.navigateToNode(breadcrumbNode.id);
                          }
                        }}
                      >
                        <BreadcrumbNode
                          key={breadcrumbNode.id}
                          node={breadcrumbNode}
                          className={
                            isClickable(breadcrumbNode)
                              ? 'hover:cursor-pointer hover:text-foreground'
                              : ''
                          }
                        />
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          )}
          {showEllipsis &&
            lastNodes.length > 0 &&
            lastNodes.map((breadcrumbNode) => {
              return (
                <React.Fragment>
                  <BreadcrumbItem
                    onClick={() => {
                      if (isClickable(breadcrumbNode)) {
                        workspace.navigateToNode(breadcrumbNode.id);
                      }
                    }}
                  >
                    <BreadcrumbNode
                      key={breadcrumbNode.id}
                      node={breadcrumbNode}
                      className={
                        isClickable(breadcrumbNode)
                          ? 'hover:cursor-pointer hover:text-foreground'
                          : ''
                      }
                    />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </React.Fragment>
              );
            })}
          <BreadcrumbItem>
            <BreadcrumbNode node={node} />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
);
