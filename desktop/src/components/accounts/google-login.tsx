import React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { GoogleIcon } from '@/components/ui/icons';
import { LoginOutput } from '@/types/accounts';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { toast } from '@/components/ui/use-toast';
import {axios, parseApiError} from "@/lib/axios";

interface GoogleLoginProps {
  onLogin: (output: LoginOutput) => void;
  clientId: string;
}

function GoogleLoginButton({ onLogin }: GoogleLoginProps) {
  const [isPending, setIsPending] = React.useState(false);

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setIsPending(true);
      try {

        const { data } = await axios.post<LoginOutput>(
          'v1/accounts/login/google',
          response,
        );

        onLogin(data);
      } catch (error) {
        const apiError = parseApiError(error);
        toast({
          title: 'Failed to login',
          description: apiError.message,
          variant: 'destructive',
        });
      } finally {
        setIsPending(false);
      }
    },
    flow: 'implicit',
  });

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isPending}
      className="w-full"
      onClick={() => login()}
    >
      {isPending ? (
        <Spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-4 w-4" />
      )}{' '}
      Google
    </Button>
  );
}

export function GoogleLogin({ onLogin, clientId }: GoogleLoginProps) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLoginButton onLogin={onLogin} clientId={clientId} />
    </GoogleOAuthProvider>
  );
}
