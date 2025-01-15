import { Router } from 'express';

import {
  accountSyncHandler,
  emailLoginHandler,
  emailRegisterHandler,
  logoutHandler,
  accountUpdateHandler,
  userCreateHandler,
  userRoleUpdateHandler,
  workspaceCreateHandler,
  workspaceDeleteHandler,
  workspaceGetHandler,
  workspaceUpdateHandler,
  avatarUploadHandler,
  avatarDownloadHandler,
  configGetHandler,
  fileDownloadGetHandler,
  fileUploadInitHandler,
  fileUploadCompleteHandler,
  avatarUploadParameter,
  mutationsSyncHandler,
  emailVerifyHandler,
} from '@/controllers/client';
import { workspaceMiddleware } from '@/middlewares/workspace';
import { authMiddleware } from '@/middlewares/auth';

export const clientRouter = Router();

clientRouter.get('/v1/config', configGetHandler);

clientRouter.post('/v1/accounts/emails/login', emailLoginHandler);

clientRouter.post('/v1/accounts/emails/register', emailRegisterHandler);

clientRouter.post('/v1/accounts/emails/verify', emailVerifyHandler);

clientRouter.delete('/v1/accounts/logout', authMiddleware, logoutHandler);

clientRouter.put(
  '/v1/accounts/:accountId',
  authMiddleware,
  accountUpdateHandler
);

clientRouter.post('/v1/accounts/sync', authMiddleware, accountSyncHandler);

clientRouter.post(
  '/v1/avatars',
  authMiddleware,
  avatarUploadParameter,
  avatarUploadHandler
);

clientRouter.get(
  '/v1/avatars/:avatarId',
  authMiddleware,
  avatarDownloadHandler
);

clientRouter.post('/v1/workspaces', authMiddleware, workspaceCreateHandler);

clientRouter.put(
  '/v1/workspaces/:workspaceId',
  authMiddleware,
  workspaceMiddleware,
  workspaceUpdateHandler
);

clientRouter.delete(
  '/v1/workspaces/:workspaceId',
  authMiddleware,
  workspaceMiddleware,
  workspaceDeleteHandler
);

clientRouter.get(
  '/v1/workspaces/:workspaceId',
  authMiddleware,
  workspaceMiddleware,
  workspaceGetHandler
);

clientRouter.post(
  '/v1/workspaces/:workspaceId/users',
  authMiddleware,
  workspaceMiddleware,
  userCreateHandler
);

clientRouter.put(
  '/v1/workspaces/:workspaceId/users/:userId',
  authMiddleware,
  workspaceMiddleware,
  userRoleUpdateHandler
);

clientRouter.get(
  '/v1/workspaces/:workspaceId/downloads/:fileId',
  authMiddleware,
  workspaceMiddleware,
  fileDownloadGetHandler
);

clientRouter.post(
  '/v1/workspaces/:workspaceId/files',
  authMiddleware,
  workspaceMiddleware,
  fileUploadInitHandler
);

clientRouter.put(
  '/v1/workspaces/:workspaceId/files/:fileId',
  authMiddleware,
  workspaceMiddleware,
  fileUploadCompleteHandler
);

clientRouter.post(
  '/v1/workspaces/:workspaceId/mutations',
  authMiddleware,
  workspaceMiddleware,
  mutationsSyncHandler
);
