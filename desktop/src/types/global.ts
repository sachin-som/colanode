import {Account} from "@/types/accounts";
import {Workspace} from "@/types/workspaces";
import {Node} from "@/types/nodes";

export type GlobalDatabaseData = {
  accounts: Account[];
  workspaces: WorkspaceDatabaseData[];
};

export type WorkspaceDatabaseData = {
  workspace: Workspace;
  nodes: Node[];
};