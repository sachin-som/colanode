import { match } from 'ts-pattern';
import { FolderContext } from '@/renderer/contexts/folder';
import { FolderLayoutType } from '@/types/folders';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useInfiniteQuery } from '@/renderer/hooks/use-infinite-query';
import { GridLayout } from '@/renderer/components/folders/grids/grid-layout';
import { ListLayout } from '@/renderer/components/folders/lists/list-layout';
import { GalleryLayout } from '@/renderer/components/folders/galleries/gallery-layout';
import { getIdType, IdType } from '@/lib/id';

const FILES_PER_PAGE = 100;

interface FolderFilesProps {
  id: string;
  name: string;
  layout: FolderLayoutType;
}

export const FolderFiles = ({ id, name, layout }: FolderFilesProps) => {
  const workspace = useWorkspace();
  const { data } = useInfiniteQuery({
    initialPageInput: {
      type: 'file_list',
      userId: workspace.userId,
      parentId: id,
      count: FILES_PER_PAGE,
      page: 0,
    },
    getNextPageInput: (page, pages) => {
      if (page > pages.length) {
        return undefined;
      }

      const lastPage = pages[page - 1];
      if (lastPage.length < FILES_PER_PAGE) {
        return undefined;
      }

      return {
        type: 'file_list',
        userId: workspace.userId,
        parentId: id,
        count: FILES_PER_PAGE,
        page: page + 1,
      };
    },
  });

  const files = data?.flatMap((page) => page) ?? [];

  return (
    <FolderContext.Provider
      value={{
        id,
        name,
        files,
        onClick: () => {
          console.log('onClick');
        },
        onDoubleClick: (_, id) => {
          const idType = getIdType(id);

          if (idType === IdType.Folder) {
            workspace.navigateToNode(id);
          } else if (idType === IdType.File) {
            workspace.openModal(id);
          }
        },
        onMove: () => {},
      }}
    >
      {match(layout)
        .with('grid', () => <GridLayout />)
        .with('list', () => <ListLayout />)
        .with('gallery', () => <GalleryLayout />)
        .exhaustive()}
    </FolderContext.Provider>
  );
};
