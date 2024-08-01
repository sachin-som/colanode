import {app, ipcMain} from "electron";
import database from 'better-sqlite3';
import {Workspace} from "@/types/workspaces";
import {AccountTransactions, Transaction} from "@/types/transactions";
import {Account} from "@/types/accounts";
import {AccountDbModel, TransactionDbModel, WorkspaceDbModel} from "@/electron/models";

const path = app.getPath('userData');
const globalDb = new database(`${path}/global.db`);

const createAccountsTableQuery = `
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT,
    token TEXT NOT NULL
  );
`;

const createWorkspacesTableQuery = `
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    version_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    role INTEGER NOT NULL,
    user_node_id TEXT NOT NULL
  );
`;


const createTransactionsTableQuery = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    type TEXT NOT NULL,
    node_id TEXT NOT NULL,
    input TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`;

const insertAccountQuery = `
  INSERT INTO accounts 
  (
    id, 
    name, 
    email, 
    avatar, 
    token
  ) 
  VALUES (?, ?, ?, ?, ?)
`;

const selectAccountsQuery = `
  SELECT id, name, email, avatar, token FROM accounts
`;

const selectWorkspacesQuery = `
  SELECT 
    id, 
    name, 
    description, 
    avatar,
    version_id,
    account_id,
    role, 
    user_node_id
  FROM workspaces
`;

const insertWorkspaceQuery = `
  INSERT INTO workspaces 
  (
    id, 
    name, 
    description, 
    avatar, 
    version_id, 
    account_id, 
    role, 
    user_node_id
  ) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const insertTransactionQuery = `
  INSERT INTO transactions 
  (
    id,
    workspace_id,
    account_id,
    type,
    node_id, 
    input,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const deleteTransactionsQuery = `
  DELETE FROM transactions WHERE id IN (?)
`;


const addAccount = (account: Account) => {
  const stmt = globalDb.prepare(insertAccountQuery);
  stmt.run(account.id, account.name, account.email, account.avatar, account.token);
}

const getAccounts = (): Account[] => {
  const stmt = globalDb.prepare<[], AccountDbModel>(selectAccountsQuery);
  const accounts = stmt.all();

  return accounts.map(account => ({
    id: account.id,
    name: account.name,
    email: account.email,
    avatar: account.avatar,
    token: account.token
  }));
}

const getWorkspaces = (): Workspace[] => {
  const stmt = globalDb.prepare<[], WorkspaceDbModel>(selectWorkspacesQuery);
  const workspaces = stmt.all();

  return workspaces.map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    avatar: workspace.avatar,
    versionId: workspace.version_id,
    accountId: workspace.account_id,
    role: workspace.role,
    userNodeId: workspace.user_node_id
  }));
}

const addWorkspace = (workspace: Workspace) => {
  const stmt = globalDb.prepare(insertWorkspaceQuery);
  stmt.run(workspace.id, workspace.name, workspace.description, workspace.avatar, workspace.versionId, workspace.accountId, workspace.role, workspace.userNodeId);
}

const enqueueTransaction = (transaction: Transaction) => {
  const stmt = globalDb.prepare(insertTransactionQuery);
  const inputJson = JSON.stringify(transaction.input);
  stmt.run(transaction.id, transaction.workspaceId, transaction.accountId, transaction.type, transaction.nodeId, inputJson, transaction.createdAt.toISOString());
}

export const getGroupedAccountTransactions = (count: number): AccountTransactions[] => {
  const stmt = globalDb.prepare<[], TransactionDbModel>(`SELECT * FROM transactions ORDER BY id LIMIT ${count} `);
  const transactions = stmt.all();

  if (transactions.length === 0) {
    return [];
  }

  const accountIds = transactions.map(transaction => transaction.account_id);
  const placeholders = accountIds.map(() => '?').join(',');
  const accountStmt = globalDb.prepare<string[], AccountDbModel>(`SELECT * FROM accounts WHERE id IN (${placeholders})`);
  const accounts = accountStmt.all(...accountIds);

  const transactionsMap = new Map<string, Transaction[]>();
  transactions.forEach(transaction => {
    const input = JSON.parse(transaction.input);
    const transactionObj = {
      id: transaction.id,
      workspaceId: transaction.workspace_id,
      accountId: transaction.account_id,
      type: transaction.type,
      nodeId: transaction.node_id,
      input: input,
      createdAt: new Date(transaction.created_at)
    };

    if (transactionsMap.has(transaction.account_id)) {
      transactionsMap.get(transaction.account_id)?.push(transactionObj);
    } else {
      transactionsMap.set(transaction.account_id, [transactionObj]);
    }
  });

  return accounts.map(account => ({
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      token: account.token
    },
    transactions: transactionsMap.get(account.id) || []
  }));
}

export const deleteTransactions = (ids: string[]) => {
  const stmt = globalDb.prepare(deleteTransactionsQuery);
  stmt.run(ids.join(','));
}

export const initGlobalDb = () => {
  globalDb.exec(createWorkspacesTableQuery);
  globalDb.exec(createTransactionsTableQuery);
  globalDb.exec(createAccountsTableQuery);
}

export const defineGlobalDbHandlers = () => {
  ipcMain.handle('get-accounts', () => getAccounts());
  ipcMain.handle('add-account', (_, account: Account) => addAccount(account));
  ipcMain.handle('get-workspaces', () => getWorkspaces());
  ipcMain.handle('add-workspace', (_, workspace: Workspace) => addWorkspace(workspace));
  ipcMain.handle('enqueue-transaction', (event, transaction: Transaction) => enqueueTransaction(transaction));
}