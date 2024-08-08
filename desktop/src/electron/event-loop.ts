import { globalDatabase } from '@/electron/database/global';
import { Account } from '@/types/accounts';
import { Transaction } from '@/types/transactions';
import { Node } from '@/types/nodes';

export const initEventLoop = () => {
  setInterval(async () => {
    const accounts = await globalDatabase.getAccounts();
    await sendTransactions(accounts);
    await syncWorkspaces(accounts);
  }, 10000);
};

const sendTransactions = async (accounts: Account[]) => {
  const transactions = await globalDatabase.getTransactions(20);
  const groupedAccountTransactions = transactions.reduce(
    (acc, transaction) => {
      const account = accounts.find((a) => a.id === transaction.accountId);
      if (!account) {
        return acc;
      }

      const accountTransactions = acc.find((a) => a.account === account);
      if (accountTransactions) {
        accountTransactions.transactions.push(transaction);
      } else {
        acc.push({
          account,
          transactions: [transaction],
        });
      }

      return acc;
    },
    [] as { account: Account; transactions: Transaction[] }[],
  );

  for (const accountTransactions of groupedAccountTransactions) {
    const transactionIds = accountTransactions.transactions.map((t) => t.id);
    const response = await fetch('http://localhost:3000/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accountTransactions.account.token}`,
      },
      body: JSON.stringify({
        transactions: accountTransactions.transactions,
      }),
    });

    if (response.ok) {
      await globalDatabase.deleteTransactions(transactionIds);
    }
  }
};

const syncWorkspaces = async (accounts: Account[]) => {
  const workspaces = await globalDatabase.getWorkspaces();
  for (const workspace of workspaces) {
    const account = accounts.find((a) => a.id === workspace.accountId);
    if (!account) {
      continue;
    }

    const date = new Date();
    let url = `http://localhost:3000/v1/workspaces/${workspace.id}/nodes`;
    if (workspace.syncedAt) {
      url += `?from=${workspace.syncedAt.toISOString()}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.token}`,
      },
    });

    if (response.ok) {
      await globalDatabase.updateWorkspaceSyncedAt(workspace.id, date);
      const { nodes }: { nodes: Node[] } = await response.json();
      if (nodes.length == 0) {
        return;
      }

      const workspaceDatabase = globalDatabase.getWorkspaceDatabase(
        workspace.accountId,
        workspace.id,
      );

      if (!workspaceDatabase) {
        continue;
      }

      await workspaceDatabase.syncNodes(nodes);
    }
  }
};
