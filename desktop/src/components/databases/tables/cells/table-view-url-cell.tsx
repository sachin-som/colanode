import React from 'react';
import isHotkey from 'is-hotkey';

import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { RecordNode, UrlField } from '@/types/databases';
import { sql } from 'kysely';
import { cn, isValidUrl } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icon } from '@/components/ui/icon';

const getUrlValue = (record: RecordNode, field: UrlField): string => {
  const attrs = record.attrs;

  if (!attrs) {
    return '';
  }

  const fieldValue = attrs[field.id];

  if (typeof fieldValue === 'string') {
    return fieldValue;
  }

  return '';
};

interface TableViewUrlCellProps {
  record: RecordNode;
  field: UrlField;
  className?: string;
}

export const TableViewUrlCell = ({
  record,
  field,
  className,
}: TableViewUrlCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: string) => {
      if (newValue.length > 0) {
        const query = sql`
          UPDATE nodes
          SET attrs = json_set(coalesce(attrs, '{}'), '$.${field.id}', ${newValue}),
              updated_at = ${new Date().toISOString()},
              updated_by = ${workspace.userId},
              version_id = ${NeuronId.generate(NeuronId.Type.Version)}
          WHERE id = ${record.id}
        `.compile(workspace.schema);

        await workspace.mutate(query);
      } else {
        const query = sql`
          UPDATE nodes
          SET attrs = json_remove(attrs, '$.${sql.ref(field.id)}'),
              updated_at = ${new Date().toISOString()},
              updated_by = ${workspace.userId},
              version_id = ${NeuronId.generate(NeuronId.Type.Version)}
          WHERE id = ${record.id} AND attrs IS NOT NULL
        `.compile(workspace.schema);

        await workspace.mutate(query);
      }
    },
  });

  const canEdit = true;

  const [text, setText] = React.useState<string>(
    getUrlValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getUrlValue(record, field) ?? '');
  }, [record.versionId]);

  const saveIfChanged = (current: string, previous: string | null) => {
    if (current.length && current !== previous) {
      mutate(current);
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
