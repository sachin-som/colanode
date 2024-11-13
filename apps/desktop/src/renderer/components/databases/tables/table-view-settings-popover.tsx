import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { useView } from '@/renderer/contexts/view';
import { Separator } from '@/renderer/components/ui/separator';
import { useDatabase } from '@/renderer/contexts/database';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { FieldDeleteDialog } from '@/renderer/components/databases/fields/field-delete-dialog';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { ViewDeleteDialog } from '@/renderer/components/databases/view-delete-dialog';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { AvatarPopover } from '@/renderer/components/avatars/avatar-popover';
import { Button } from '@/renderer/components/ui/button';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Eye, EyeOff, Settings, Trash2 } from 'lucide-react';
import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';

export const TableViewSettingsPopover = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useView();

  const { mutate, isPending } = useMutation();

  const [open, setOpen] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [deleteFieldId, setDeleteFieldId] = React.useState<string | null>(null);

  return (
    <React.Fragment>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <div className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
            <Settings className="size-4" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="mr-4 flex w-[600px] flex-col gap-1.5 p-2">
          <div className="flex flex-row items-center gap-2">
            {database.canEdit ? (
              <AvatarPopover
                onPick={(avatar) => {
                  if (isPending) return;
                  if (avatar === view.avatar) return;

                  mutate({
                    input: {
                      type: 'node_attribute_set',
                      nodeId: view.id,
                      path: 'avatar',
                      value: avatar,
                      userId: workspace.userId,
                    },
                  });
                }}
              >
                <Button type="button" variant="outline" size="icon">
                  <Avatar
                    id={view.id}
                    name={view.name}
                    avatar={view.avatar}
                    className="h-6 w-6"
                  />
                </Button>
              </AvatarPopover>
            ) : (
              <Button type="button" variant="outline" size="icon">
                <Avatar
                  id={view.id}
                  name={view.name}
                  avatar={view.avatar}
                  className="h-6 w-6"
                />
              </Button>
            )}
            <SmartTextInput
              value={view.name}
              readOnly={!database.canEdit}
              onChange={(newName) => {
                if (isPending) return;
                if (newName === view.name) return;

                mutate({
                  input: {
                    type: 'node_attribute_set',
                    nodeId: view.id,
                    path: 'name',
                    value: newName,
                    userId: workspace.userId,
                  },
                });
              }}
            />
          </div>
          <Separator />
          <div className="flex flex-col gap-2 text-sm">
            <p className="my-1 font-semibold">Fields</p>
            {database.fields.map((field) => {
              const isHidden = !!view.fields.find(
                (f) => f.field.id === field.id
              );

              return (
                <div
                  key={field.id}
                  className={cn(
                    'flex flex-row items-center justify-between gap-2 p-0.5',
                    'cursor-pointer rounded-md hover:bg-gray-50'
                  )}
                >
                  <div className="flex flex-row items-center gap-2">
                    <FieldIcon type={field.type} className="size-4" />
                    <div>{field.name}</div>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          className={cn(
                            database.canEdit ? 'cursor-pointer' : 'opacity-50'
                          )}
                          onClick={() => {
                            if (!database.canEdit) return;

                            view.setFieldDisplay(field.id, !isHidden);
                          }}
                        >
                          {isHidden ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-row items-center gap-2">
                        {isHidden
                          ? 'Show field in this view'
                          : 'Hide field from this view'}
                      </TooltipContent>
                    </Tooltip>
                    {database.canEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Trash2
                            className={cn(
                              'size-4',
                              database.canEdit ? 'cursor-pointer' : 'opacity-50'
                            )}
                            onClick={() => {
                              setDeleteFieldId(field.id);
                              setOpen(false);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-row items-center gap-2">
                          Delete field from database
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {database.canEdit && (
            <React.Fragment>
              <Separator />
              <div className="flex flex-col gap-2 text-sm">
                <p className="my-1 font-semibold">Settings</p>
                <div
                  className="flex cursor-pointer flex-row items-center gap-1 rounded-md p-0.5 hover:bg-gray-50"
                  onClick={() => {
                    setOpenDelete(true);
                    setOpen(false);
                  }}
                >
                  <Trash2 className="size-4" />
                  <span>Delete view</span>
                </div>
              </div>
            </React.Fragment>
          )}
        </PopoverContent>
      </Popover>
      {deleteFieldId && (
        <FieldDeleteDialog
          id={deleteFieldId}
          open={!!deleteFieldId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteFieldId(null);
            }
          }}
        />
      )}
      {openDelete && (
        <ViewDeleteDialog
          id={view.id}
          open={openDelete}
          onOpenChange={setOpenDelete}
        />
      )}
    </React.Fragment>
  );
};
