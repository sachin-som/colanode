import { SpaceCreateButton } from '@/renderer/components/spaces/space-create-button';
import { SpaceSidebarItem } from '@/renderer/components/spaces/space-sidebar-item';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

export const LayoutSidebarSpaces = () => {
  const workspace = useWorkspace();
  const canCreateSpace =
    workspace.role !== 'guest' && workspace.role !== 'none';

  const { data } = useQuery({
    type: 'space_list',
    userId: workspace.userId,
    parentId: workspace.id,
    page: 0,
    count: 100,
  });

  const spaces = data ?? [];

  return (
    <div className="group/sidebar-spaces flex w-full min-w-0 flex-col p-2">
      <div className="flex items-center justify-between">
        <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70">
          Spaces
        </div>
        {canCreateSpace && (
          <div className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-spaces:opacity-100 flex items-center justify-center p-0">
            <SpaceCreateButton />
          </div>
        )}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-1">
        {spaces.map((space) => (
          <SpaceSidebarItem space={space} key={space.id} />
        ))}
      </div>
    </div>
  );
};
