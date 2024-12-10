import {
  Block,
  generateId,
  IdType,
  LocalTransaction,
  NodeAttributes,
  NodeRole,
  registry,
  generateNodeIndex,
  ViewAttributes,
  FieldAttributes,
  SelectOptionAttributes,
  DatabaseAttributes,
  FieldValue,
  ViewFilterAttributes,
} from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';
import { faker } from '@faker-js/faker';

import { User } from './types';

const MESSAGES_PER_CONVERSATION = 500;
const RECORDS_PER_DATABASE = 1000;

export class NodeGenerator {
  constructor(
    private readonly workspaceId: string,
    private readonly users: User[]
  ) {}

  public generate() {
    this.buildGeneralSpace();
    this.buildProductSpace();
    this.buildChats();
  }

  private buildGeneralSpace() {
    const spaceId = this.buildSpace('General', 'The general space');
    this.buildPage('Welcome', spaceId);
    this.buildPage('Resources', spaceId);
    this.buildPage('Guide', spaceId);
    this.buildChannel('Announcements', spaceId);
  }

  private buildProductSpace() {
    const spaceId = this.buildSpace('Product', 'The product space');
    this.buildChannel('Discussions', spaceId);
    this.buildChannel('Alerts', spaceId);
    this.buildPage('Roadmap', spaceId);
    this.buildTasksDatabase(spaceId);
  }

  private buildChats() {
    for (let i = 1; i < this.users.length; i++) {
      const user = this.users[i]!;
      this.buildChat(user);
    }
  }

  private buildSpace(name: string, description: string) {
    const spaceId = generateId(IdType.Space);
    const collaborators: Record<string, NodeRole> = {};
    for (const user of this.users) {
      collaborators[user.userId] = 'admin';
    }

    const spaceAttributes: NodeAttributes = {
      type: 'space',
      name,
      description,
      parentId: this.workspaceId,
      collaborators,
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      spaceId,
      user.userId,
      spaceAttributes
    );

    user.transactions.push(createTransaction);
    return spaceId;
  }

  private buildChannel(name: string, spaceId: string) {
    const channelId = generateId(IdType.Channel);
    const channelAttributes: NodeAttributes = {
      type: 'channel',
      name,
      parentId: spaceId,
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      channelId,
      user.userId,
      channelAttributes
    );

    user.transactions.push(createTransaction);

    this.buidMessages(channelId, MESSAGES_PER_CONVERSATION, this.users);
  }

  private buildChat(user: User) {
    const mainUser = this.getMainUser();
    const chatId = generateId(IdType.Chat);
    const chatAttributes: NodeAttributes = {
      type: 'chat',
      parentId: this.workspaceId,
      collaborators: {
        [mainUser.userId]: 'admin',
        [user.userId]: 'admin',
      },
    };

    const createTransaction = this.buildCreateTransaction(
      chatId,
      mainUser.userId,
      chatAttributes
    );

    mainUser.transactions.push(createTransaction);

    this.buidMessages(chatId, MESSAGES_PER_CONVERSATION, [mainUser, user]);
  }

  private buildPage(name: string, parentId: string) {
    const pageId = generateId(IdType.Page);
    const pageAttributes: NodeAttributes = {
      type: 'page',
      name,
      parentId,
      content: this.buildDocumentContent(pageId),
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      pageId,
      user.userId,
      pageAttributes
    );

    user.transactions.push(createTransaction);
  }

  private buidMessages(conversationId: string, count: number, users: User[]) {
    for (let i = 0; i < count; i++) {
      this.buildMessage(conversationId, users);
    }
  }

  private buildMessage(conversationId: string, users: User[]) {
    const messageId = generateId(IdType.Message);

    const messageAttributes: NodeAttributes = {
      type: 'message',
      content: this.buildMessageContent(messageId),
      parentId: conversationId,
      subtype: 'standard',
      reactions: {},
    };

    const user = this.getRandomUser(users);
    const createTransaction = this.buildCreateTransaction(
      messageId,
      user.userId,
      messageAttributes
    );

    user.transactions.push(createTransaction);
  }

