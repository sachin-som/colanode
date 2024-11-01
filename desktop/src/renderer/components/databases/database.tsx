import React from 'react';
import { DatabaseContext } from '@/renderer/contexts/database';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

interface DatabaseProps {
  databaseId: string;
  children: React.ReactNode;
}

export const Database = ({ databaseId, children }: DatabaseProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId: databaseId,
    userId: workspace.userId,
  });

  const { mutate, isPending: isMutating } = useMutation();

  if (isPending || isMutating || !data) {
    return null;
  }

  if (data.type !== 'database') {
    return null;
  }

  return (
    <DatabaseContext.Provider
      value={{
        id: data.id,
        name: data.attributes.name,
        fields: Object.values(data.attributes.fields),
        views: Object.values(data.attributes.views),
        createField: (type, name) => {
          mutate({
            input: {
              type: 'field_create',
              databaseId: data.id,
              name,
              fieldType: type,
              userId: workspace.userId,
            },
          });
        },
        renameField: (id, name) => {
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: data.id,
              path: `fields.${id}.name`,
              value: name,
              userId: workspace.userId,
            },
          });
        },
        deleteField: (id) => {
          mutate({
            input: {
              type: 'node_attribute_delete',
              nodeId: data.id,
              path: `fields.${id}`,
              userId: workspace.userId,
            },
          });
        },
        createSelectOption: (fieldId, name, color) => {
          mutate({
            input: {
              type: 'select_option_create',
              databaseId: data.id,
              fieldId,
              name,
              color,
              userId: workspace.userId,
            },
          });
        },
        updateSelectOption: (fieldId, attributes) => {
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: data.id,
              path: `fields.${fieldId}.options.${attributes.id}`,
              value: attributes,
              userId: workspace.userId,
            },
          });
        },
        deleteSelectOption: (fieldId, optionId) => {
          mutate({
            input: {
              type: 'node_attribute_delete',
              nodeId: data.id,
              path: `fields.${fieldId}.options.${optionId}`,
              userId: workspace.userId,
            },
          });
        },
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
