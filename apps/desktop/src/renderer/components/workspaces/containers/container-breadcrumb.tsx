import React from 'react';
import { Node, NodeTypes } from '@colanode/core';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/renderer/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { ContainerBreadcrumbItem } from '@/renderer/components/workspaces/containers/container-breadcrumb-item';

interface ContainerBreadcrumbProps {
  nodes: Node[];
}

const isClickable = (type: string) =>
  type !== NodeTypes.Space && type !== NodeTypes.Message;

export const ContainerBreadcrumb = ({ nodes }: ContainerBreadcrumbProps) => {
  const workspace = useWorkspace();

  // Show ellipsis if we have more than 3 nodes (first + last two)
  const showEllipsis = nodes.length > 3;

  // Get visible nodes: first node + last two nodes
  const visibleNodes = showEllipsis ? [nodes[0], ...nodes.slice(-2)] : nodes;

  // Get middle nodes for ellipsis (everything except first and last two)
  const ellipsisNodes = showEllipsis ? nodes.slice(1, -2) : [];

  return (
    <Breadcrumb className="flex-grow">
      <BreadcrumbList>
        {visibleNodes.map((node, index) => (
          <React.Fragment key={node.id}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem
              onClick={() => {
                if (isClickable(node.type)) {
                  workspace.navigateToNode(node.id);
                }
              }}
            >
              <ContainerBreadcrumbItem node={node} />
            </BreadcrumbItem>
            {showEllipsis && index === 0 && (
              <React.Fragment>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <BreadcrumbEllipsis className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {ellipsisNodes.map((ellipsisNode) => (
                        <DropdownMenuItem
                          key={ellipsisNode.id}
                          onClick={() => {
                            if (isClickable(ellipsisNode.type)) {
                              workspace.navigateToNode(ellipsisNode.id);
                            }
                          }}
                          disabled={!isClickable(ellipsisNode.type)}
                        >
                          <BreadcrumbItem
                            className={
                              isClickable(ellipsisNode.type)
                                ? 'hover:cursor-pointer hover:text-foreground'
                                : ''
                            }
                          >
                            <ContainerBreadcrumbItem node={ellipsisNode} />
                          </BreadcrumbItem>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              </React.Fragment>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
