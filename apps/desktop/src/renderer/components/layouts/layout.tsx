import { LayoutSidebar } from '@/renderer/components/layouts/layout-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@/renderer/components/ui/sidebar';
import { LayoutMain } from '@/renderer/components/layouts/layout-main';
import { LayoutModal } from '@/renderer/components/layouts/layout-modal';

interface LayoutProps {
  nodeId?: string | null;
  modal?: string | null;
}

export const Layout = ({ nodeId, modal }: LayoutProps) => {
  return (
    <SidebarProvider>
      <LayoutSidebar />
      <SidebarInset>
        <main className="h-full max-h-screen w-full min-w-128 flex-grow overflow-hidden bg-white">
          {nodeId && <LayoutMain nodeId={nodeId} />}
        </main>
        {modal && <LayoutModal nodeId={modal} />}
      </SidebarInset>
    </SidebarProvider>
  );
};
