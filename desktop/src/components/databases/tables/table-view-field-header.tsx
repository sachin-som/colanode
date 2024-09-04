import React from 'react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { getDefaultFieldWidth, getFieldIcon } from '@/lib/databases';
import { useDrag, useDrop } from 'react-dnd';
import { Resizable } from 're-resizable';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { FieldDeleteDialog } from '@/components/databases/fields/field-delete-dialog';
import { Field } from '@/types/databases';

interface TableViewFieldHeaderProps {
  field: Field;
  index: number;
}

export const TableViewFieldHeader = ({
  field,
  index,
}: TableViewFieldHeaderProps) => {
  const canEditDatabase = true;
  const canEditView = true;

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const [, dragRef] = useDrag<Field>({
    type: 'table-field-header',
    item: field,
    canDrag: () => canEditView,
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ index: number }>();
      if (!dropResult?.index) return;

      // view.updateFieldAttrs({
      //   ...item.attrs,
      //   order: dropResult.index,
      // });
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [dropMonitor, dropRef] = useDrop({
    accept: 'table-field-header',
    drop: () => ({
      index,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const divRef = React.useRef<HTMLDivElement>(null);
  const dragDropRef = dragRef(dropRef(divRef));

  const defaultWidth = getDefaultFieldWidth(field.type);

  return (
    <React.Fragment>
      <Resizable
        defaultSize={{
          width: defaultWidth,
          height: '2rem',
        }}
        minWidth={100}
        maxWidth={500}
        size={{ width: defaultWidth, height: '2rem' }}
        enable={{
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: canEditView,
          top: false,
          topLeft: false,
          topRight: false,
        }}
        handleClasses={{
          right: 'opacity-0 hover:opacity-100 bg-blue-300',
        }}
        handleStyles={{
          right: {
            width: '3px',
            right: '-3px',
          },
        }}
        onResizeStop={(e, direction, ref) => {
          // const newWidth = ref.offsetWidth;
          // view.updateFieldAttrs({
          //   ...viewField.attrs,
          //   width: newWidth,
          // });
        }}
      >
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50',
                {
                  'border-l-2 border-blue-300':
                    dropMonitor.isOver && dropMonitor.canDrop,
                },
              )}
              ref={dragDropRef as any}
            >
              <Icon name={getFieldIcon(field.type)} />
              <p>{field.name}</p>
            </div>
          </PopoverTrigger>
          <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
            <div className="p-1">
              <Input
                value={field.name}
                onChange={(e) => {
                  // setName(e.target.value);
                  // updateName(e.target.value);
                }}
              />
            </div>
            <Separator />
            {true && (
              <>
                <div
                  className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                  onClick={() => {
                    // eventBus.publish({
                    //   __typename: 'AddSortEvent',
                    //   field: viewField.field,
                    //   viewId: view.id,
                    //   direction: 'ASC',
                    // });
                  }}
                >
                  <Icon name="sort-asc" />
                  <span>Sort ascending</span>
                </div>

                <div
                  className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                  onClick={() => {
                    // eventBus.publish({
                    //   __typename: 'AddSortEvent',
                    //   field: viewField.field,
                    //   viewId: view.id,
                    //   direction: 'DESC',
                    // });
                  }}
                >
                  <Icon name="sort-desc" />
                  <span>Sort descending</span>
                </div>
              </>
            )}
            <div className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100">
              <Icon name="filter-line" />
              <span>Filter</span>
            </div>
            <Separator />
            {canEditView && (
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  // view.updateFieldAttrs({
                  //   ...viewField.attrs,
                  //   visible: false,
                  // });
                }}
              >
                <Icon name="eye-off-line" />
                <span>Hide in view</span>
              </div>
            )}
            {canEditDatabase && (
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  setShowDeleteDialog(true);
                }}
              >
                <Icon name="delete-bin-line" />
                <span>Delete field</span>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </Resizable>
      {showDeleteDialog && (
        <FieldDeleteDialog
          id={field.id}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      )}
    </React.Fragment>
  );
};
