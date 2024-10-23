import { EditorCommand } from '@/types/editor';
import { NodeTypes } from '@/lib/constants';

export const FolderCommand: EditorCommand = {
  key: 'folder',
  name: 'Folder',
  description: 'Insert a nested folder',
  keywords: ['folder'],
  icon: 'folder-line',
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const { userId, documentId } = context;
    const output = await window.neuron.executeMutation({
      type: 'folder_create',
      name: 'Untitled',
      userId,
      parentId: documentId,
      generateIndex: false,
    });

    if (!output.id) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: NodeTypes.Folder,
        attrs: {
          id: output.id,
        },
      })
      .run();
  },
};
