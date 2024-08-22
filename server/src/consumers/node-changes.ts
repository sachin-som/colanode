import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, NodeChangeData } from '@/types/changes';
import { prisma } from '@/data/prisma';
import { NeuronId } from '@/lib/id';
import { Node } from '@/types/nodes';

export const initNodeChangesConsumer = async () => {
  const consumer = kafka.consumer({ groupId: CONSUMER_IDS.NODE_CHANGES });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<NodeChangeData>;

      await handleNodeChange(change);
    },
  });
};

const handleNodeChange = async (change: ChangeMessage<NodeChangeData>) => {
  const changeData = change.after;
  if (!changeData) {
    return;
  }

  const workspaceAccounts = await prisma.workspaceAccounts.findMany({
    where: {
      workspaceId: changeData.workspace_id,
    },
  });

  if (workspaceAccounts.length === 0) {
    return;
  }

  const accountIds = workspaceAccounts.map((account) => account.accountId);
  const accountDevices = await prisma.accountDevices.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
  });

  if (accountDevices.length === 0) {
    return;
  }

  const deviceIds = accountDevices.map((device) => device.id);
  const node: Node = {
    id: changeData.id,
    workspaceId: changeData.workspace_id,
    parentId: changeData.parent_id,
    type: changeData.type,
    index: changeData.index,
    attrs: changeData.attrs ? JSON.parse(changeData.attrs) : null,
    content: changeData.content ? JSON.parse(changeData.content) : null,
    createdAt: new Date(changeData.created_at),
    createdBy: changeData.created_by,
    updatedAt: changeData.updated_at ? new Date(changeData.updated_at) : null,
    updatedBy: changeData.updated_by,
    versionId: changeData.version_id,
    serverCreatedAt: new Date(changeData.server_created_at),
    serverUpdatedAt: changeData.server_updated_at
      ? new Date(changeData.server_updated_at)
      : null,
    serverVersionId: changeData.server_version_id,
  };

  await prisma.updates.create({
    data: {
      id: NeuronId.generate(NeuronId.Type.Update),
      workspaceId: changeData.workspace_id,
      devices: deviceIds,
      type: 'node_sync',
      content: JSON.stringify(node),
      createdAt: new Date(),
    },
  });
};

const handelNodeDelete = async (id: string) => {};
