import React from 'react';
import { LocalNode } from '@/types/nodes';

interface MessageReactionsProps {
  message: LocalNode;
  onReactionClick: (reaction: string) => void;
}

export const MessageReactions = ({
  message,
  onReactionClick,
}: MessageReactionsProps) => {
  const [openDialog, setOpenDialog] = React.useState(false);
  return (
    <React.Fragment>
      <div className="my-1 flex flex-row gap-2">
        <p>Message reactions here.</p>
      </div>
    </React.Fragment>
  );
};
