import { Migration } from 'kysely';

import { createUsersTable } from './00001-create-users-table';
import { createNodesTable } from './00002-create-nodes-table';
import { createNodeStatesTable } from './00003-create-node-states-table';
import { createNodeUpdatesTable } from './00004-create-node-updates-table';
import { createNodeInteractionsTable } from './00005-create-node-interactions-table';
import { createNodeReactionsTable } from './00006-create-node-reactions-table';
import { createCollaborationsTable } from './00007-create-collaborations-table';
import { createFilesTable } from './00008-create-files-table';
import { createMutationsTable } from './00009-create-mutations-table';
import { createTombstonesTable } from './00010-create-tombstones-table';
import { createDocumentsTable } from './00011-create-documents-table';
import { createDocumentUpdatesTable } from './00012-create-document-updates-table';
import { createCursorsTable } from './00013-create-cursors-table';
import { createMetadataTable } from './00014-create-metadata-table';

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001-create-users-table': createUsersTable,
  '00002-create-nodes-table': createNodesTable,
  '00003-create-node-states-table': createNodeStatesTable,
  '00004-create-node-updates-table': createNodeUpdatesTable,
  '00005-create-node-interactions-table': createNodeInteractionsTable,
  '00006-create-node-reactions-table': createNodeReactionsTable,
  '00007-create-collaborations-table': createCollaborationsTable,
  '00008-create-files-table': createFilesTable,
  '00009-create-mutations-table': createMutationsTable,
  '00010-create-tombstones-table': createTombstonesTable,
  '00011-create-documents-table': createDocumentsTable,
  '00012-create-document-updates-table': createDocumentUpdatesTable,
  '00013-create-cursors-table': createCursorsTable,
  '00014-create-metadata-table': createMetadataTable,
};
