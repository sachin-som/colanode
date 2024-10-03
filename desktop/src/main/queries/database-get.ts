import { DatabaseGetQueryInput } from '@/types/queries/database-get';
import { databaseContext } from '@/main/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/main/schemas/workspace';
import { mapNode } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';
import {
  DatabaseNode,
  FieldDataType,
  FieldNode,
  SelectOptionNode,
} from '@/types/databases';
import { LocalNode } from '@/types/nodes';
import { isEqual } from 'lodash';
import { MutationChange } from '@/types/mutations';

export class DatabaseGetQueryHandler
  implements QueryHandler<DatabaseGetQueryInput>
{
  public async handleQuery(
    input: DatabaseGetQueryInput,
  ): Promise<QueryResult<DatabaseGetQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildDatabaseNode(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: DatabaseGetQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<DatabaseGetQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchNodes(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildDatabaseNode(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: DatabaseGetQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const query = sql<SelectNode>`
        WITH database_node AS (
          SELECT *
          FROM nodes
          WHERE id = ${input.databaseId}
        ),
        field_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id = ${input.databaseId} AND type = ${NodeTypes.Field}
        ),
        select_option_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id IN 
            (
              SELECT id
              FROM field_nodes
            )
          AND type = ${NodeTypes.SelectOption}
        )
        SELECT * FROM database_node
        UNION ALL
        SELECT * FROM field_nodes
        UNION ALL
        SELECT * FROM select_option_nodes
      `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildDatabaseNode = (rows: SelectNode[]): DatabaseNode | null => {
    const nodes = rows.map((row) => mapNode(row));

    const databaseLocalNode = nodes.find(
      (node) => node.type === NodeTypes.Database,
    );
    if (!databaseLocalNode) {
      return null;
    }

    const name = databaseLocalNode.attributes.name;
    const fieldsNodes = nodes.filter((node) => node.type === NodeTypes.Field);
    const groupedSelectOptions = nodes
      .filter((node) => node.type === NodeTypes.SelectOption)
      .reduce(
        (acc, node) => {
          if (!acc[node.parentId]) {
            acc[node.parentId] = [];
          }
          acc[node.parentId].push(node);
          return acc;
        },
        {} as Record<string, LocalNode[]>,
      );

    const fields: FieldNode[] = [];
    for (const fieldNode of fieldsNodes) {
      const selectOptions = groupedSelectOptions[fieldNode.id] ?? [];
      const field = this.buildFieldNode(fieldNode, selectOptions);
      if (field) {
        fields.push(field);
      }
    }

    return {
      id: databaseLocalNode.id,
      name: name,
      fields,
    };
  };

  private buildFieldNode = (
    node: LocalNode,
    selectOptions: LocalNode[],
  ): FieldNode | null => {
    const name = node.attributes.name;
    const dataType = node.attributes.dataType as FieldDataType;

    if (!dataType) {
      return null;
    }

    switch (dataType) {
      case 'boolean':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'collaborator':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'created_at':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'created_by':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'date':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'email':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'file':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'multi_select':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
          options: selectOptions.map(this.buildSelectOption),
        };
      case 'number':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'phone':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'select':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
          options: selectOptions.map(this.buildSelectOption),
        };
      case 'text':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      case 'url':
        return {
          id: node.id,
          name,
          dataType,
          index: node.index,
        };
      default:
        return null;
    }
  };

  private buildSelectOption = (node: LocalNode): SelectOptionNode => {
    const name = node.attributes.name;
    const color = node.attributes.color;

    return {
      id: node.id,
      name: name ?? 'Unnamed',
      color: color ?? 'gray',
    };
  };
}
