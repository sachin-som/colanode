import { Request, Response, Router } from 'express';
import { Transaction } from '@/types/transactions';
import { Node } from '@/types/nodes';
import { prisma } from '@/data/db';

export const transactionsRouter = Router();

transactionsRouter.post('/', async (req: Request, res: Response) => {
  const transactions: Transaction[] = req.body.transactions;

  const appliedTransactionIds: string[] = [];
  for (const transaction of transactions) {
    if (transaction.type === 'create_node') {
      const node = JSON.parse(transaction.input) as Node;
      await prisma.nodes.create({
        data: {
          id: node.id,
          parentId: node.parentId,
          workspaceId: node.workspaceId,
          type: node.type,
          index: node.index,
          attrs: node.attrs,
          createdAt: node.createdAt,
          createdBy: node.createdBy,
          versionId: node.versionId,
          content: JSON.stringify(node.content),
          state: node.state,
        },
      });

      appliedTransactionIds.push(transaction.id);
    } else if (transaction.type === 'update_node') {
      const node = JSON.parse(transaction.input) as Node;
      await prisma.nodes.update({
        where: {
          id: node.id,
        },
        data: {
          parentId: node.parentId,
          attrs: node.attrs,
          content: JSON.stringify(node.content),
          updatedAt: node.updatedAt,
          updatedBy: node.updatedBy,
        },
      });

      appliedTransactionIds.push(transaction.id);
    } else if (transaction.type === 'delete_node') {
      // delete node
      await prisma.nodes.delete({
        where: {
          id: transaction.nodeId,
        },
      });

      appliedTransactionIds.push(transaction.id);
    }
  }

  res.json({
    appliedTransactionIds,
  });
});
