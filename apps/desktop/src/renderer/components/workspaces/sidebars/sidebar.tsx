import {
  Sidebar as SidebarWrapper,
  SidebarContent as SidebarContentWrapper,
  SidebarFooter as SidebarFooterWrapper,
  SidebarHeader as SidebarHeaderWrapper,
  SidebarRail as SidebarRailWrapper,
} from '@/renderer/components/ui/sidebar';

import { SidebarHeader } from '@/renderer/components/workspaces/sidebars/sidebar-header';
import { SidebarSpaces } from '@/renderer/components/workspaces/sidebars/sidebar-spaces';
import { SidebarChats } from '@/renderer/components/workspaces/sidebars/sidebar-chats';
import { SidebarFooter } from '@/renderer/components/workspaces/sidebars/sidebar-footer';

export const Sidebar = () => {
  return (
    <SidebarWrapper collapsible="icon">
      <SidebarHeaderWrapper>
        <SidebarHeader />
      </SidebarHeaderWrapper>
      <SidebarContentWrapper>
        <SidebarSpaces />
        <SidebarChats />
      </SidebarContentWrapper>
      <SidebarFooterWrapper>
        <SidebarFooter />
      </SidebarFooterWrapper>
      <SidebarRailWrapper />
    </SidebarWrapper>
  );
};
