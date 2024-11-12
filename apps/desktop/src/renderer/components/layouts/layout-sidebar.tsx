import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/renderer/components/ui/sidebar';

import { LayoutSidebarHeader } from '@/renderer/components/layouts/layout-sidebar-header';
import { LayoutSidebarSpaces } from '@/renderer/components/layouts/layout-sidebar-spaces';
import { LayoutSidebarChats } from '@/renderer/components/layouts/layout-sidebar-chats';
import { LayoutSidebarFooter } from '@/renderer/components/layouts/layout-sidebar-footer';

export const LayoutSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <LayoutSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <LayoutSidebarSpaces />
        <LayoutSidebarChats />
      </SidebarContent>
      <SidebarFooter>
        <LayoutSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
