import {globalDatabase} from "@/electron/database/global";
import {getWorkspaceDatabase} from "@/electron/database/workspace";

export const initEventLoop = () => {
  setInterval(async () => {
    await initWorkspaceDatabases();
    await sendTransactions();
  }, 10000);
}

const initWorkspaceDatabases = async () => {
  const workspaces = await globalDatabase.getWorkspaces();

  for (const workspace of workspaces) {
    const workspaceDatabase = await getWorkspaceDatabase(workspace.accountId, workspace.id);
    await workspaceDatabase.migrate();
  }
}

const sendTransactions = async () => {
  const groupedAccountTransactions = await globalDatabase.getGroupedAccountTransactions(20);

  for (const accountTransactions of groupedAccountTransactions) {
    const transactionIds = accountTransactions.transactions.map(t => t.id);
    const response = await fetch("http://localhost:3000/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${accountTransactions.account.token}`,
      },
      body: JSON.stringify({
        transactions: accountTransactions.transactions,
      }),
    });

    if (response.ok) {
      await globalDatabase.deleteTransactions(transactionIds);
    }
  }
}
