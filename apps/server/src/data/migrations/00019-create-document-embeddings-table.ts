import { Migration, sql } from 'kysely';

export const createDocumentEmbeddingsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('document_embeddings')
      .addColumn('document_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('chunk', 'integer', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('text', 'text', (col) => col.notNull())
      .addColumn('embedding_vector', sql`vector(2000)`, (col) => col.notNull())
      .addColumn(
        'search_vector',
        sql`tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED`
      )
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addPrimaryKeyConstraint('document_embeddings_pkey', [
        'document_id',
        'chunk',
      ])
      .execute();

    await sql`
      CREATE INDEX document_embeddings_embedding_vector_idx
        ON document_embeddings
        USING hnsw(embedding_vector vector_cosine_ops)
        WITH (
          m = 16,            
          ef_construction = 64  
        );
    `.execute(db);

    await sql`
      CREATE INDEX document_embeddings_search_vector_idx
        ON document_embeddings
        USING GIN (search_vector);
    `.execute(db);
  },
  down: async (db) => {
    await db.schema.dropTable('document_embeddings').execute();
  },
};
