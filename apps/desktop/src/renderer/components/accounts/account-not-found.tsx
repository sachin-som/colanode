import React from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { Button } from '@/renderer/components/ui/button';
import { useQuery } from '@/renderer/hooks/use-query';
import { AccountContext } from '@/renderer/contexts/account';

export const AccountNotFound = () => {
  const navigate = useNavigate();
  const { data } = useQuery({
    type: 'account_list',
  });

  const accounts = data ?? [];
  return (
    <div className="grid h-screen min-h-screen w-full grid-cols-5">
      <div className="col-span-2 flex items-center justify-center bg-zinc-950">
        <h1 className="font-neotrax text-8xl text-white">404</h1>
      </div>
      <div className="col-span-3 flex items-center justify-center py-12">
        <div className="mx-auto grid w-96 gap-6">
          <div className="grid gap-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              You have been logged out or your login has expired
            </h1>
            {accounts.length > 0 ? (
              <React.Fragment>
                <p className="text-sm text-muted-foreground">
                  Continue with one of your existing accounts
                </p>
                <div className="flex flex-row items-center justify-center gap-4">
                  {accounts.map((account) => (
                    <AccountContext.Provider
                      key={account.id}
                      value={{
                        ...account,
                        openSettings: () => {},
                        openLogout: () => {},
                      }}
                    >
                      <div
                        className="w-full flex items-center gap-2 text-left text-sm border border-gray-100 rounded-lg p-2 hover:bg-gray-100 hover:cursor-pointer"
                        onClick={() => navigate(`/${account.id}`)}
                      >
                        <Avatar
                          className="size-8 rounded-lg"
                          id={account.id}
                          name={account.name}
                          avatar={account.avatar}
                        />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {account.name}
                          </span>
                          <span className="truncate text-xs">
                            {account.email}
                          </span>
                        </div>
                      </div>
                    </AccountContext.Provider>
                  ))}
                </div>
                <hr />
                <p className="text-sm text-muted-foreground">
                  Or login with your email
                </p>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  <Mail className="mr-2 size-4" />
                  Login
                </Button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="text-sm text-muted-foreground">
                  You need to login to continue
                </p>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  <Mail className="mr-2 size-4" />
                  Login
                </Button>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
