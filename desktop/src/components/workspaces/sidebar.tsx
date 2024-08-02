import React from "react";
import {SidebarHeader} from "@/components/workspaces/sidebar-header";
import {cn} from "@/lib/utils";
import {Icon} from "@/components/ui/icon";
import {SidebarSpaces} from "@/components/workspaces/sidebar-spaces";

interface LayoutItem {
  name: string;
  alias: string;
  icon: string;
}

const layouts: LayoutItem[] = [
  {
    name: 'Chats',
    alias: 'chat',
    icon: 'chat-1-line',
  },
  {
    name: 'Spaces',
    alias: 'space',
    icon: 'apps-line',
  }
];

export const Sidebar = () => {
  const currentLayout = 'spaces';

  return (
    <div className="grid h-full max-h-screen w-full grid-cols-[4rem_1fr] grid-rows-[auto_1fr_auto] border-r border-gray-200">
      <div className="col-span-2 h-12">
        <SidebarHeader />
      </div>
      <ul className="mt-2 w-16 border-r border-gray-100 px-1">
        {layouts.map((layout) => {
          return (
            <li
              role="presentation"
              key={layout.alias}
              className={cn(
                'relative mb-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md p-2 hover:bg-gray-100',
                currentLayout === layout.alias && 'bg-gray-100',
              )}
              onClick={() => {

              }}
            >
              <Icon
                name={layout.icon}
                className={cn(
                  'h-5 w-5',
                  currentLayout === layout.alias
                    ? 'font-bold shadow-sm'
                    : 'text-muted-foreground',
                )}
              />
              <span className="py-0.5 text-xs text-muted-foreground">
              {layout.name}
            </span>
            </li>
          );
        })}
      </ul>
      <div className="relative mt-2 max-h-full flex-grow overflow-hidden px-1">
        <SidebarSpaces />
      </div>
    </div>
  )
}