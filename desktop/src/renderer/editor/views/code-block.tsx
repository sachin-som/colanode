import React from 'react';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import '@/renderer/styles/highlight.css';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import { Icon } from '@/renderer/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { defaultClasses } from '@/renderer/editor/classes';
import { languages } from '@/lib/lowlight';
import { cn } from '@/lib/utils';

export const CodeBlockNodeView = ({
  node,
  updateAttributes,
}: NodeViewProps) => {
  const language = node.attrs?.language ?? 'plaintext';
  const languageItem = languages.find((item) => item.code === language);
  const code = node.textContent ?? '';

  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  return (
    <NodeViewWrapper
      data-block-id={node.attrs.blockId}
      as="pre"
      className={defaultClasses.codeBlock}
    >
      <div className={defaultClasses.codeBlockHeader}>
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger className="flex cursor-pointer flex-row items-center gap-1 outline-none hover:text-foreground">
            <p>{languageItem?.name ?? ' '}</p>
            <Icon name="arrow-down-s-line" />
          </PopoverTrigger>
          <PopoverContent className="p-2">
            <Command className="max-h-80">
              <CommandInput placeholder="Search language..." />
              <CommandEmpty>No languages found.</CommandEmpty>
              <CommandList>
                <CommandGroup className="overflow-auto">
                  {languages.map((languageItem) => (
                    <CommandItem
                      key={languageItem.code}
                      value={`${languageItem.code} - ${languageItem.name}`}
                      onSelect={() => {
                        updateAttributes({
                          language: languageItem.code,
                        });
                        setOpen(false);
                      }}
                    >
                      {languageItem.name}
                      <Icon
                        name="check-line"
                        className={cn(
                          'ml-auto mr-2 h-4 w-4',
                          language === languageItem.code
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div
          className="flex cursor-pointer flex-row items-center gap-1"
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
            });
          }}
        >
          <Icon name="clipboard-line" />
          <p>{copied ? 'Copied' : 'Copy code'}</p>
        </div>
      </div>
      <code>
        <NodeViewContent />
      </code>
    </NodeViewWrapper>
  );
};
