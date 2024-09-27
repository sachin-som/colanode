import React from 'react';
import { Icon } from '@/components/ui/icon';
import { isValidEmail } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWorkspaceAccountsInviteMutation } from '@/mutations/use-workspace-accounts-invite-mutation';
import { Spinner } from '@/components/ui/spinner';
import { parseApiError } from '@/lib/axios';
import { toast } from '@/components/ui/use-toast';

export const WorkspaceUserInvite = () => {
  const [input, setInput] = React.useState('');
  const [emails, setEmails] = React.useState<string[]>([]);
  const { mutate, isPending } = useWorkspaceAccountsInviteMutation();

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-row items-center gap-2">
        <div>
          <p>Invite with email</p>
          <p className="text-sm text-muted-foreground">
            Write the email addresses of the people you want to invite
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <div className="flex h-9 w-full flex-row gap-2 rounded-md border border-input bg-background p-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground">
          {emails.map((email) => (
            <p
              key={email}
              className="flex h-full flex-row items-center gap-1 border border-gray-200 bg-gray-100 p-0.5 px-1 text-primary shadow"
            >
              <span>{email}</span>
              <Icon
                name="close-line"
                className="text-muted-foreground hover:cursor-pointer hover:text-primary"
                onClick={() => {
                  setEmails((emails) => emails.filter((e) => e !== email));
                }}
              />
            </p>
          ))}
          <input
            value={input}
            className="flex-grow px-1 focus-visible:outline-none"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter email addresses"
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (!input.length) {
                  return;
                }

                if (emails.includes(input)) {
                  return;
                }

                if (!isValidEmail(input)) {
                  return;
                }

                setEmails((emails) => [...emails, input]);
                setInput('');
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          className="w-32"
          disabled={isPending || emails.length == 0}
          onClick={() => {
            if (isPending) {
              return;
            }

            mutate(
              {
                emails: emails,
              },
              {
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
          Invite
        </Button>
      </div>
    </div>
  );
};
