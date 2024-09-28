import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { parseApiError } from '@/lib/axios';
import { useServerCreateMutation } from '@/mutations/use-server-create-mutation';

interface ServerCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServerCreateDialog = ({
  open,
  onOpenChange,
}: ServerCreateDialogProps) => {
  const { mutate, isPending } = useServerCreateMutation();
  const [domain, setDomain] = React.useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a server</DialogTitle>
          <DialogDescription>Add a custom server to login to</DialogDescription>
        </DialogHeader>
        <div className="flex-grow space-y-2 py-2 pb-4">
          <Label>Server Domain</Label>
          <Input
            placeholder="us.neuronapp.io"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              mutate(
                {
                  domain: domain,
                },
                {
                  onSuccess() {
                    onOpenChange(false);
                  },
                  onError: (error) => {
                    const apiError = parseApiError(error);
                    toast({
                      title: 'Failed to login',
                      description: apiError.message,
                      variant: 'destructive',
                    });
                  },
                },
              );
            }}
          >
            {isPending && <Spinner className="mr-1" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
