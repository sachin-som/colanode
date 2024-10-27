import React from 'react';
import { cn } from '@/lib/utils';
import { useDrag, useDrop } from 'react-dnd';
import { Resizable } from 're-resizable';
import { FieldNode } from '@/types/databases';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Separator } from '@/renderer/components/ui/separator';
import { FieldDeleteDialog } from '@/renderer/components/databases/fields/field-delete-dialog';
import { FieldRenameInput } from '@/renderer/components/databases/fields/field-rename-input';
import { useTableView } from '@/renderer/contexts/table-view';
import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { ArrowDownAz, ArrowDownZa, EyeOff, Filter, Trash2 } from 'lucide-react';

interface TableViewFieldHeaderProps {
  field: FieldNode;
}

export const TableViewFieldHeader = ({ field }: TableViewFieldHeaderProps) => {
  const tableView = useTableView();

  const canEditDatabase = true;
  const canEditView = true;

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const [, dragRef] = useDrag<FieldNode>({
    type: 'table-field-header',
    item: field,
    canDrag: () => canEditView,
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult<{ after: string }>();
      if (!dropResult?.after) return;

      tableView.moveField(field.id, dropResult.after);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [dropMonitor, dropRef] = useDrop({
    accept: 'table-field-header',
    drop: () => ({
      after: field.id,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const divRef = React.useRef<HTMLDivElement>(null);
  const dragDropRef = dragRef(dropRef(divRef));

  return (
    <React.Fragment>
      <Resizable
        defaultSize={{
          width: `${tableView.getFieldWidth(field.id, field.dataType)}px`,
          height: '2rem',
        }}
        minWidth={100}
        maxWidth={500}
        size={{
          width: `${tableView.getFieldWidth(field.id, field.dataType)}px`,
          height: '2rem',
        }}
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
        onResizeStop={(_e, _direction, ref) => {
          const newWidth = ref.offsetWidth;
          tableView.resizeField(field.id, newWidth);
        }}
      >
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50',
                dropMonitor.isOver && dropMonitor.canDrop
                  ? 'border-r-2 border-blue-300'
                  : 'border-r',
              )}
              ref={dragDropRef as any}
            >
              <FieldIcon type={field.dataType} className="size-4" />
              <p>{field.name}</p>
            </div>
          </PopoverTrigger>
          <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
            <FieldRenameInput field={field} />
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
                  <ArrowDownAz className="size-4" />
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
                  <ArrowDownZa className="size-4" />
                  <span>Sort descending</span>
                </div>
              </>
            )}
            <div className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100">
              <Filter className="size-4" />
              <span>Filter</span>
            </div>
            <Separator />
            {canEditView && (
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  tableView.hideField(field.id);
                }}
              >
                <EyeOff className="size-4" />
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
                <Trash2 className="size-4" />
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
