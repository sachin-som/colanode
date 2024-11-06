import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { ModalHeader } from '@/renderer/components/workspaces/modals/modal-header';
import { ModalContent } from '@/renderer/components/workspaces/modals/modal-content';

interface ModalProps {
  nodeId: string;
  onClose: () => void;
}

export const Modal = ({ nodeId, onClose }: ModalProps) => {
  const [open, setOpen] = React.useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        onClose();
      }}
    >
      <DialogContent
        className="flex h-[calc(100vh-100px)] max-h-full w-8/12 max-w-full flex-col gap-1 overflow-hidden px-0.5 pt-2 md:w-8/12"
        aria-describedby={undefined}
      >
        <DialogTitle>
          <ModalHeader nodeId={nodeId} />
        </DialogTitle>
        <ModalContent nodeId={nodeId} />
      </DialogContent>
    </Dialog>
  );
};
