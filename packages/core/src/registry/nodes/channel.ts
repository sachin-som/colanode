import { z } from 'zod';

import { NodeModel } from './core';

import { extractNodeRole } from '../../lib/nodes';
import { hasNodeRole } from '../../lib/permissions';

import { NodeAttributes } from '.';

export const channelAttributesSchema = z.object({
  type: z.literal('channel'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
});

export type ChannelAttributes = z.infer<typeof channelAttributesSchema>;

export const channelModel: NodeModel = {
  type: 'channel',
  attributesSchema: channelAttributesSchema,
  canCreate: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateAttributes: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateDocument: () => {
    return false;
  },
  canDelete: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'admin');
  },
  getName: (
    _: string,
    attributes: NodeAttributes
  ): string | null | undefined => {
    if (attributes.type !== 'channel') {
      return null;
    }

    return attributes.name;
  },
  getAttributesText: (): string | null | undefined => {
    return undefined;
  },
  getDocumentText: (): string | null | undefined => {
    return undefined;
  },
};
