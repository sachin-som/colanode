import { Request, Response } from 'express';
import {
  isCreateNodeTransaction,
  isDeleteNodeTransaction,
  isUpdateNodeTransaction,
  Transaction,
} from '@/types/transactions';
import { prisma } from '@/data/db';

const applyTransactions = async (req: Request, res: Response) => {
  const transactions: Transaction[] = req.body.transactions;

  const appliedTransactionIds: string[] = [];
  for (const transaction of transactions) {
    if (isCreateNodeTransaction(transaction)) {
      // create node
      await prisma.nodes.create({
        data: {
          id: transaction.input.id,
          parentId: transaction.input.parentId,
          workspaceId: transaction.workspaceId,
          type: transaction.input.type,
          attrs: transaction.input.attrs,
          createdAt: transaction.input.createdAt,
          createdBy: transaction.input.createdBy,
          versionId: transaction.id,
        },
      });

      appliedTransactionIds.push(transaction.id);
    } else if (isUpdateNodeTransaction(transaction)) {
      await prisma.nodes.update({
        where: {
          id: transaction.input.id,
        },
        data: {
          parentId: transaction.input.parentId,
          attrs: transaction.input.attrs,
          updatedAt: transaction.input.updatedAt,
          updatedBy: transaction.input.updatedBy,
        },
      });

      appliedTransactionIds.push(transaction.id);
    } else if (isDeleteNodeTransaction(transaction)) {
      // delete node
      await prisma.nodes.delete({
        where: {
          id: transaction.input.id,
        },
      });

      appliedTransactionIds.push(transaction.id);
    }
  }

  res.json({
    appliedTransactionIds,
  });
};

export const transactions = {
  applyTransactions,
};
