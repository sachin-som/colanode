import { z } from 'zod';

export type EntryRole = 'admin' | 'editor' | 'commenter' | 'viewer';
export const entryRoleEnum = z.enum(['admin', 'editor', 'commenter', 'viewer']);
