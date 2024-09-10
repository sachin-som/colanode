import React from 'react';
import isHotkey from 'is-hotkey';
import { RecordNode, UrlFieldNode } from '@/types/databases';
import { cn, isValidUrl } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icon } from '@/components/ui/icon';
import { useUpdateUrlFieldValueMutation } from '@/mutations/use-update-url-field-value-mutation';

const getUrlValue = (record: RecordNode, field: UrlFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface TableViewUrlCellProps {
  record: RecordNode;
  field: UrlFieldNode;
  className?: string;
}

export const TableViewUrlCell = ({
  record,
  field,
  className,
}: TableViewUrlCellProps) => {
  const { mutate, isPending } = useUpdateUrlFieldValueMutation();

  const canEdit = true;

  const [text, setText] = React.useState<string>(
    getUrlValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getUrlValue(record, field) ?? '');
  }, [record.versionId]);

  const saveIfChanged = (current: string, previous: string | null) => {
    if (current.length && current !== previous) {
      mutate({
        recordId: record.id,
        fieldId: field.id,
        value: current,
      });
    }
  };

  const isUrl = text.length > 0 && isValidUrl(text);

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger>
        <input
          value={text}
          readOnly={!canEdit || isPending}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => saveIfChanged(text, getUrlValue(record, field))}
          onKeyDown={(e) => {
            if (isHotkey('enter', e)) {
              saveIfChanged(text, getUrlValue(record, field));
              e.preventDefault();
            }
          }}
          className={cn(
            'flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text',
            className,
          )}
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
