import { Request, Response, Router } from 'express';
import { Transaction } from '@/types/transactions';
import { producer, TOPIC_NAMES } from '@/data/kafka';

export const transactionsRouter = Router();

transactionsRouter.post('/', async (req: Request, res: Response) => {
  const transactions: Transaction[] = req.body.transactions;

  const messages = transactions.map((transaction) => ({
    key: transaction.id,
    value: JSON.stringify(transaction),
  }));

  await producer.sendBatch({
    topicMessages: [
      {
        topic: TOPIC_NAMES.TRANSACTIONS,
        messages: messages,
      },
    ],
  });

  res.status(200).json({
    appliedTransactionIds: transactions.map((transaction) => transaction.id),
  });
});
