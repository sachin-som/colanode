import { EntryContainer } from '@/renderer/components/layouts/entry-container';
import { ContainerContext } from '@/renderer/contexts/container';

interface LayoutRightProps {
  entryId: string;
}

export const LayoutRight = ({ entryId }: LayoutRightProps) => {
  return (
    <ContainerContext.Provider value={{ entryId, mode: 'panel' }}>
      <EntryContainer entryId={entryId} />
    </ContainerContext.Provider>
  );
};
