import React from 'react';
import { Dropzone } from '@/renderer/components/ui/dropzone';
import { Button } from '@/renderer/components/ui/button';
import { Icon } from '@/renderer/components/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { folderLayouts, FolderLayoutType } from '@/types/folders';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { FolderFiles } from '@/renderer/components/folders/folder-files';

interface FolderContainerProps {
  nodeId: string;
}

export const FolderContainer = ({ nodeId }: FolderContainerProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const [layout, setLayout] = React.useState<FolderLayoutType>('grid');
  const currentLayout =
    folderLayouts.find((l) => l.value === layout) ?? folderLayouts[0];

  const isDialogOpenedRef = React.useRef(false);

  const openFileDialog = async () => {
    if (isDialogOpenedRef.current) {
      return;
    }

    isDialogOpenedRef.current = true;
    const result = await window.neuron.openFileDialog({
      properties: ['openFile'],
      buttonLabel: 'Upload',
      title: 'Upload files to folder',
    });

    if (result.canceled) {
      isDialogOpenedRef.current = false;
      return;
    }

    mutate({
      input: {
        type: 'file_create',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        userId: workspace.userId,
        filePath: result.filePaths[0],
        parentId: nodeId,
      },
    });

    isDialogOpenedRef.current = false;
  };

  return (
    <Dropzone
      text="Drop files here to upload them in the folder"
      onDrop={(files) => {
        files.forEach((file) => console.log(file));
      }}
    >
      <div className="flex h-full max-h-full flex-col gap-4 overflow-y-auto px-10 pt-4">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <Button variant="outline" onClick={openFileDialog}>
              <Icon name="upload-line" className="mr-1" /> Upload
            </Button>
          </div>
          <div className="flex flex-row gap-2">
            <Button variant="outline" size="icon" disabled>
              <Icon name="filter-line" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Icon name={currentLayout?.icon} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-5 w-56">
                <DropdownMenuLabel>Layout</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {folderLayouts.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => setLayout(item.value)}
                  >
                    <div className="flex w-full flex-row items-center gap-2">
                      <Icon name={item.icon} />
                      <p className="flex-grow">{item.name}</p>
                      {layout === item.value && <Icon name="check-line" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <ScrollArea className="flex-grow">
          <FolderFiles id={nodeId} name="Folder" layout={layout} />
        </ScrollArea>
      </div>
      {/* <FolderUploads
        uploads={Object.values(uploads)}
        open={openUploads}
        setOpen={setOpenUploads}
      /> */}
    </Dropzone>
  );
};
