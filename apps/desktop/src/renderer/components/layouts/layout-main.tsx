import { EntryContainer } from '@/renderer/components/layouts/entry-container';
import { ContainerContext } from '@/renderer/contexts/container';

interface LayoutMainProps {
  entryId: string;
}

export const LayoutMain = ({ entryId }: LayoutMainProps) => {
  return (
    <ContainerContext.Provider value={{ entryId, mode: 'main' }}>
      <EntryContainer entryId={entryId} />
    </ContainerContext.Provider>
  );
};
