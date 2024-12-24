import { LayoutMain } from '@/renderer/components/layouts/layout-main';
import { LayoutModal } from '@/renderer/components/layouts/layout-modal';
import { LayoutSidebar } from '@/renderer/components/layouts/layout-sidebar';

interface LayoutProps {
  main?: string | null;
  modal?: string | null;
}

export const Layout = ({ main, modal }: LayoutProps) => {
  return (
    <div className="w-screen min-w-screen h-screen min-h-screen flex flex-row">
      <LayoutSidebar />
      <main className="h-full max-h-screen w-full min-w-128 flex-grow overflow-hidden bg-white">
        {main && <LayoutMain entryId={main} />}
      </main>
      {modal && <LayoutModal entryId={modal} />}
    </div>
  );
};
