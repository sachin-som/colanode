import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { Button } from '@/renderer/components/ui/button';
import { useQuery } from '@/renderer/hooks/use-query';
import { useAccount } from '@/renderer/contexts/account';

export const WorkspaceNotFound = () => {
  const navigate = useNavigate();
  const account = useAccount();

  const { data } = useQuery({
    type: 'workspace_list',
    accountId: account.id,
  });

  const workspaces = data ?? [];
  return (
    <div className="grid h-screen min-h-screen w-full grid-cols-5">
      <div className="col-span-2 flex items-center justify-center bg-zinc-950">
        <h1 className="font-neotrax text-8xl text-white">404</h1>
      </div>
      <div className="col-span-3 flex items-center justify-center py-12">
        <div className="mx-auto grid w-96 gap-6">
          <div className="grid gap-4 text-center">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Workspace not found
              </h1>
              <p className="text-sm font-semibold tracking-tight">
                It may have been deleted or your acces has been removed.
              </p>
            </div>
            <hr />
            {workspaces.length > 0 ? (
              <React.Fragment>
                <p className="text-sm text-muted-foreground">
                  Continue with one of your existing workspaces
                </p>
                <div className="flex flex-row items-center justify-center gap-4">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="w-full flex items-center gap-2 text-left text-sm border border-gray-100 rounded-lg p-2 hover:bg-gray-100 hover:cursor-pointer"
                      onClick={() => navigate(`/${account.id}/${workspace.id}`)}
                    >
                      <Avatar
                        className="size-8 rounded-lg"
                        id={workspace.id}
                        name={workspace.name}
                        avatar={workspace.avatar}
                      />
                      <p className="grid flex-1 text-left text-sm leading-tight truncate font-semibold">
                        {workspace.name}
                      </p>
                    </div>
                  ))}
                </div>
                <hr />
                <p className="text-sm text-muted-foreground">
                  Or create a new workspace
                </p>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/${account.id}/create`)}
                >
                  <Plus className="mr-2 size-4" />
                  Create new workspace
                </Button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="text-sm text-muted-foreground">
                  Create a new workspace
                </p>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/${account.id}/create`)}
                >
                  <Plus className="mr-2 size-4" />
                  Create new workspace
                </Button>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
