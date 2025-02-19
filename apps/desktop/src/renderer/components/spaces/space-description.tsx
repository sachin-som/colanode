import { useEffect, useRef } from 'react';

import { SmartTextarea } from '@/renderer/components/ui/smart-textarea';
import { LocalSpaceNode } from '@/shared/types/nodes';

interface SpaceDescriptionProps {
  space: LocalSpaceNode;
  readonly: boolean;
  onUpdate: (description: string) => void;
}

export const SpaceDescription = ({
  space,
  readonly,
  onUpdate,
}: SpaceDescriptionProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (readonly) return;

    const timeoutId = setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [readonly, textareaRef]);

  return (
    <SmartTextarea
      value={space.attributes.description ?? ''}
      readOnly={readonly}
      ref={textareaRef}
      onChange={(value) => {
        if (readonly) {
          return;
        }

        if (value === space.attributes.description) {
          return;
        }

        onUpdate(value);
      }}
      placeholder="No description"
    />
  );
};
