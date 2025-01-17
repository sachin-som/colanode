import { Entry, EntryType } from '@colanode/core';
import React from 'react';

import { EntryBreadcrumbItem } from '@/renderer/components/layouts/entry-breadcrumb-item';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/renderer/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface EntryBreadcrumbProps {
  entry: Entry;
}

const isClickable = (type: EntryType) => type !== 'space';

export const EntryBreadcrumb = ({ entry }: EntryBreadcrumbProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery(
    {
      type: 'entry_tree_get',
      entryId: entry.id,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: entry.type !== 'chat',
    }
  );

  const entries = data?.length ? data : [entry];

  // Show ellipsis if we have more than 3 nodes (first + last two)
  const showEllipsis = entries.length > 3;

  // Get visible entries: first entry + last two entries
  const visibleEntries = showEllipsis
    ? [entries[0], ...entries.slice(-2)]
    : entries;

  // Get middle entries for ellipsis (everything except first and last two)
  const ellipsisEntries = showEllipsis ? entries.slice(1, -2) : [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visibleEntries.map((entry, index) => {
          if (!entry) {
            return null;
          }

          const isFirst = index === 0;
          const isClickableEntry = isClickable(entry.type);

          return (
            <React.Fragment key={entry.id}>
              {!isFirst && <BreadcrumbSeparator />}
              <BreadcrumbItem
                className={
                  isClickableEntry
                    ? 'hover:cursor-pointer hover:text-foreground'
                    : ''
                }
                onClick={() => {
                  if (isClickableEntry) {
                    workspace.openInMain(entry.id);
                  }
                }}
              >
                <EntryBreadcrumbItem entry={entry} />
              </BreadcrumbItem>
              {showEllipsis && isFirst && (
                <React.Fragment>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1">
                        <BreadcrumbEllipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {ellipsisEntries.map((ellipsisEntry) => {
                          const isClickableEllipsisEntry = isClickable(
                            ellipsisEntry.type
                          );
                          return (
                            <DropdownMenuItem
                              key={ellipsisEntry.id}
                              disabled={!isClickableEllipsisEntry}
                              onClick={() => {
                                if (isClickableEllipsisEntry) {
                                  workspace.openInMain(ellipsisEntry.id);
                                }
                              }}
                            >
                              <BreadcrumbItem
                                className={
                                  isClickableEllipsisEntry
                                    ? 'hover:cursor-pointer hover:text-foreground'
                                    : ''
                                }
                              >
                                <EntryBreadcrumbItem entry={ellipsisEntry} />
                              </BreadcrumbItem>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </React.Fragment>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
