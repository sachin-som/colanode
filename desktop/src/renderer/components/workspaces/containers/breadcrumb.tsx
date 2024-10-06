import React from 'react';
import {
  Breadcrumb as BreadcrumbWrapper,
  BreadcrumbEllipsis,
  BreadcrumbItem as BreadcrumbItemWrapper,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/renderer/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { NodeTypes } from '@/lib/constants';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { BreadcrumbItem } from '@/renderer/components/workspaces/containers/breadcrumb-item';
import { BreadcrumbItemPopover } from '@/renderer/components/workspaces/containers/breadcrumb-item-popover';
import { useQuery } from '@/renderer/hooks/use-query';

interface BreadcrumbProps {
  nodeId: string;
}

export const Breadcrumb = ({ nodeId }: BreadcrumbProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'breadcrumb_list',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const showEllipsis = data.length > 2;
  const visibleNodes = showEllipsis ? [data[0], data[data.length - 1]] : data;
  const ellipsisNodes = showEllipsis ? data.slice(1, -1) : [];

  const isClickable = (type: string) => type !== NodeTypes.Space;

  return (
    <BreadcrumbWrapper>
      <BreadcrumbList>
        {visibleNodes.map((breadcrumbNode, index) => (
          <React.Fragment key={breadcrumbNode.id}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItemWrapper
              onClick={() => {
                if (isClickable(breadcrumbNode.type)) {
                  workspace.navigateToNode(breadcrumbNode.id);
                }
              }}
            >
              {breadcrumbNode.id === nodeId ? (
                <BreadcrumbItemPopover node={breadcrumbNode}>
                  <BreadcrumbItem node={breadcrumbNode} />
                </BreadcrumbItemPopover>
              ) : (
                <BreadcrumbItem
                  node={breadcrumbNode}
                  className={
                    isClickable(breadcrumbNode.type)
                      ? 'hover:cursor-pointer hover:text-foreground'
                      : ''
                  }
                />
              )}
            </BreadcrumbItemWrapper>
            {showEllipsis && index === 0 && (
              <React.Fragment>
                <BreadcrumbSeparator />
                <BreadcrumbItemWrapper>
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
                        >
                          <BreadcrumbItem
                            node={ellipsisNode}
                            className={
                              isClickable(ellipsisNode.type)
                                ? 'hover:cursor-pointer hover:text-foreground'
                                : ''
                            }
                          />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItemWrapper>
              </React.Fragment>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </BreadcrumbWrapper>
  );
};
