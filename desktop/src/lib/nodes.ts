import {Node} from "@/types/nodes";
import {CreateNodeTransactionInput, Transaction} from "@/types/transactions";
import {generateId, IdType} from "@/lib/id";
import {store} from "@/store";

export async function createNode(accountId: string, node: Node) {
  store.setNode(node);

  const transactionInput: CreateNodeTransactionInput = {
    id: node.id,
    type: node.type,
    parentId: node.parentId,
    attrs: node.attrs,
    createdAt: node.createdAt,
    createdBy: node.createdBy
  }

  const transaction: Transaction = {
    id: generateId(IdType.Transaction),
    nodeId: node.id,
    createdAt: new Date(),
    type: 'create_node',
    input: transactionInput,
    workspaceId: node.workspaceId,
    accountId: accountId
  }
  await window.globalDb.enqueueTransaction(transaction);
}