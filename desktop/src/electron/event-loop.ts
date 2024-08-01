import {deleteTransactions, getGroupedAccountTransactions} from "@/electron/global-db";

export const initEventLoop = () => {
  setInterval(async () => {
    await sendTransactions();
  }, 10000);
}

const sendTransactions = async () => {
  const groupedAccountTransactions = getGroupedAccountTransactions(10);

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
      deleteTransactions(transactionIds);
    }
  }
}