  private buildTasksDatabase(parentId: string) {
    const databaseId = generateId(IdType.Database);

    const newStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'New',
      color: 'gray',
      index: generateNodeIndex(),
    };

    const activeStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Active',
      color: 'blue',
      index: generateNodeIndex(newStatusOption.index),
    };

    const toTestStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'To Test',
      color: 'yellow',
      index: generateNodeIndex(activeStatusOption.index),
    };

    const closedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Closed',
      color: 'red',
      index: generateNodeIndex(toTestStatusOption.index),
    };

    const statusField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'select',
      name: 'Status',
      index: generateNodeIndex(),
      options: {
        [newStatusOption.id]: newStatusOption,
        [activeStatusOption.id]: activeStatusOption,
        [toTestStatusOption.id]: toTestStatusOption,
        [closedStatusOption.id]: closedStatusOption,
      },
    };

    const apiTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'api',
      color: 'blue',
      index: generateNodeIndex(),
    };

    const devopsTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'devops',
      color: 'green',
      index: generateNodeIndex(apiTeamSelectOption.index),
    };

    const frontendTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'frontend',
      color: 'purple',
      index: generateNodeIndex(devopsTeamSelectOption.index),
    };

    const aiTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'ai',
      color: 'pink',
      index: generateNodeIndex(frontendTeamSelectOption.index),
    };

    const otherTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'other',
      color: 'gray',
      index: generateNodeIndex(aiTeamSelectOption.index),
    };

    const teamsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'multiSelect',
      name: 'Teams',
      index: generateNodeIndex(statusField.index),
      options: {
        [apiTeamSelectOption.id]: apiTeamSelectOption,
        [devopsTeamSelectOption.id]: devopsTeamSelectOption,
        [frontendTeamSelectOption.id]: frontendTeamSelectOption,
        [aiTeamSelectOption.id]: aiTeamSelectOption,
        [otherTeamSelectOption.id]: otherTeamSelectOption,
      },
    };

    const assignedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'collaborator',
      name: 'Assigned',
      index: generateNodeIndex(teamsField.index),
    };

    const priorityField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'number',
      name: 'Priority',
      index: generateNodeIndex(assignedField.index),
    };

    const approvedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'boolean',
      name: 'Approved',
      index: generateNodeIndex(priorityField.index),
    };

    const releaseDateField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'date',
      name: 'Release Date',
      index: generateNodeIndex(approvedField.index),
    };

    const commentsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'text',
      name: 'Comment',
      index: generateNodeIndex(releaseDateField.index),
    };

    const allTasksView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'table',
      name: 'All Tasks',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: null,
      sorts: {},
    };

    const activeTasksFilter: ViewFilterAttributes = {
      id: generateId(IdType.ViewFilter),
      type: 'field',
      fieldId: statusField.id,
      value: activeStatusOption.id,
      operator: 'equals',
    };

    const activeTasksView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'table',
      name: 'Active Tasks',
      avatar: null,
      fields: {},
      filters: {
        [activeTasksFilter.id]: activeTasksFilter,
      },
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: null,
      sorts: {},
    };

    const kanbanView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'board',
      name: 'Kanban',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: statusField.id,
      sorts: {},
    };

    const databaseAttributes: NodeAttributes = {
      type: 'database',
      parentId,
      name: 'Tasks',
      fields: {
        [statusField.id]: statusField,
        [teamsField.id]: teamsField,
        [assignedField.id]: assignedField,
        [priorityField.id]: priorityField,
        [approvedField.id]: approvedField,
        [releaseDateField.id]: releaseDateField,
        [commentsField.id]: commentsField,
      },
      views: {
        [allTasksView.id]: allTasksView,
        [activeTasksView.id]: activeTasksView,
        [kanbanView.id]: kanbanView,
      },
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      databaseId,
      user.userId,
      databaseAttributes
    );

    user.transactions.push(createTransaction);

    this.buildRecords(databaseId, databaseAttributes, RECORDS_PER_DATABASE);
  }

  private buildRecords(
    databaseId: string,
    databaseAttributes: DatabaseAttributes,
    count: number
  ) {
    for (let i = 0; i < count; i++) {
      this.buildRecord(databaseId, databaseAttributes);
    }
  }

  private buildRecord(
    databaseId: string,
    databaseAttributes: DatabaseAttributes
  ) {
    const recordId = generateId(IdType.Record);
    const recordAttributes: NodeAttributes = {
      type: 'record',
      parentId: databaseId,
      databaseId,
      content: this.buildDocumentContent(recordId),
      name: faker.lorem.sentence(),
      avatar: null,
      fields: {},
    };

    for (const field of Object.values(databaseAttributes.fields)) {
      const fieldValue = this.buildFieldValue(field);
      if (fieldValue) {
        recordAttributes.fields[field.id] = fieldValue;
      }
    }

    const user = this.getRandomUser(this.users);
    const createTransaction = this.buildCreateTransaction(
      recordId,
      user.userId,
      recordAttributes
    );

    user.transactions.push(createTransaction);
  }

  private getRandomUser(users: User[]): User {
    const user = users[Math.floor(Math.random() * users.length)];
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private getMainUser(): User {
    return this.users[0]!;
  }

  private buildCreateTransaction(
    id: string,
    userId: string,
    attributes: NodeAttributes
  ): LocalTransaction {
    const ydoc = new YDoc();
    const model = registry.getModel(attributes.type);

    const update = ydoc.updateAttributes(model.schema, attributes);

    return {
      id: generateId(IdType.Transaction),
      operation: 'create',
      data: encodeState(update),
      nodeId: id,
      nodeType: attributes.type,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
  }

  private buildMessageContent(messageId: string): Record<string, Block> {
    const paragraphBlock = this.buildParagraphBlock(
      messageId,
      generateNodeIndex()
    );
    return {
      [paragraphBlock.id]: paragraphBlock,
    };
  }

  private buildDocumentContent(pageId: string): Record<string, Block> {
    const nrOfParagraphs = Math.floor(Math.random() * 10) + 1;
    const blocks: Record<string, Block> = {};
    for (let i = 0; i < nrOfParagraphs; i++) {
      const block = this.buildParagraphBlock(pageId, generateNodeIndex());
      blocks[block.id] = block;
    }

    return blocks;
  }

  private buildParagraphBlock(parentId: string, index: string): Block {
    const blockId = generateId(IdType.Block);
    return {
      type: 'paragraph',
      parentId,
      content: [{ type: 'text', text: faker.lorem.sentence(), marks: null }],
      id: blockId,
      index,
      attrs: null,
    };
  }

  private buildFieldValue(field: FieldAttributes): FieldValue | null {
    if (field.type === 'boolean') {
      return {
        type: 'boolean',
        value: faker.datatype.boolean(),
      };
    } else if (field.type === 'collaborator') {
      return {
        type: 'collaborator',
        value: [this.getRandomUser(this.users).userId],
      };
    } else if (field.type === 'date') {
      return {
        type: 'date',
        value: faker.date.recent().toISOString(),
      };
    } else if (field.type === 'email') {
      return {
        type: 'email',
        value: faker.internet.email(),
      };
    } else if (field.type === 'multiSelect') {
      const options = Object.values(field.options ?? {});
      const randomOption = options[Math.floor(Math.random() * options.length)];
      if (!randomOption) {
        return null;
      }

      return {
        type: 'multiSelect',
        value: [randomOption.id],
      };
    } else if (field.type === 'number') {
      return {
        type: 'number',
        value: Math.floor(Math.random() * 1000),
      };
    } else if (field.type === 'phone') {
      return {
        type: 'phone',
        value: faker.phone.number(),
      };
    } else if (field.type === 'select') {
      const options = Object.values(field.options ?? {});
      const randomOption = options[Math.floor(Math.random() * options.length)];
      if (!randomOption) {
        return null;
      }

      return {
        type: 'select',
        value: randomOption.id,
      };
    } else if (field.type === 'text') {
      return {
        type: 'text',
        value: faker.lorem.sentence(),
      };
    } else if (field.type === 'url') {
      return {
        type: 'url',
        value: faker.internet.url(),
      };
    }

    return null;
  }
}
