import { Kysely } from 'kysely';
import {
  NodesTableSchema,
  WorkspaceDatabaseSchema,
} from '@/data/schemas/workspace';
import {
  LocalMutation,
  LocalDeleteNodesMutation,
  LocalCreateNodeMutation,
  LocalUpdateNodeMutation,
  LocalDeleteNodeMutation,
  LocalCreateNodesMutation,
  ServerMutation,
  ServerCreateNodeMutation,
  ServerCreateNodesMutation,
  ServerUpdateNodeMutation,
} from '@/types/mutations';
import { Workspace } from '@/types/workspaces';
import { Node } from '@/types/nodes';
import Axios, { AxiosInstance } from 'axios';
import { NeuronId } from '@/lib/id';

export class MutationManager {
  private readonly workspace: Workspace;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly axios: AxiosInstance;
  private readonly mutationListeners: Map<
    string,
    (affectedTables: string[]) => void
  >;

  constructor(
    axios: AxiosInstance,
    workspace: Workspace,
    database: Kysely<WorkspaceDatabaseSchema>,
  ) {
    this.workspace = workspace;
    this.axios = axios;
    this.database = database;
    this.mutationListeners = new Map();
  }

  public onMutation(listener: (affectedTables: string[]) => void): void {
    const id = NeuronId.generate(NeuronId.Type.Subscriber);
    this.mutationListeners.set(id, listener);
  }

  private notifyMutationListeners(affectedTables: string[]): void {
    for (const listener of this.mutationListeners.values()) {
      listener(affectedTables);
    }
  }

  public async executeLocalMutation(mutation: LocalMutation): Promise<void> {
    switch (mutation.type) {
      case 'create_node':
        return this.executeLocalCreateNodeMutation(mutation);
      case 'create_nodes':
        return this.executeLocalCreateNodesMutation(mutation);
      case 'update_node':
        return this.executeLocalUpdateNodeMutation(mutation);
      case 'delete_node':
        return this.executeLocalDeleteNodeMutation(mutation);
      case 'delete_nodes':
        return this.executeLocalDeleteNodesMutation(mutation);
    }
  }

