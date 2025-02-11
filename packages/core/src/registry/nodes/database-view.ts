import { z } from 'zod';

import { NodeModel } from './core';

import { NodeAttributes } from '.';

export const databaseViewFieldAttributesSchema = z.object({
  id: z.string(),
  width: z.number().nullable().optional(),
  display: z.boolean().nullable().optional(),
  index: z.string().nullable().optional(),
});

export type DatabaseViewFieldAttributes = z.infer<
  typeof databaseViewFieldAttributesSchema
>;

export const databaseViewFieldFilterAttributesSchema = z.object({
  id: z.string(),
  fieldId: z.string(),
  type: z.literal('field'),
  operator: z.string(),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .nullable()
    .optional(),
});

export type DatabaseViewFieldFilterAttributes = z.infer<
  typeof databaseViewFieldFilterAttributesSchema
>;

export const databaseViewGroupFilterAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('group'),
  operator: z.enum(['and', 'or']),
  filters: z.array(databaseViewFieldFilterAttributesSchema),
});

export type DatabaseViewGroupFilterAttributes = z.infer<
  typeof databaseViewGroupFilterAttributesSchema
>;

export const databaseViewSortAttributesSchema = z.object({
  id: z.string(),
  fieldId: z.string(),
  direction: z.enum(['asc', 'desc']),
});

export type DatabaseViewSortAttributes = z.infer<
  typeof databaseViewSortAttributesSchema
>;

export const databaseViewFilterAttributesSchema = z.discriminatedUnion('type', [
  databaseViewFieldFilterAttributesSchema,
  databaseViewGroupFilterAttributesSchema,
]);

export type DatabaseViewFilterAttributes = z.infer<
  typeof databaseViewFilterAttributesSchema
>;

export const databaseViewAttributesSchema = z.object({
  type: z.literal('database_view'),
  parentId: z.string(),
  layout: z.enum(['table', 'board', 'calendar']),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  index: z.string(),
  fields: z
    .record(z.string(), databaseViewFieldAttributesSchema)
    .optional()
    .nullable(),
  filters: z
    .record(z.string(), databaseViewFilterAttributesSchema)
    .optional()
    .nullable(),
  sorts: z
    .record(z.string(), databaseViewSortAttributesSchema)
    .optional()
    .nullable(),
  groupBy: z.string().nullable().optional(),
  nameWidth: z.number().nullable().optional(),
});

export type DatabaseViewAttributes = z.infer<
  typeof databaseViewAttributesSchema
>;
export type DatabaseViewLayout = 'table' | 'board' | 'calendar';

export const databaseViewModel: NodeModel = {
  type: 'database_view',
  attributesSchema: databaseViewAttributesSchema,
  canCreate: async (context, _) => {
    return context.hasEditorAccess();
  },
  canUpdate: async (context, _) => {
    return context.hasEditorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasEditorAccess();
  },
  getName: function (
    _: string,
    attributes: NodeAttributes
  ): string | null | undefined {
    if (attributes.type !== 'database_view') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
