import { LayoutSidebarChats } from '@/renderer/components/layouts/layout-sidebar-chats';
import { LayoutSidebarFooter } from '@/renderer/components/layouts/layout-sidebar-footer';
import { LayoutSidebarHeader } from '@/renderer/components/layouts/layout-sidebar-header';
import { LayoutSidebarSpaces } from '@/renderer/components/layouts/layout-sidebar-spaces';

export const LayoutSidebar = () => {
  return (
    <div className="flex h-screen min-h-screen max-h-screen w-64 min-w-64 flex-col bg-sidebar text-sidebar-foreground">
      <LayoutSidebarHeader />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        <LayoutSidebarSpaces />
        <LayoutSidebarChats />
      </div>
      <LayoutSidebarFooter />
    </div>
  );
};
