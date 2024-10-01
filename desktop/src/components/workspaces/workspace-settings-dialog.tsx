import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { useWorkspace } from '@/contexts/workspace';
import { WorkspaceUpdate } from '@/components/workspaces/workspace-update';
import { WorkspaceUsers } from '@/components/workspaces/workspace-users';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogTitle } from '@radix-ui/react-dialog';

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceSettingsDialog = ({
  open,
  onOpenChange,
}: WorkspaceSettingsDialogProps) => {
  const workspace = useWorkspace();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="md:min-h-3/4 md:max-h-3/4 p-3 md:h-3/4 md:w-3/4 md:max-w-full"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Workspace Settings</DialogTitle>
        </VisuallyHidden>
        <Tabs
          defaultValue="info"
          className="grid h-full max-h-full grid-cols-[240px_minmax(0,1fr)] overflow-hidden"
        >
          <TabsList className="flex h-full max-h-full flex-col items-start justify-start gap-1 rounded-none border-r border-r-gray-100 bg-white pr-3">
            <div className="mb-1 flex h-10 w-full items-center justify-between bg-gray-50 p-1 text-foreground/80">
              <div className="flex items-center gap-2">
                <Avatar
                  id={workspace.id}
                  name={workspace.name}
                  avatar={workspace.avatar}
                  size="small"
                />
                <span>{workspace.name}</span>
              </div>
            </div>
            <TabsTrigger
              key={`tab-trigger-info`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="info"
            >
              <Icon name="information-line" className="mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger
              key={`tab-trigger-collaborators`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="users"
            >
              <Icon name="group-line" className="mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              key={`tab-trigger-delete`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="delete"
            >
              <Icon name="delete-bin-line" className="mr-2" />
              Delete
            </TabsTrigger>
          </TabsList>
          <div className="overflow-auto p-4">
            <TabsContent
              key="tab-content-info"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="info"
            >
              <WorkspaceUpdate />
            </TabsContent>
            <TabsContent
              key="tab-content-collaborators"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="users"
            >
              <WorkspaceUsers />
            </TabsContent>
            <TabsContent
              key="tab-content-delete"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="delete"
            >
              <p>Coming soon.</p>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
