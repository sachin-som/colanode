import React from 'react';
import { useInfiniteQuery } from '@/renderer/hooks/use-infinite-query';
import { Separator } from '@/components/ui/separator';
import { WorkspaceUserInvite } from '@/components/workspaces/workspace-user-invite';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { InView } from 'react-intersection-observer';
import { WorkspaceUserRoleDropdown } from '@/components/workspaces/workspace-user-role-dropdown';
import { WorkspaceRole } from '@/types/workspaces';
import { useWorkspace } from '@/contexts/workspace';

const USERS_PER_PAGE = 50;

export const WorkspaceUsers = () => {
  const workspace = useWorkspace();

  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      initialPageInput: {
        type: 'workspace_user_list',
        page: 0,
        count: USERS_PER_PAGE,
        userId: workspace.userId,
      },
      getNextPageInput(page, pages) {
        if (page > pages.length) {
          return undefined;
        }

        const lastPage = pages[page - 1];
        if (lastPage.length < USERS_PER_PAGE) {
          return undefined;
        }

        return {
          type: 'workspace_user_list',
          page: page,
          count: USERS_PER_PAGE,
          userId: workspace.userId,
        };
      },
    });

  if (isPending) {
    return null;
  }

  const users = data?.flatMap((page) => page) ?? [];
  return (
    <div className="flex flex-col space-y-4">
      <WorkspaceUserInvite />
      <Separator />
      <div>
        <p>Users</p>
        <p className="text-sm text-muted-foreground">
          The list of all users on the workspaces
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {users.map((user) => {
          const name: string = user.attributes.name ?? 'Unknown';
          const email: string = user.attributes.email ?? ' ';
          const avatar: string | null | undefined = user.attributes.avatar;
          const role: WorkspaceRole = user.attributes.role;
          const accountId: string = user.attributes.accountId;

          if (!accountId || !role) {
            return null;
          }

          return (
            <div key={user.id} className="flex items-center space-x-3">
              <Avatar id={user.id} name={name} avatar={avatar} />
              <div className="flex-grow">
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
              <WorkspaceUserRoleDropdown accountId={accountId} value={role} />
            </div>
          );
        })}
        <div className="flex items-center justify-center space-x-3">
          {isFetchingNextPage && <Spinner />}
        </div>
        <InView
          rootMargin="200px"
          onChange={(inView) => {
            if (inView && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
        ></InView>
      </div>
    </div>
  );
};
