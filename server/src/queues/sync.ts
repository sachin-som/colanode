// import { database } from '@/data/database';
// import { CHANNEL_NAMES, redis } from '@/data/redis';
// import { generateId, IdType } from '@/lib/id';
// import { ServerChange, ServerNodeBatchSyncData } from '@/types/sync';
// import { Job, Queue, Worker } from 'bullmq';
// import { NodeTypes } from '@/lib/constants';

// const SYNC_BATCH_SIZE = 100;

// const REDIS_HOST = process.env.REDIS_HOST;
// const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
// const REDIS_PORT = process.env.REDIS_PORT;
// const REDIS_DB = process.env.REDIS_DB;

// if (!REDIS_HOST || !REDIS_PASSWORD || !REDIS_PORT || !REDIS_DB) {
//   throw new Error('Redis configuration is missing');
// }

// export const queue = new Queue('sync', {
//   connection: {
//     host: REDIS_HOST,
//     password: REDIS_PASSWORD,
//     port: parseInt(REDIS_PORT),
//     db: parseInt(REDIS_DB),
//   },
//   defaultJobOptions: {
//     removeOnComplete: true,
//   },
// });

// export const enqueueCollaboratorSync = async (
//   nodeId: string,
//   collaboratorId: string,
// ): Promise<void> => {
//   await queue.add('collaborator-sync', { nodeId, collaboratorId });
// };

// export const enqueueWorkspaceUserSync = async (
//   workspaceId: string,
//   userId: string,
// ): Promise<void> => {
//   await queue.add('workspace-user-sync', { workspaceId, userId });
// };

// export const enqueueAccountDeviceSync = async (
//   accountId: string,
//   deviceId: string,
// ): Promise<void> => {
//   await queue.add('account-device-sync', { accountId, deviceId });
// };

// export const initSyncWorker = () => {
//   return new Worker('sync', handleSyncJob, {
//     connection: {
//       host: REDIS_HOST,
//       password: REDIS_PASSWORD,
//       port: parseInt(REDIS_PORT),
//       db: parseInt(REDIS_DB),
//     },
//   });
// };

// const handleSyncJob = async (job: Job) => {
//   switch (job.name) {
//     case 'collaborator-sync':
//       return handleCollaboratorSync(job.data);
//     case 'workspace-user-sync':
//       return handleWorkspaceUserSync(job.data);
//     case 'account-device-sync':
//       return handleAccountDeviceSync(job.data);
//   }
// };

// const handleCollaboratorSync = async (data: {
//   nodeId: string;
//   collaboratorId: string;
// }) => {
//   const { nodeId, collaboratorId } = data;
//   const collaboratorNode = await database
//     .selectFrom('nodes')
//     .where('id', '=', nodeId)
//     .selectAll()
//     .executeTakeFirst();

//   if (!collaboratorNode) {
//     return;
//   }

//   const workspaceUser = await database
//     .selectFrom('workspace_users')
//     .where('id', '=', collaboratorId)
//     .selectAll()
//     .executeTakeFirst();

//   if (!workspaceUser) {
//     return;
//   }

//   const devices = await database
//     .selectFrom('devices')
//     .where('account_id', '=', workspaceUser.account_id)
//     .selectAll()
//     .execute();

//   const deviceIds = devices.map((device) => device.id);
//   if (deviceIds.length === 0) {
//     return;
//   }

//   await processDescendantsSync(
//     collaboratorNode.workspace_id,
//     [collaboratorNode.id],
//     deviceIds,
//   );
// };

// const handleWorkspaceUserSync = async (data: {
//   workspaceId: string;
//   userId: string;
// }) => {
//   const { workspaceId, userId } = data;

//   const userNode = await database
//     .selectFrom('nodes')
//     .where('id', '=', userId)
//     .selectAll()
//     .executeTakeFirst();

//   if (!userNode) {
//     return;
//   }

//   const workspaceUser = await database
//     .selectFrom('workspace_users')
//     .where('id', '=', userId)
//     .selectAll()
//     .executeTakeFirst();

//   if (!workspaceUser) {
//     return;
//   }

//   const devices = await database
//     .selectFrom('devices')
//     .where('account_id', '=', workspaceUser.account_id)
//     .selectAll()
//     .execute();

//   const deviceIds = devices.map((device) => device.id);
//   if (deviceIds.length === 0) {
//     return;
//   }

//   const nodesWithAccess = await database
//     .selectFrom('node_collaborators')
//     .where('collaborator_id', '=', userNode.id)
//     .select('node_id')
//     .execute();

//   const nodeIds = nodesWithAccess.map((node) => node.node_id);
//   if (nodeIds.length === 0) {
//     return;
//   }

//   await processUsersSync(workspaceId, deviceIds);
//   await processDescendantsSync(workspaceId, nodeIds, deviceIds);
// };

// const handleAccountDeviceSync = async (data: {
//   accountId: string;
//   deviceId: string;
// }) => {
//   const { accountId, deviceId } = data;

//   const workspaceUsers = await database
//     .selectFrom('workspace_users')
//     .where('account_id', '=', accountId)
//     .selectAll()
//     .execute();

//   for (const workspaceUser of workspaceUsers) {
//     await processUsersSync(workspaceUser.workspace_id, [deviceId]);

//     const nodesWithAccess = await database
//       .selectFrom('node_collaborators')
//       .where('collaborator_id', '=', workspaceUser.id)
//       .select('node_id')
//       .execute();

//     const nodeIds = nodesWithAccess.map((node) => node.node_id);
//     if (nodeIds.length === 0) {
//       continue;
//     }

//     await processDescendantsSync(workspaceUser.workspace_id, nodeIds, [
//       deviceId,
//     ]);
//   }
// };

