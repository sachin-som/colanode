import { LayoutGrid, MessageCircle } from 'lucide-react';

import { SidebarMenuIcon } from '@/renderer/components/layouts/sidebars/sidebar-menu-icon';
import { SidebarMenuHeader } from '@/renderer/components/layouts/sidebars/sidebar-menu-header';
import { SidebarMenuFooter } from '@/renderer/components/layouts/sidebars/sidebar-menu-footer';

interface SidebarMenuProps {
  value: string;
  onChange: (value: string) => void;
}

export const SidebarMenu = ({ value, onChange }: SidebarMenuProps) => {
  return (
    <div className="flex flex-col h-full w-[65px] min-w-[65px] items-center bg-slate-100">
      <div className="h-8 w-full app-drag-region"></div>
      <SidebarMenuHeader />
      <div className="flex flex-col gap-1 mt-2 w-full p-2 items-center flex-grow">
        <SidebarMenuIcon
          icon={MessageCircle}
          onClick={() => {
            onChange('chats');
          }}
          isActive={value === 'chats'}
        />
        <SidebarMenuIcon
          icon={LayoutGrid}
          onClick={() => {
            onChange('spaces');
          }}
          isActive={value === 'spaces'}
        />
      </div>
      <SidebarMenuFooter />
    </div>
  );
};
