import { createDebugger } from '@colanode/core';

import { AppService } from '@/main/services/app-service';

export class MetadataService {
  private readonly debug = createDebugger('desktop:service:metadata');
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async get<T>(key: string): Promise<T | null> {
    const metadata = await this.app.database
      .selectFrom('metadata')
      .selectAll()
      .where('key', '=', key)
      .executeTakeFirst();

    if (!metadata) {
      return null;
    }

    return JSON.parse(metadata.value) as T;
  }

  public async set<T>(key: string, value: T) {
    this.debug(`Setting metadata key ${key} to value ${value}`);

    await this.app.database
      .insertInto('metadata')
      .values({
        key,
        value: JSON.stringify(value),
        created_at: new Date().toISOString(),
      })
      .onConflict((b) =>
        b.column('key').doUpdateSet({
          value: JSON.stringify(value),
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  public async delete(key: string) {
    this.debug(`Deleting metadata key ${key}`);

    await this.app.database
      .deleteFrom('metadata')
      .where('key', '=', key)
      .execute();
  }
}
