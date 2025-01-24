import { useQuery } from '@/renderer/hooks/use-query';
import { Header } from '@/renderer/components/ui/header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { SpaceCreateButton } from '@/renderer/components/spaces/space-create-button';
import { SpaceSidebarItem } from '@/renderer/components/spaces/space-sidebar-item';

export const SidebarSpaces = () => {
  const workspace = useWorkspace();
  const canCreateSpace =
    workspace.role !== 'guest' && workspace.role !== 'none';

  const { data } = useQuery({
    type: 'space_list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    parentId: workspace.id,
    page: 0,
    count: 100,
  });

  const spaces = data ?? [];

  return (
    <div className="flex flex-col group/sidebar-spaces h-full px-2">
      <Header>
        <p className="font-medium text-muted-foreground flex-grow">Spaces</p>
        {canCreateSpace && (
          <div className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-spaces:opacity-100 flex items-center justify-center p-0">
            <SpaceCreateButton />
          </div>
        )}
      </Header>
      <div className="flex w-full min-w-0 flex-col gap-1">
        {spaces.map((space) => (
          <SpaceSidebarItem space={space} key={space.id} />
        ))}
      </div>
    </div>
  );
};