// const processUsersSync = async (workspaceId: string, deviceIds: string[]) => {
//   let lastProcessedId = '';
//   let hasMoreUsers = true;

//   while (hasMoreUsers) {
//     const users = await database
//       .selectFrom('nodes')
//       .select([
//         'id',
//         'state',
//         'created_at',
//         'created_by',
//         'version_id',
//         'updated_at',
//         'updated_by',
//         'server_created_at',
//         'server_updated_at',
//       ])
//       .where((eb) =>
//         eb.and([
//           eb('workspace_id', '=', workspaceId),
//           eb('type', '=', NodeTypes.User),
//           eb('id', '>', lastProcessedId),
//         ]),
//       )
//       .orderBy('id', 'asc')
//       .limit(SYNC_BATCH_SIZE)
//       .execute();

//     if (users.length === 0) {
//       hasMoreUsers = false;
//       break;
//     }

//     lastProcessedId = users[users.length - 1].id;

//     const nodeSyncData: ServerNodeBatchSyncData[] = [];
//     for (const user of users) {
//       nodeSyncData.push({
//         id: user.id,
//         state: user.state,
//         createdAt: user.created_at.toISOString(),
//         createdBy: user.created_by,
//         versionId: user.version_id,
//         updatedAt: user.updated_at?.toISOString(),
//         updatedBy: user.updated_by,
//         serverCreatedAt: user.server_created_at.toISOString(),
//         serverUpdatedAt: user.server_updated_at?.toISOString(),
//       });
//     }

//     if (nodeSyncData.length === 0) {
//       continue;
//     }

//     const change: ServerChange = {
//       id: generateId(IdType.Change),
//       workspaceId,
//       data: {
//         type: 'node_batch_sync',
//         nodes: nodeSyncData,
//       },
//       createdAt: new Date().toISOString(),
//     };

//     await database.transaction().execute(async (tx) => {
//       await tx
//         .insertInto('changes')
//         .values({
//           id: change.id,
//           workspace_id: change.workspaceId,
//           created_at: new Date(change.createdAt),
//           data: JSON.stringify(change.data),
//         })
//         .execute();

//       await tx
//         .insertInto('change_devices')
//         .values(
//           deviceIds.map((deviceId) => ({
//             change_id: change.id,
//             device_id: deviceId,
//             retry_count: 0,
//           })),
//         )
//         .execute();
//     });

//     await redis.publish(
//       CHANNEL_NAMES.CHANGES,
//       JSON.stringify({
//         changeId: change.id,
//         deviceIds,
//       }),
//     );

//     if (users.length < SYNC_BATCH_SIZE) {
//       hasMoreUsers = false;
//     }
//   }
// };

// const processDescendantsSync = async (
//   workspaceId: string,
//   nodeIds: string[],
//   deviceIds: string[],
// ) => {
//   let lastProcessedId = '';
//   let hasMoreDescendants = true;

//   while (hasMoreDescendants) {
//     const descendantNodes = await database
//       .selectFrom('node_paths as np')
//       .innerJoin('nodes as n', 'np.descendant_id', 'n.id')
//       .select([
//         'n.id',
//         'n.state',
//         'n.created_at',
//         'n.created_by',
//         'n.version_id',
//         'n.updated_at',
//         'n.updated_by',
//         'n.server_created_at',
//         'n.server_updated_at',
//       ])
//       .where((eb) =>
//         eb.and([
//           eb('np.ancestor_id', 'in', nodeIds),
//           eb('np.descendant_id', '>', lastProcessedId),
//         ]),
//       )
//       .orderBy('np.descendant_id', 'asc')
//       .limit(SYNC_BATCH_SIZE)
//       .execute();

//     if (descendantNodes.length === 0) {
//       hasMoreDescendants = false;
//       break;
//     }

//     const nodeSyncData: ServerNodeBatchSyncData[] = [];
//     for (const node of descendantNodes) {
//       nodeSyncData.push({
//         id: node.id,
//         state: node.state,
//         createdAt: node.created_at.toISOString(),
//         createdBy: node.created_by,
//         versionId: node.version_id,
//         updatedAt: node.updated_at?.toISOString(),
//         updatedBy: node.updated_by,
//         serverCreatedAt: node.server_created_at.toISOString(),
//         serverUpdatedAt: node.server_updated_at?.toISOString(),
//       });
//     }

//     lastProcessedId = descendantNodes[descendantNodes.length - 1].id;

//     if (nodeSyncData.length === 0) {
//       continue;
//     }

//     const change: ServerChange = {
//       id: generateId(IdType.Change),
//       workspaceId,
//       data: {
//         type: 'node_batch_sync',
//         nodes: nodeSyncData,
//       },
//       createdAt: new Date().toISOString(),
//     };

//     await database.transaction().execute(async (tx) => {
//       await tx
//         .insertInto('changes')
//         .values({
//           id: change.id,
//           workspace_id: change.workspaceId,
//           created_at: new Date(change.createdAt),
//           data: JSON.stringify(change.data),
//         })
//         .execute();

//       await tx
//         .insertInto('change_devices')
//         .values(
//           deviceIds.map((deviceId) => ({
//             change_id: change.id,
//             device_id: deviceId,
//             retry_count: 0,
//           })),
//         )
//         .execute();
//     });

//     await redis.publish(
//       CHANNEL_NAMES.CHANGES,
//       JSON.stringify({
//         changeId: change.id,
//         deviceIds,
//       }),
//     );

//     if (descendantNodes.length < SYNC_BATCH_SIZE) {
//       hasMoreDescendants = false;
//     }
//   }
// };
