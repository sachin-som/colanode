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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NodeTypes } from '@/lib/constants';
import { useWorkspace } from '@/contexts/workspace';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
import { sql } from 'kysely';
import { mapNode } from '@/lib/nodes';
import { useQuery } from '@tanstack/react-query';
import { NodesTableSchema } from '@/data/schemas/workspace';

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

interface BreadcrumbNodeEditorProps {
  node: Node;
}

export const BreadcrumbNodeEditor = observer(
  ({ node }: BreadcrumbNodeEditorProps) => {
    const workspace = useWorkspace();
    const [name, setName] = React.useState(node.attrs.name ?? '');

    const handleNameChange = React.useMemo(
      () =>
        debounce(async (newName: string) => {
          const query = workspace.schema
            .updateTable('nodes')
            .set('attrs', sql`json_set(attrs, '$.name', ${newName})`)
            .where('id', '=', node.id)
            .compile();

          await workspace.executeQuery(query);
        }, 500),
      [node.id],
    );

    return (
      <div>
        <Input
          placeholder="Name"
          value={name}
          onChange={async (e) => {
            const newName = e.target.value;
            setName(newName);
            await handleNameChange(newName);
          }}
        />
      </div>
    );
  },
);

interface ContainerHeaderProps {
  node: Node;
}

export const ContainerHeader = observer(({ node }: ContainerHeaderProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    queryKey: [`breadcrumb:${node.id}`],
    queryFn: async ({ queryKey }) => {
      const query = sql<NodesTableSchema>`
        WITH RECURSIVE breadcrumb AS (
          SELECT *
          FROM nodes
          WHERE id = ${node.parentId}
          UNION ALL
          SELECT n.*
          FROM nodes n
          INNER JOIN breadcrumb b ON n.id = b.parent_id
        )
        SELECT * FROM breadcrumb;
      `.compile(workspace.schema);

      const queryId = queryKey[0];
      return await workspace.executeQueryAndSubscribe(queryId, query);
    },
  });

  if (isPending) {
    return null;
  }

  const breadcrumbNodes = data?.rows.map((row) => mapNode(row)) ?? [];
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
            <React.Fragment key={breadcrumbNode.id}>
              <BreadcrumbItem
                onClick={() => {
                  if (isClickable(breadcrumbNode)) {
                    workspace.navigateToNode(breadcrumbNode.id);
                  }
                }}
              >
                <BreadcrumbNode
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
                      key={breadcrumbNode.id}
                      onClick={() => {
                        if (isClickable(breadcrumbNode)) {
                          workspace.navigateToNode(breadcrumbNode.id);
                        }
                      }}
                    >
                      <BreadcrumbNode
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
              <React.Fragment key={breadcrumbNode.id}>
                <BreadcrumbItem
                  onClick={() => {
                    if (isClickable(breadcrumbNode)) {
                      workspace.navigateToNode(breadcrumbNode.id);
                    }
                  }}
                >
                  <BreadcrumbNode
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
        <BreadcrumbItem className="hover:cursor-pointer hover:text-foreground">
          <Popover>
            <PopoverTrigger>
              <BreadcrumbNode node={node} />
            </PopoverTrigger>
            <PopoverContent>
              <BreadcrumbNodeEditor node={node} />
            </PopoverContent>
          </Popover>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
});
