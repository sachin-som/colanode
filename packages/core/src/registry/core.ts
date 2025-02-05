import { z } from 'zod';

export type NodeRole = 'admin' | 'editor' | 'commenter' | 'viewer';
export const nodeRoleEnum = z.enum(['admin', 'editor', 'commenter', 'viewer']);
