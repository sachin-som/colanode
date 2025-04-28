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
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateAttributes: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateDocument: () => {
    return false;
  },
  canDelete: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'admin');
  },
  canReact: () => {
    return false;
  },
  extractText: (_: string, attributes: NodeAttributes) => {
    if (attributes.type !== 'channel') {
      throw new Error('Invalid node type');
    }

    return {
      name: attributes.name,
      attributes: null,
    };
  },
  extractMentions: () => {
    return [];
  },
};
