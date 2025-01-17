import { ChatCreatePopover } from '@/renderer/components/chats/chat-create-popover';
import { ChatSidebarItem } from '@/renderer/components/chats/chat-sidebar-item';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { cn } from '@/shared/lib/utils';

export const LayoutSidebarChats = () => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'chat_list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    page: 0,
    count: 100,
  });

  const chats = data ?? [];

  return (
    <div className="group/sidebar-chats flex w-full min-w-0 flex-col p-2">
      <div className="flex items-center justify-between">
        <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70">
          Chats
        </div>
        <div className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-chats:opacity-100 flex items-center justify-center p-0">
          <ChatCreatePopover />
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        {chats.map((item) => (
          <button
            key={item.id}
            className={cn(
              'px-2 flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-7',
              workspace.isEntryActive(item.id) &&
                'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            )}
            onClick={() => {
              workspace.openInMain(item.id);
            }}
          >
            <ChatSidebarItem chat={item} />
          </button>
        ))}
      </div>
    </div>
  );
};
