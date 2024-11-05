import { SelectWorkspaceUser } from '@/data/schema';
import { hasEditorAccess, NodeTypes } from '@/lib/constants';
import { extractNodeRole, fetchNodeAncestors } from '@/lib/nodes';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';
import { Validator } from '@/types/validators';

export class FileValidator implements Validator {
  async canCreate(
    workspaceUser: SelectWorkspaceUser,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (!attributes.parentId) {
      return false;
    }

    const ancestors = await fetchNodeAncestors(attributes.parentId);
    if (ancestors.length === 0) {
      return false;
    }

    const parent = ancestors.find(
      (ancestor) => ancestor.id === attributes.parentId,
    );

    if (!parent) {
      return false;
    }

    if (parent.type === NodeTypes.File) {
      return parent.created_by === workspaceUser.id;
    }

    const role = extractNodeRole(ancestors, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasEditorAccess(role);
  }

  async canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (!attributes.parentId) {
      return false;
    }

    const ancestors = await fetchNodeAncestors(attributes.parentId);
    if (ancestors.length === 0) {
      return false;
    }

    const parent = ancestors.find(
      (ancestor) => ancestor.id === attributes.parentId,
    );

    if (!parent) {
      return false;
    }

    if (parent.type === NodeTypes.File) {
      return parent.created_by === workspaceUser.id;
    }

    const role = extractNodeRole(ancestors, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasEditorAccess(role);
  }

  async canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
  ): Promise<boolean> {
    if (!node.parentId) {
      return false;
    }

    const ancestors = await fetchNodeAncestors(node.parentId);
    if (ancestors.length === 0) {
      return false;
    }

    const parent = ancestors.find((ancestor) => ancestor.id === node.parentId);
    if (!parent) {
      return false;
    }

    if (parent.type === NodeTypes.File) {
      return parent.created_by === workspaceUser.id;
    }

    const role = extractNodeRole(ancestors, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasEditorAccess(role);
  }
}
