import React from 'react';
import { RecordNode, UrlFieldNode } from '@/types/databases';
import { cn, isValidUrl } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icon } from '@/components/ui/icon';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

interface RecordUrlValueProps {
  record: RecordNode;
  field: UrlFieldNode;
}

export const RecordUrlValue = ({ record, field }: RecordUrlValueProps) => {
  const { mutate: setNodeAttribute, isPending: isSettingNodeAttribute } =
    useNodeAttributeSetMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isSettingNodeAttribute || isDeletingNodeAttribute;
  const text = record.attributes[field.id];
  const isUrl = text.length > 0 && isValidUrl(text);

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger>
        <SmartTextInput
          value={text}
          readOnly={!canEdit || isPending}
          onChange={(newValue) => {
            if (isPending) return;
            if (!canEdit) return;

            if (newValue === text) {
              return;
            }

            if (newValue === null || newValue === '') {
              deleteNodeAttribute({
                nodeId: record.id,
                key: field.id,
              });
            } else {
              setNodeAttribute({
                nodeId: record.id,
                key: field.id,
                value: newValue,
              });
            }
          }}
          className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
        />
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(
          'flex w-full min-w-80 max-w-128 flex-row items-center justify-between gap-2 text-ellipsis',
          !isUrl && 'hidden',
        )}
      >
        <a
          className="text-blue-500 underline hover:cursor-pointer hover:text-blue-600"
          href={text}
          target="_blank"
          rel="noreferrer"
        >
          {text}
        </a>
        <Icon
          name="external-link-line"
          className="h-4 min-h-4 w-4 min-w-4 text-muted-foreground"
        />
      </HoverCardContent>
    </HoverCard>
  );
};
