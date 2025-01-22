import { useFloating, shift, offset } from '@floating-ui/react';
import { GripVertical, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
// @ts-ignore
import { __serializeForClipboard } from '@tiptap/pm/view';
import { Editor } from '@tiptap/react';

interface ActionMenuProps {
  editor: Editor | null;
}

const LEFT_MARGIN = 45;

type MenuState = {
  show: boolean;
  pmNode?: ProseMirrorNode;
  domNode?: HTMLElement;
  pos?: number;
  rect?: DOMRect;
};

export const ActionMenu = ({ editor }: ActionMenuProps) => {
  const view = useRef(editor?.view!);
  const [menuState, setMenuState] = useState<MenuState>({
    show: false,
  });

  const { refs, floatingStyles } = useFloating({
    placement: 'left',
    middleware: [offset(-10), shift()],
  });

  useEffect(() => {
    if (menuState.rect) {
      refs.setPositionReference({
        getBoundingClientRect: () => menuState.rect!,
        contextElement: menuState.domNode!,
      });
    }
  }, [menuState.rect, menuState.domNode]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const editorBounds = view.current.dom.getBoundingClientRect();
      const mouseOverEditor =
        event.clientX > editorBounds.left - LEFT_MARGIN &&
        event.clientX < editorBounds.right &&
        event.clientY > editorBounds.top &&
        event.clientY < editorBounds.bottom;

      if (!mouseOverEditor) {
        setMenuState({
          show: false,
        });
        return;
      }

      const coords = {
        left: Math.max(event.clientX, editorBounds.left),
        top: event.clientY,
      };

      const pos = view.current.posAtCoords(coords);
      if (!pos) {
        setMenuState({
          show: false,
        });
        return;
      }

      // Find the nearest block parent at the current horizontal position
      let currentPos = pos.pos;
      let pmNode = null;
      let domNode = null;
      while (currentPos >= 0) {
        const node = view.current.state.doc.nodeAt(currentPos);
        if (node?.isBlock) {
          const nodeDOM = view.current.nodeDOM(currentPos) as HTMLElement;
          const nodeDOMElement =
            nodeDOM instanceof HTMLElement
              ? nodeDOM
              : ((nodeDOM as Node)?.parentElement as HTMLElement);
          if (nodeDOMElement) {
            const nodeRect = nodeDOMElement.getBoundingClientRect();
            // Check if the mouse is horizontally aligned with this block
            if (
              event.clientX > nodeRect.left - LEFT_MARGIN &&
              event.clientX < nodeRect.right
            ) {
              pmNode = node;
              domNode = nodeDOMElement;
              break;
            }
          }
        }
        currentPos--;
      }

      if (!pmNode || !domNode) {
        setMenuState({
          show: false,
        });
        return;
      }

      const rect = domNode.getBoundingClientRect();
      const menuRect = DOMRect.fromRect({
        x: rect.x - 10,
        y: rect.y,
        width: 0,
        height: rect.height,
      });

      setMenuState({
        show: true,
        pmNode,
        domNode,
        pos: currentPos,
        rect: menuRect,
      });
    };

    const handleScroll = () => {
      setMenuState({
        show: false,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [editor]);

  if (editor == null || !menuState.show) {
    return null;
  }

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="flex items-center text-muted-foreground p-1 mr-2"
    >
      <Plus
        className="size-4 cursor-pointer hover:text-primary"
        onClick={() => {
          if (menuState.pos === undefined || !menuState.domNode) {
            return;
          }

          editor
            .chain()
            .insertContentAt(menuState.pos, { type: 'paragraph' })
            .focus()
            .run();
        }}
      />
      <div
        draggable={true}
        onDragStart={(event) => {
          if (menuState.pos === undefined || !menuState.domNode) {
            return;
          }

          view.current.focus();
          view.current.dispatch(
            view.current.state.tr.setSelection(
              NodeSelection.create(view.current.state.doc, menuState.pos)
            )
          );

          const slice = view.current.state.selection.content();
          const { dom, text } = __serializeForClipboard(view.current, slice);

          event.dataTransfer.clearData();
          event.dataTransfer.effectAllowed = 'copyMove';
          event.dataTransfer.setData('text/html', dom.innerHTML);
          event.dataTransfer.setData('text/plain', text);
          event.dataTransfer.setDragImage(menuState.domNode, 0, 0);

          view.current.dragging = { slice, move: true };
        }}
        onDragEnd={() => {
          view.current.dispatch(
            view.current.state.tr.setSelection(
              TextSelection.create(view.current.state.doc, 1)
            )
          );

          view.current.dom.blur();
        }}
      >
        <GripVertical className="size-4 cursor-pointer hover:text-primary" />
      </div>
    </div>
  );
};
