import { initApi } from '@/api';
import { initTransactionsConsumer } from '@/consumers/transactions';

initApi();
initTransactionsConsumer().then(() => {
  console.log('Transactions consumer started');
});
