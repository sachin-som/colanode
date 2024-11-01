import { ZodSchema } from 'zod';

export interface NodeRegistry {
  type: string;
  schema: ZodSchema;
}
