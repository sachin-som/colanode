import React from 'react';
import { RecordNode, UrlFieldNode } from '@/types/databases';
import { cn, isValidUrl } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icon } from '@/components/ui/icon';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { useMutation } from '@/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

interface RecordUrlValueProps {
  record: RecordNode;
  field: UrlFieldNode;
}

export const RecordUrlValue = ({ record, field }: RecordUrlValueProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const canEdit = true;
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
              mutate({
                input: {
                  type: 'node_attribute_delete',
                  nodeId: record.id,
                  attribute: field.id,
                  userId: workspace.userId,
                },
              });
            } else {
              mutate({
                input: {
                  type: 'node_attribute_set',
                  nodeId: record.id,
                  attribute: field.id,
                  value: newValue,
                  userId: workspace.userId,
                },
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