  private async executeLocalCreateNodeMutation(
    mutation: LocalCreateNodeMutation,
  ): Promise<void> {
    await this.database.transaction().execute(async (trx) => {
      const node = mutation.data.node;
      await trx
        .insertInto('nodes')
        .values({
          id: node.id,
          type: node.type,
          parent_id: node.parentId,
          workspace_id: node.workspaceId,
          index: node.index,
          content: node.content ? JSON.stringify(node.content) : null,
          attrs: node.attrs ? JSON.stringify(node.attrs) : null,
          created_at: node.createdAt,
          created_by: node.createdBy,
          version_id: node.versionId,
        })
        .execute();

      await trx
        .insertInto('mutations')
        .values({
          type: mutation.type,
          data: JSON.stringify(mutation.data),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    this.notifyMutationListeners(['nodes']);
  }

  private async executeLocalCreateNodesMutation(
    mutation: LocalCreateNodesMutation,
  ): Promise<void> {
    await this.database.transaction().execute(async (trx) => {
      const data = mutation.data;
      await trx
        .insertInto('nodes')
        .values(
          data.nodes.map((node) => ({
            id: node.id,
            type: node.type,
            parent_id: node.parentId,
            workspace_id: node.workspaceId,
            index: node.index,
            content: node.content ? JSON.stringify(node.content) : null,
            attrs: node.attrs ? JSON.stringify(node.attrs) : null,
            created_at: node.createdAt,
            created_by: node.createdBy,
            version_id: node.versionId,
          })),
        )
        .execute();

      await trx
        .insertInto('mutations')
        .values({
          type: mutation.type,
          data: JSON.stringify(mutation.data),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    this.notifyMutationListeners(['nodes']);
  }

  private async executeLocalUpdateNodeMutation(
    mutation: LocalUpdateNodeMutation,
  ): Promise<void> {
    await this.database.transaction().execute(async (trx) => {
      const data = mutation.data;
      await trx
        .updateTable('nodes')
        .set({
          type: data.type,
          parent_id: data.parentId,
          index: data.index,
          content: data.content ? JSON.stringify(data.content) : null,
          attrs: data.attrs ? JSON.stringify(data.attrs) : null,
          updated_at: data.updatedAt,
          updated_by: data.updatedBy,
          version_id: data.versionId,
        })
        .where('id', '=', data.id)
        .execute();

      await trx
        .insertInto('mutations')
        .values({
          type: mutation.type,
          data: JSON.stringify(mutation.data),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    this.notifyMutationListeners(['nodes']);
  }

  private async executeLocalDeleteNodeMutation(
    mutation: LocalDeleteNodeMutation,
  ): Promise<void> {
    await this.database.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('nodes')
        .where('id', '=', mutation.data.id)
        .execute();

      await trx
        .insertInto('mutations')
        .values({
          type: mutation.type,
          data: JSON.stringify(mutation.data),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    this.notifyMutationListeners(['nodes']);
  }

  private async executeLocalDeleteNodesMutation(
    mutation: LocalDeleteNodesMutation,
  ): Promise<void> {
    await this.database.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('nodes')
        .where('id', 'in', mutation.data.ids)
        .execute();

      await trx
        .insertInto('mutations')
        .values({
          type: mutation.type,
          data: JSON.stringify(mutation.data),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    this.notifyMutationListeners(['nodes']);
  }

  public async executeServerMutation(mutation: ServerMutation): Promise<void> {
    switch (mutation.type) {
      case 'create_node':
        return this.executeServerCreateNodeMutation(mutation);
      case 'create_nodes':
        return this.executeServerCreateNodesMutation(mutation);
      case 'update_node':
        return this.executeServerUpdateNodeMutation(mutation);
      case 'delete_node':
        return this.executeServerDeleteNodeMutation(mutation);
      case 'delete_nodes':
        return this.executeServerDeleteNodesMutation(mutation);
    }
  }

  public async executeServerCreateNodeMutation(
    mutation: ServerCreateNodeMutation,
  ): Promise<void> {
    const node = mutation.data.node;
    await this.syncNodeFromServer(node);
  }

  public async executeServerCreateNodesMutation(
    mutation: ServerCreateNodesMutation,
  ): Promise<void> {
    for (const node of mutation.data.nodes) {
      await this.syncNodeFromServer(node);
    }
  }

  public async executeServerUpdateNodeMutation(
    mutation: ServerUpdateNodeMutation,
  ): Promise<void> {
    await this.syncNodeFromServer(mutation.data.node);
  }

  public async executeServerDeleteNodeMutation(
    mutation: LocalDeleteNodeMutation,
  ): Promise<void> {
    await this.database
      .deleteFrom('nodes')
      .where('id', '=', mutation.data.id)
      .execute();
  }

  public async executeServerDeleteNodesMutation(
    mutation: LocalDeleteNodesMutation,
  ): Promise<void> {
    await this.database
      .deleteFrom('nodes')
      .where('id', 'in', mutation.data.ids)
      .execute();

    this.notifyMutationListeners(['nodes']);
  }

  public async syncNodeFromServer(node: Node): Promise<void> {
    const existingNode = await this.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.id)
      .executeTakeFirst();

    if (!existingNode) {
      await this.database
        .insertInto('nodes')
        .values({
          id: node.id,
          type: node.type,
          parent_id: node.parentId,
          workspace_id: node.workspaceId,
          index: node.index,
          content: node.content ? JSON.stringify(node.content) : null,
          attrs: node.attrs ? JSON.stringify(node.attrs) : null,
          created_at: node.createdAt,
          created_by: node.createdBy,
          updated_by: node.updatedBy,
          updated_at: node.updatedAt,
          version_id: node.versionId,
          server_created_at: node.serverCreatedAt,
          server_updated_at: node.serverUpdatedAt,
          server_version_id: node.serverVersionId,
        })
        .execute();

      this.notifyMutationListeners(['nodes']);
      return;
    }

    if (this.shouldUpdateNodeFromServer(existingNode, node)) {
      await this.database
        .updateTable('nodes')
        .set({
          type: node.type,
          parent_id: node.parentId,
          index: node.index,
          content: node.content ? JSON.stringify(node.content) : null,
          attrs: node.attrs ? JSON.stringify(node.attrs) : null,
          updated_at: node.updatedAt,
          updated_by: node.updatedBy,
          version_id: node.versionId,
          server_created_at: node.serverCreatedAt,
          server_updated_at: node.serverUpdatedAt,
          server_version_id: node.serverVersionId,
        })
        .where('id', '=', node.id)
        .execute();

      this.notifyMutationListeners(['nodes']);
    }
  }

  public shouldUpdateNodeFromServer(
    localNode: NodesTableSchema,
    serverNode: Node,
  ): boolean {
    if (localNode.server_version_id === serverNode.serverVersionId) {
      return false;
    }

    if (localNode.updated_at) {
      if (!serverNode.updatedAt) {
        return false;
      }

      const localUpdatedAt = new Date(localNode.updated_at);
      const serverUpdatedAt = new Date(serverNode.updatedAt);

      if (localUpdatedAt > serverUpdatedAt) {
        return false;
      }
    }

    return true;
  }

  public async sendMutations(): Promise<void> {
    do {
      const nextMutation = await this.database
        .selectFrom('mutations')
        .selectAll()
        .orderBy('id')
        .limit(1)
        .executeTakeFirst();

      if (!nextMutation) {
        break;
      }

      try {
        const { data, status } = await this.axios.post<ServerMutation>(
          'v1/mutations',
          {
            workspaceId: this.workspace.id,
            type: nextMutation.type,
            data: JSON.parse(nextMutation.data),
          },
        );

        if (status === 200) {
          await this.database
            .deleteFrom('mutations')
            .where('id', '=', nextMutation.id)
            .execute();

          await this.executeServerMutation(data);
        }
      } catch (error) {
        if (Axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            await this.database
              .deleteFrom('mutations')
              .where('id', '=', nextMutation.id)
              .execute();
          }
        }
      }
    } while (true);
  }
}
