const ACCOUNT_KEY = 'neuron-account';

interface Account {
  token: string;
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export function readAccount(): Account | null {
  const account = localStorage.getItem(ACCOUNT_KEY);
  if (!account)
    return null;

  return JSON.parse(account);
}

export function saveAccount(account: Account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export function deleteAccount() {
  localStorage.removeItem(ACCOUNT_KEY);
}
