import { Migration } from 'kysely';

import { createUsersTable } from './00001-create-users-table';
import { createEntriesTable } from './00002-create-entries-table';
import { createEntryInteractionsTable } from './00004-create-entry-interactions-table';
import { createEntryTransactionsTable } from './00003-create-entry-transactions-table';
import { createCollaborationsTable } from './00005-create-collaborations-table';
import { createMessagesTable } from './00006-create-messages-table';
import { createMessageReactionsTable } from './00007-create-message-reactions-table';
import { createMessageInteractionsTable } from './00008-create-message-interactions-table';
import { createFilesTable } from './00009-create-files-table';
import { createFileStatesTable } from './00010-create-file-states-table';
import { createFileInteractionsTable } from './00011-create-file-interactions-table';
import { createMutationsTable } from './00012-create-mutations-table';
import { createEntryPathsTable } from './00013-create-entry-paths-table';
import { createTextsTable } from './00014-create-texts-table';
import { createCursorsTable } from './00015-create-cursors-table';
import { createMetadataTable } from './00016-create-metadata-table';

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001-create-users-table': createUsersTable,
  '00002-create-entries-table': createEntriesTable,
  '00003-create-entry-transactions-table': createEntryTransactionsTable,
  '00004-create-entry-interactions-table': createEntryInteractionsTable,
  '00005-create-collaborations-table': createCollaborationsTable,
  '00006-create-messages-table': createMessagesTable,
  '00007-create-message-reactions-table': createMessageReactionsTable,
  '00008-create-message-interactions-table': createMessageInteractionsTable,
  '00009-create-files-table': createFilesTable,
  '00010-create-file-states-table': createFileStatesTable,
  '00011-create-file-interactions-table': createFileInteractionsTable,
  '00012-create-mutations-table': createMutationsTable,
  '00013-create-entry-paths-table': createEntryPathsTable,
  '00014-create-texts-table': createTextsTable,
  '00015-create-cursors-table': createCursorsTable,
  '00016-create-metadata-table': createMetadataTable,
};
