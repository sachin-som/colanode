import { useQuery } from '@/renderer/hooks/use-query';
import { Header } from '@/renderer/components/ui/header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { ChatSidebarItem } from '@/renderer/components/chats/chat-sidebar-item';
import { ChatCreatePopover } from '@/renderer/components/chats/chat-create-popover';
import { cn } from '@/shared/lib/utils';

export const SidebarChats = () => {
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
    <div className="flex flex-col group/sidebar-spaces h-full px-2">
      <Header>
        <p className="font-medium text-muted-foreground flex-grow">Chats</p>
        <div className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-spaces:opacity-100 flex items-center justify-center p-0">
          <ChatCreatePopover />
        </div>
      </Header>
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
