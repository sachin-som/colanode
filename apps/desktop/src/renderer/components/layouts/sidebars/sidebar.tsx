import React from 'react';

import { SidebarMenu } from '@/renderer/components/layouts/sidebars/sidebar-menu';
import { SidebarChats } from '@/renderer/components/layouts/sidebars/sidebar-chats';
import { SidebarSpaces } from '@/renderer/components/layouts/sidebars/sidebar-spaces';

export const Sidebar = () => {
  const [menu, setMenu] = React.useState('spaces');

  return (
    <div className="flex h-screen min-h-screen max-h-screen w-80 min-w-80 flex-row bg-slate-50">
      <SidebarMenu value={menu} onChange={setMenu} />
      <div className="min-h-0 flex-grow overflow-auto">
        {menu === 'spaces' && <SidebarSpaces />}
        {menu === 'chats' && <SidebarChats />}
      </div>
    </div>
  );
};
