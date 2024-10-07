import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import {
  Breadcrumb as BreadcrumbWrapper,
  BreadcrumbItem as BreadcrumbItemWrapper,
  BreadcrumbList,
} from '@/renderer/components/ui/breadcrumb';
import { BreadcrumbItem } from '@/renderer/components/workspaces/containers/breadcrumb-item';

interface ChatBreadcrumbProps {
  chatId: string;
}

export const ChatBreadcrumb = ({ chatId }: ChatBreadcrumbProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'chat_get',
    chatId,
    userId: workspace.userId,
  });

  if (isPending || !data) {
    return null;
  }

  return (
    <BreadcrumbWrapper>
      <BreadcrumbList>
        <BreadcrumbItemWrapper>
          <BreadcrumbItem
            node={{
              id: data.id,
              type: 'chat',
              name: data.name,
              avatar: data.avatar,
            }}
          />
        </BreadcrumbItemWrapper>
      </BreadcrumbList>
    </BreadcrumbWrapper>
  );
};
