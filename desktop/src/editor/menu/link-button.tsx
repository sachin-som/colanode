import React from "react";
import { Editor } from '@tiptap/core';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const getUrlFromString = (str: string): string | null => {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes('.') && !str.includes(' ')) {
      return new URL(`https://${str}`).toString();
    }
  } catch (e) {
    return null;
  }

  return null;
};

interface LinkButtonProps {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const LinkButton = ({
  editor,
  isOpen,
  setIsOpen,
}: LinkButtonProps) => {
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger>
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100',
            editor.isActive('link') ? 'bg-gray-100' : 'bg-white',
          )}
        >
          <Icon name="link" />
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="z-[9999] min-w-0 p-1">
        <form
          className="flex flex-row items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget[0] as HTMLInputElement;
            const url = getUrlFromString(input.value);
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }

            setIsOpen(false);
          }}
        >
          <Input
            placeholder="Write or paste link"
            className="border-0"
            defaultValue={editor.getAttributes('link').href || ''}
          />
          {editor.getAttributes('link').href ? (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100"
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus().unsetLink().run();
                setIsOpen(false);
              }}
            >
              <Icon name="delete-bin-line" />
            </button>
          ) : (
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100"
            >
              <Icon name="check-line" />
            </button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
};
