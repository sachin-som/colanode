import React from 'react';
import { RecordNode, UrlFieldNode } from '@/types/databases';
import { cn, isValidUrl } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icon } from '@/components/ui/icon';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

const getUrlValue = (record: RecordNode, field: UrlFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface TableViewUrlCellProps {
  record: RecordNode;
  field: UrlFieldNode;
}

export const TableViewUrlCell = ({ record, field }: TableViewUrlCellProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;
  const text = getUrlValue(record, field);
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
                type: field.id,
                key: '1',
              });
            } else {
              upsertNodeAttribute({
                nodeId: record.id,
                type: field.id,
                key: '1',
                numberValue: 1,
                textValue: newValue,
                foreignNodeId: null,
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
